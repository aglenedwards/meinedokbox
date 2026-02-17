import { storage } from "./storage";
import { sendEmail, getDay3Email, getDay6Email } from "./emailService";
import { sendTrackedEmail } from "./lib/sendEmail";

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

      console.log(`[TrialNotificationCron] User ${user.id}: daysUntilExpiry=${daysUntilExpiry}`);

      // Day 3: Engagement Email (4 days remaining)
      if (daysUntilExpiry === 4) {
        const alreadySent = await storage.getTrialNotification(user.id, 'day_3');
        if (!alreadySent) {
          const userName = user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : '';
          const { subject, html, text } = getDay3Email(userName);
          await sendTrackedEmail({ to: user.email, subject, html, text, userId: user.id, emailType: 'trial_day3' });
          await storage.createTrialNotification({
            userId: user.id,
            notificationType: 'day_3',
            emailStatus: 'sent'
          });
          console.log(`[TrialNotificationCron] Sent day_3 email to ${user.email}`);
        }
      }

      // Day 6: Urgency Email (1 day remaining - trial ends tomorrow)
      if (daysUntilExpiry === 1) {
        const alreadySent = await storage.getTrialNotification(user.id, 'day_6');
        if (!alreadySent) {
          const userName = user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : '';
          const { subject, html, text } = getDay6Email(userName);
          await sendTrackedEmail({ to: user.email, subject, html, text, userId: user.id, emailType: 'trial_day6' });
          await storage.createTrialNotification({
            userId: user.id,
            notificationType: 'day_6',
            emailStatus: 'sent'
          });
          console.log(`[TrialNotificationCron] Sent day_6 email to ${user.email}`);
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
