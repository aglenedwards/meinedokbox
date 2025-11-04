import { storage } from "./storage";
import { sendEmail } from "./emailService";
import { db } from "./db";
import { documents } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

function getPaymentReminderEmail(partnerName: string, documentTitle: string, amount: number | null, sender: string | null) {
  const amountStr = amount !== null && amount !== undefined 
    ? `Betrag: ${(amount / 100).toFixed(2)} €` 
    : '';
  const senderStr = sender ? `Absender: ${sender}` : '';
  
  const subject = `💶 Zahlungserinnerung: ${documentTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">💶 Zahlungserinnerung</h1>
        </div>
        <div class="content">
          <p>Hallo${partnerName ? ` ${partnerName}` : ''},</p>
          
          <p>dies ist eine freundliche Erinnerung für eine unbezahlte Rechnung in eurer gemeinsamen DokBox:</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2563eb;">${documentTitle}</h2>
            ${senderStr ? `<p><strong>${senderStr}</strong></p>` : ''}
            ${amountStr ? `<p style="font-size: 18px;"><strong>${amountStr}</strong></p>` : ''}
            <p style="color: #6b7280; font-size: 14px;">Hochgeladen vor mehr als 7 Tagen</p>
          </div>
          
          <p>Falls die Rechnung bereits bezahlt wurde, könnt ihr sie in der App als <span class="highlight">"bezahlt"</span> markieren, um keine weiteren Erinnerungen zu erhalten.</p>
          
          <p>Diese Erinnerung wird nur einmal verschickt.</p>
          
          <div class="footer">
            <p><strong>MeineDokBox</strong><br>
            Intelligente Dokumentenverwaltung für Familien</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Zahlungserinnerung

Hallo${partnerName ? ` ${partnerName}` : ''},

dies ist eine freundliche Erinnerung für eine unbezahlte Rechnung in eurer gemeinsamen DokBox:

Dokument: ${documentTitle}
${senderStr}
${amountStr}
Hochgeladen: vor mehr als 7 Tagen

Falls die Rechnung bereits bezahlt wurde, könnt ihr sie in der App als "bezahlt" markieren, um keine weiteren Erinnerungen zu erhalten.

Diese Erinnerung wird nur einmal verschickt.

MeineDokBox
Intelligente Dokumentenverwaltung für Familien
  `;
  
  return { subject, html, text };
}

export async function checkAndSendPaymentReminders(): Promise<void> {
  try {
    console.log('[PaymentReminderCron] Starting check for payment reminders...');
    
    // Find unpaid invoices that:
    // 1. Have paymentStatus = 'unpaid'
    // 2. Were uploaded more than 7 days ago
    // 3. Haven't had a reminder sent yet (paymentReminderSentAt IS NULL)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const unpaidInvoices = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.paymentStatus, 'unpaid'),
          isNull(documents.paymentReminderSentAt),
          sql`${documents.uploadedAt} <= ${sevenDaysAgo.toISOString()}`
        )
      );
    
    console.log(`[PaymentReminderCron] Found ${unpaidInvoices.length} unpaid invoices needing reminders`);
    
    for (const invoice of unpaidInvoices) {
      try {
        // Check if this document is shared with a partner
        const sharedWith = await storage.getSharedAccessByDocument(invoice.id);
        
        if (sharedWith.length === 0) {
          console.log(`[PaymentReminderCron] Document ${invoice.id} not shared, skipping email`);
          // Still mark reminder as sent to avoid checking again
          await storage.updateDocumentPaymentReminderSent(invoice.id);
          continue;
        }
        
        // Get partner details
        const partnerId = sharedWith[0].userId;
        const partner = await storage.getUserById(partnerId);
        
        if (!partner || !partner.email) {
          console.log(`[PaymentReminderCron] Partner ${partnerId} has no email, skipping`);
          await storage.updateDocumentPaymentReminderSent(invoice.id);
          continue;
        }
        
        // Send reminder email to partner
        const partnerName = partner.firstName || '';
        const { subject, html, text } = getPaymentReminderEmail(
          partnerName,
          invoice.title,
          invoice.amount,
          invoice.sender
        );
        
        await sendEmail({
          to: partner.email,
          subject,
          html,
          text
        });
        
        // Mark reminder as sent
        await storage.updateDocumentPaymentReminderSent(invoice.id);
        
        console.log(`[PaymentReminderCron] Sent payment reminder for document ${invoice.id} to ${partner.email}`);
      } catch (error) {
        console.error(`[PaymentReminderCron] Error processing invoice ${invoice.id}:`, error);
        // Continue with next invoice
      }
    }
    
    console.log('[PaymentReminderCron] Finished checking payment reminders');
  } catch (error) {
    console.error('[PaymentReminderCron] Error during payment reminder check:', error);
  }
}

// Run the cron job every 6 hours
export function startPaymentReminderCron(): void {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
  
  console.log('[PaymentReminderCron] Starting cron job (runs every 6 hours)');
  
  // Run immediately on startup
  checkAndSendPaymentReminders();
  
  // Then run every 6 hours
  setInterval(() => {
    checkAndSendPaymentReminders();
  }, INTERVAL_MS);
}
