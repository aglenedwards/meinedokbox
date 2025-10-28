import { storage } from "./storage";
import { sendEmail, getDay7Email, getGraceStartEmail, getGraceLastDayEmail, getReadOnlyStartEmail } from "./emailService";

export async function checkAndSendTrialNotifications(): Promise<void> {
  try {
    console.log('[TrialNotificationCron] Starting check for trial notifications...');
    
    const users = await storage.getUsersNeedingTrialNotifications();
    console.log(`[TrialNotificationCron] Found ${users.length} users in trial period`);

    const now = new Date();

    for (const user of users) {
      if (!user.trialEndsAt || !user.email) {
        continue;
      }

      const trialEndDate = new Date(user.trialEndsAt);
      const daysUntilExpiry = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysAfterExpiry = Math.ceil((now.getTime() - trialEndDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`[TrialNotificationCron] User ${user.id}: daysUntilExpiry=${daysUntilExpiry}, daysAfterExpiry=${daysAfterExpiry}`);

      // Day 7: Trial ends tomorrow
      if (daysUntilExpiry === 1) {
        const alreadySent = await storage.getTrialNotification(user.id, 'day_14');
        if (!alreadySent) {
          const userName = user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : '';
          const { subject, html, text } = getDay7Email(userName);
          await sendEmail({ to: user.email, subject, html, text });
          await storage.createTrialNotification({
            userId: user.id,
            notificationType: 'day_14',
            emailStatus: 'sent'
          });
          console.log(`[TrialNotificationCron] Sent day_14 email to ${user.email}`);
        }
      }

      // Day 15: Grace period starts (trial just expired)
      if (daysAfterExpiry === 1) {
        const alreadySent = await storage.getTrialNotification(user.id, 'grace_start');
        if (!alreadySent) {
          const userName = user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : '';
          const { subject, html, text } = getGraceStartEmail(userName);
          await sendEmail({ to: user.email, subject, html, text });
          await storage.createTrialNotification({
            userId: user.id,
            notificationType: 'grace_start',
            emailStatus: 'sent'
          });
          console.log(`[TrialNotificationCron] Sent grace_start email to ${user.email}`);
        }
      }

      // Day 17: Last day of grace period
      if (daysAfterExpiry === 3) {
        const alreadySent = await storage.getTrialNotification(user.id, 'grace_last_day');
        if (!alreadySent) {
          const userName = user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : '';
          const { subject, html, text } = getGraceLastDayEmail(userName);
          await sendEmail({ to: user.email, subject, html, text });
          await storage.createTrialNotification({
            userId: user.id,
            notificationType: 'grace_last_day',
            emailStatus: 'sent'
          });
          console.log(`[TrialNotificationCron] Sent grace_last_day email to ${user.email}`);
        }
      }

      // Day 18: Read-only mode activated
      if (daysAfterExpiry === 4) {
        const alreadySent = await storage.getTrialNotification(user.id, 'readonly_start');
        if (!alreadySent) {
          const userName = user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : '';
          const { subject, html, text } = getReadOnlyStartEmail(userName);
          await sendEmail({ to: user.email, subject, html, text });
          await storage.createTrialNotification({
            userId: user.id,
            notificationType: 'readonly_start',
            emailStatus: 'sent'
          });
          console.log(`[TrialNotificationCron] Sent readonly_start email to ${user.email}`);
        }
      }
    }

    console.log('[TrialNotificationCron] Finished checking trial notifications');
  } catch (error) {
    console.error('[TrialNotificationCron] Error during trial notification check:', error);
  }
}

// Run the cron job every hour
export function startTrialNotificationCron(): void {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  console.log('[TrialNotificationCron] Starting cron job (runs every hour)');
  
  // Run immediately on startup
  checkAndSendTrialNotifications();
  
  // Then run every hour
  setInterval(() => {
    checkAndSendTrialNotifications();
  }, INTERVAL_MS);
}
