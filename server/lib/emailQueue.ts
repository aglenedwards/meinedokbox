import fs from 'fs/promises';
import path from 'path';
import { sendSharedAccessInvitation, sendVerificationEmail } from './sendEmail';

interface EmailJob {
  id: string;
  type: 'verification' | 'invitation';
  data: {
    email: string;
    name?: string;
    token: string;
  };
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

class EmailQueue {
  private queue: EmailJob[] = [];
  private processing: boolean = false;
  private failedJobsPath: string;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.failedJobsPath = path.join(process.cwd(), 'email-failed-jobs.json');
    this.startProcessing();
    this.loadFailedJobs();
  }

  /**
   * Add verification email to queue
   */
  async enqueueVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const job: EmailJob = {
      id: `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'verification',
      data: { email, name, token },
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    console.log(`[EmailQueue] ✉️ Enqueued verification email for ${email}`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Add invitation email to queue
   */
  async enqueueInvitationEmail(email: string, ownerName: string, token: string): Promise<void> {
    const job: EmailJob = {
      id: `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'invitation',
      data: { email, name: ownerName, token },
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    console.log(`[EmailQueue] ✉️ Enqueued invitation email for ${email}`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process all jobs in queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      await this.processJob(job);
    }

    this.processing = false;
  }

  /**
   * Process a single email job
   */
  private async processJob(job: EmailJob): Promise<void> {
    job.attempts++;
    job.lastAttemptAt = new Date();

    console.log(`[EmailQueue] 📨 Processing ${job.type} email for ${job.data.email} (attempt ${job.attempts}/${job.maxAttempts})`);

    try {
      let success = false;

      if (job.type === 'verification') {
        success = await sendVerificationEmail(job.data.email, job.data.name || 'User', job.data.token);
      } else if (job.type === 'invitation') {
        success = await sendSharedAccessInvitation(job.data.email, job.data.name || 'Ein Nutzer', job.data.token);
      }

      if (success) {
        console.log(`[EmailQueue] ✅ Successfully sent ${job.type} email to ${job.data.email}`);
      } else {
        throw new Error('Email sending returned false');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EmailQueue] ❌ Failed to send ${job.type} email to ${job.data.email}: ${errorMessage}`);

      job.error = errorMessage;

      // Retry if under max attempts
      if (job.attempts < job.maxAttempts) {
        console.log(`[EmailQueue] 🔄 Retrying ${job.type} email for ${job.data.email} (${job.maxAttempts - job.attempts} retries left)`);
        
        // Exponential backoff: wait before re-adding to queue
        const delayMs = Math.min(1000 * Math.pow(2, job.attempts), 30000); // Max 30 seconds
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        this.queue.push(job); // Re-add to queue
      } else {
        console.error(`[EmailQueue] 💀 Max attempts reached for ${job.type} email to ${job.data.email}. Moving to failed jobs.`);
        await this.saveFailedJob(job);
      }
    }
  }

  /**
   * Save failed job to persistent storage
   */
  private async saveFailedJob(job: EmailJob): Promise<void> {
    try {
      let failedJobs: EmailJob[] = [];

      try {
        const fileContent = await fs.readFile(this.failedJobsPath, 'utf-8');
        failedJobs = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist yet, start with empty array
        failedJobs = [];
      }

      failedJobs.push(job);
      await fs.writeFile(this.failedJobsPath, JSON.stringify(failedJobs, null, 2));
      
      console.log(`[EmailQueue] 💾 Saved failed job ${job.id} to disk`);
    } catch (error) {
      console.error('[EmailQueue] Failed to save failed job to disk:', error);
    }
  }

  /**
   * Load failed jobs from disk and retry them
   */
  private async loadFailedJobs(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.failedJobsPath, 'utf-8');
      const failedJobs: EmailJob[] = JSON.parse(fileContent);

      if (failedJobs.length > 0) {
        console.log(`[EmailQueue] 🔄 Found ${failedJobs.length} failed jobs. Retrying...`);
        
        // Reset attempts for retry
        failedJobs.forEach(job => {
          job.attempts = 0;
          job.error = undefined;
        });

        this.queue.push(...failedJobs);

        // Clear failed jobs file after loading
        await fs.writeFile(this.failedJobsPath, JSON.stringify([], null, 2));
        
        this.processQueue();
      }
    } catch (error) {
      // File doesn't exist or can't be read - that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[EmailQueue] Error loading failed jobs:', error);
      }
    }
  }

  /**
   * Start background processing every 30 seconds for failed jobs
   */
  private startProcessing(): void {
    // Check for failed jobs every 30 seconds
    this.processingInterval = setInterval(() => {
      this.loadFailedJobs();
    }, 30000);

    console.log('[EmailQueue] 🚀 Email queue started with 30s retry interval');
  }

  /**
   * Stop background processing (for cleanup)
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('[EmailQueue] 🛑 Email queue stopped');
  }

  /**
   * Get current queue status
   */
  getStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.queue.length,
      processing: this.processing,
    };
  }
}

// Singleton instance
export const emailQueue = new EmailQueue();
