import { storage } from '../storage';
import { sendSharedAccessInvitation, sendVerificationEmail } from './sendEmail';
import type { EmailJob } from '@shared/schema';

class EmailQueue {
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
    // Start processing any pending jobs immediately
    this.processQueue();
  }

  /**
   * Add verification email to queue
   */
  async enqueueVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const jobId = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    await storage.createEmailJob({
      id: jobId,
      type: 'verification',
      email,
      name,
      token,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
    });

    console.log(`[EmailQueue] ✉️ Enqueued verification email for ${email} (Job ID: ${jobId})`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Add invitation email to queue
   */
  async enqueueInvitationEmail(email: string, ownerName: string, token: string): Promise<void> {
    const jobId = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    await storage.createEmailJob({
      id: jobId,
      type: 'invitation',
      email,
      name: ownerName,
      token,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
    });

    console.log(`[EmailQueue] ✉️ Enqueued invitation email for ${email} (Job ID: ${jobId})`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process all pending jobs in queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      // Get pending jobs from database
      const pendingJobs = await storage.getPendingEmailJobs(10);

      if (pendingJobs.length === 0) {
        this.processing = false;
        return;
      }

      console.log(`[EmailQueue] 📬 Processing ${pendingJobs.length} pending email jobs`);

      // Process all jobs sequentially
      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('[EmailQueue] Error processing queue:', error);
    }

    this.processing = false;
  }

  /**
   * Process a single email job
   */
  private async processJob(job: EmailJob): Promise<void> {
    const attempts = (job.attempts || 0) + 1;

    // Update job to processing status
    await storage.updateEmailJob(job.id, {
      status: 'processing',
      attempts,
      lastAttemptAt: new Date(),
    });

    console.log(`[EmailQueue] 📨 Processing ${job.type} email for ${job.email} (attempt ${attempts}/${job.maxAttempts})`);

    try {
      let success = false;

      if (job.type === 'verification') {
        success = await sendVerificationEmail(job.email, job.name || 'User', job.token);
      } else if (job.type === 'invitation') {
        success = await sendSharedAccessInvitation(job.email, job.name || 'Ein Nutzer', job.token);
      }

      if (success) {
        console.log(`[EmailQueue] ✅ Successfully sent ${job.type} email to ${job.email}`);
        
        // Mark as success and delete from queue
        await storage.deleteEmailJob(job.id);
      } else {
        throw new Error('Email sending returned false');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EmailQueue] ❌ Failed to send ${job.type} email to ${job.email}: ${errorMessage}`);

      // Retry if under max attempts
      if (attempts < job.maxAttempts) {
        console.log(`[EmailQueue] 🔄 Will retry ${job.type} email for ${job.email} (${job.maxAttempts - attempts} retries left)`);
        
        // Update job back to pending with error and attempt count
        await storage.updateEmailJob(job.id, {
          status: 'pending',
          attempts,
          error: errorMessage,
        });
      } else {
        console.error(`[EmailQueue] 💀 Max attempts reached for ${job.type} email to ${job.email}. Marking as failed.`);
        
        // Mark as failed (keep in DB for debugging)
        await storage.updateEmailJob(job.id, {
          status: 'failed',
          attempts,
          error: errorMessage,
        });
      }
    }
  }

  /**
   * Start background processing every 30 seconds for pending jobs
   */
  private startProcessing(): void {
    // Check for pending jobs every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000);

    console.log('[EmailQueue] 🚀 Email queue started with 30s check interval (PostgreSQL-backed)');
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
  async getStatus(): Promise<{ pending: number; processing: boolean }> {
    const pendingJobs = await storage.getPendingEmailJobs(1000);
    return {
      pending: pendingJobs.length,
      processing: this.processing,
    };
  }
}

// Singleton instance
export const emailQueue = new EmailQueue();
