import { storage } from "./storage";
import { sendReferralProgramInfoEmail } from "./lib/sendEmail";

export async function checkAndSendReferralEmails(): Promise<void> {
  try {
    console.log('[ReferralEmailCron] Starting check for day-8 referral emails...');
    
    const usersNeedingEmail = await storage.getUsersNeedingReferralEmail();
    console.log(`[ReferralEmailCron] Found ${usersNeedingEmail.length} users needing referral program info`);

    for (const user of usersNeedingEmail) {
      if (!user.email) {
        console.log(`[ReferralEmailCron] Skipping user ${user.id} - no email`);
        continue;
      }

      try {
        const referralCode = await storage.ensureUserHasReferralCode(user.id);
        const userName = user.firstName || 'Nutzer';
        
        const success = await sendReferralProgramInfoEmail(user.email, userName, referralCode);
        
        if (success) {
          await storage.markReferralEmailSent(user.id);
          console.log(`[ReferralEmailCron] Sent referral program email to ${user.email}`);
        } else {
          console.error(`[ReferralEmailCron] Failed to send email to ${user.email}`);
        }
      } catch (error) {
        console.error(`[ReferralEmailCron] Error processing user ${user.id}:`, error);
      }
    }

    console.log('[ReferralEmailCron] Finished checking referral emails');
  } catch (error) {
    console.error('[ReferralEmailCron] Error during referral email check:', error);
  }
}

export function startReferralEmailCron(): void {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  console.log('[ReferralEmailCron] Starting cron job (runs every 24 hours)');
  
  checkAndSendReferralEmails();
  
  setInterval(() => {
    checkAndSendReferralEmails();
  }, INTERVAL_MS);
}
