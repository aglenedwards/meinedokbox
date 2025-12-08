import { storage } from '../storage';
import { sendSharedAccessInvitation, sendVerificationEmail } from './sendEmail';
import type { EmailJob } from '@shared/schema';

// Backoff delays in milliseconds: 1min, 5min, 15min
const RETRY_DELAYS_MS = [60000, 300000, 900000];

// Rate limiting: max 10 emails per minute
const RATE_LIMIT_EMAILS = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

class EmailQueue {
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private emailsSentInWindow: number = 0;
  private windowStartTime: number = Date.now();

  constructor() {
    this.startProcessing();
    // DON'T process immediately on startup - wait for first interval
  }

  /**
   * Check and reset rate limit window
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.windowStartTime >= RATE_LIMIT_WINDOW_MS) {
      // Reset window
      this.windowStartTime = now;
      this.emailsSentInWindow = 0;
    }
    
    if (this.emailsSentInWindow >= RATE_LIMIT_EMAILS) {
      console.log(`[EmailQueue] ⏳ Rate limit reached (${RATE_LIMIT_EMAILS}/min). Waiting...`);
      return false;
    }
    
    return true;
  }

  /**
   * Add verification email to queue (with duplicate check)
   */
  async enqueueVerificationEmail(email: string, name: string, token: string): Promise<void> {
    // Check for existing pending/processing job for same email and type
    const existingJobs = await storage.getPendingEmailJobsByEmail(email, 'verification');
    if (existingJobs.length > 0) {
      console.log(`[EmailQueue] ⚠️ Duplicate verification email for ${email} already in queue - skipping`);
      return;
    }
    
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
  }

  /**
   * Add invitation email to queue (with duplicate check)
   */
  async enqueueInvitationEmail(email: string, ownerName: string, token: string): Promise<void> {
    // Check for existing pending/processing job for same email and type
    const existingJobs = await storage.getPendingEmailJobsByEmail(email, 'invitation');
    if (existingJobs.length > 0) {
      console.log(`[EmailQueue] ⚠️ Duplicate invitation email for ${email} already in queue - skipping`);
      return;
    }
    
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
  }

  /**
   * Check if enough time has passed since last attempt (exponential backoff)
   */
  private shouldRetryNow(job: EmailJob): boolean {
    if (!job.lastAttemptAt || job.attempts === 0) {
      return true; // First attempt
    }
    
    const attemptIndex = Math.min(job.attempts - 1, RETRY_DELAYS_MS.length - 1);
    const requiredDelay = RETRY_DELAYS_MS[attemptIndex];
    const timeSinceLastAttempt = Date.now() - new Date(job.lastAttemptAt).getTime();
    
    if (timeSinceLastAttempt < requiredDelay) {
      const remainingWait = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000);
      console.log(`[EmailQueue] ⏳ Job ${job.id} needs to wait ${remainingWait}s more before retry`);
      return false;
    }
    
    return true;
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

      // Filter jobs that are ready for retry (respecting backoff)
      const readyJobs = pendingJobs.filter(job => this.shouldRetryNow(job));
      
      if (readyJobs.length === 0) {
        this.processing = false;
        return;
      }

      console.log(`[EmailQueue] 📬 Processing ${readyJobs.length} email jobs (${pendingJobs.length - readyJobs.length} waiting for backoff)`);

      // Process jobs with rate limiting
      for (const job of readyJobs) {
        if (!this.checkRateLimit()) {
          console.log(`[EmailQueue] ⏳ Rate limit hit, stopping processing for this cycle`);
          break;
        }
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
        this.emailsSentInWindow++; // Count successful sends
        
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
        const nextDelay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
        const nextDelayMin = Math.round(nextDelay / 60000);
        console.log(`[EmailQueue] 🔄 Will retry ${job.type} email for ${job.email} in ${nextDelayMin} min (${job.maxAttempts - attempts} retries left)`);
        
        // Update job back to pending with error and attempt count
        // Job will wait for backoff before being retried
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
