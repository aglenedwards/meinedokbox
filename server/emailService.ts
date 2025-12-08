import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = getTransporter();
  
  await transport.sendMail({
    from: `"MeineDokBox" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

// Trial notification email templates

// TAG 3: Engagement Email - Feature Highlights
export function getDay3Email(userName: string): { subject: string; html: string; text: string } {
  const subject = "Schon gesehen, wie schnell DokBox deine Belege sortiert? 🎉";
  const text = `Hallo ${userName},\n\ndu bist jetzt seit 3 Tagen dabei – wie läuft's?\n\nDie meisten Nutzer sind begeistert, wie schnell die KI ihre Belege automatisch sortiert. Rechnungen, Verträge, Arztbelege – alles landet automatisch im richtigen Ordner.\n\nDu hast noch 4 Tage Trial-Zeit, um alle Features auszuprobieren:\n✓ KI-Kategorisierung in 15+ Kategorien\n✓ Smartphone-Kamera-Upload\n✓ Private & geteilte Ordner\n✓ E-Mail-Eingang für Dokumente\n\nNutze die Zeit und probiere alle Features aus!\n\nViele Grüße,\nIhr MeineDokBox Team`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">Schon gesehen? 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo${userName ? ' ' + userName : ''},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                du bist jetzt seit <strong>3 Tagen</strong> dabei – wie läuft's?
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Die meisten Nutzer sind begeistert, wie schnell die KI ihre Belege automatisch sortiert. Rechnungen, Verträge, Arztbelege – alles landet automatisch im richtigen Ordner.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 24px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.9);">Du hast noch</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff;">4 Tage</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Trial-Zeit</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #1a1a1a;">Features, die du ausprobieren solltest:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 20px; margin-right: 12px;">🤖</span>
                    <span style="font-size: 14px; color: #333;">KI-Kategorisierung in 15+ Kategorien</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 20px; margin-right: 12px;">📱</span>
                    <span style="font-size: 14px; color: #333;">Smartphone-Kamera-Upload</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 20px; margin-right: 12px;">🔒</span>
                    <span style="font-size: 14px; color: #333;">Private & geteilte Ordner</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 20px; margin-right: 12px;">📧</span>
                    <span style="font-size: 14px; color: #333;">E-Mail-Eingang für Dokumente</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/documents` : '/documents'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Jetzt weiter ausprobieren</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
                Viele Grüße,<br>
                Ihr <strong>MeineDokBox</strong> Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

// TAG 6: Urgency Email - Loss Aversion
export function getDay6Email(userName: string): { subject: string; html: string; text: string } {
  const subject = "Deine Testphase endet morgen – sichere dir deine smarten Ordner dauerhaft 📁";
  const text = `Hallo ${userName},\n\ndeine 7-tägige Testphase endet morgen.\n\nDeine Dokumente sind bereits perfekt sortiert in deinen smarten Ordnern. Möchtest du sie wirklich verlieren?\n\nWähle jetzt deinen Plan und behalte:\n✓ Alle deine sortierten Dokumente\n✓ KI-gestützte automatische Kategorisierung\n✓ Zugriff von jedem Gerät\n✓ Sicherer Cloud-Speicher in Deutschland\n\nUnsere Pläne:\n- Solo: €4,99/Monat (1 Nutzer, 100 Uploads, 5GB)\n- Family: €7,99/Monat (2 Nutzer, 200 Uploads, 10GB) - EMPFOHLEN\n- Family Plus: €11,99/Monat (4 Nutzer, 500 Uploads, 25GB)\n\nSichere dir jetzt deinen Plan – dauert nur 2 Minuten!\n\nViele Grüße,\nIhr MeineDokBox Team`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid #f59e0b;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">Deine Testphase endet morgen 📁</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo${userName ? ' ' + userName : ''},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                deine <strong style="color: #f59e0b;">7-tägige Testphase endet morgen</strong>.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Deine Dokumente sind bereits perfekt sortiert in deinen smarten Ordnern. <strong>Möchtest du sie wirklich verlieren?</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px;">
                <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #92400e;">Das behältst du mit einem Plan:</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #78350f;">✓ Alle deine sortierten Dokumente</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #78350f;">✓ KI-gestützte automatische Kategorisierung</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #78350f;">✓ Zugriff von jedem Gerät</p>
                <p style="margin: 0; font-size: 14px; color: #78350f;">✓ Sicherer Cloud-Speicher in Deutschland</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing: 0 12px;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-radius: 6px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Solo</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">€4,99<span style="font-size: 14px; font-weight: 400; color: #666;">/Monat</span></div>
                    <div style="font-size: 14px; color: #666;">1 Nutzer • 100 Uploads • 5GB</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px; position: relative;">
                    <div style="position: absolute; top: 12px; right: 12px; background-color: #fbbf24; color: #1a1a1a; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">EMPFOHLEN</div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Family</div>
                    <div style="font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">€7,99<span style="font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.9);">/Monat</span></div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.9);">2 Nutzer • 200 Uploads • 10GB</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-radius: 6px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Family Plus</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">€11,99<span style="font-size: 14px; font-weight: 400; color: #666;">/Monat</span></div>
                    <div style="font-size: 14px; color: #666;">4 Nutzer • 500 Uploads • 25GB</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/#pricing` : '#pricing'}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">Jetzt Plan sichern – dauert 2 Minuten</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
                Viele Grüße,<br>
                Ihr <strong>MeineDokBox</strong> Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

// Document Processing Feedback Email

export interface ProcessedDocument {
  filename: string;
  success: boolean;
  title?: string;
  category?: string;
  amount?: string;
  errorMessage?: string;
}

export interface DocumentProcessingResult {
  senderEmail: string;
  totalAttachments: number;
  processedCount: number;
  documents: ProcessedDocument[];
  accountWarning?: string; // For limits, grace period, etc.
}

export function getDocumentProcessingFeedbackEmail(result: DocumentProcessingResult): { subject: string; html: string; text: string } {
  const { processedCount, totalAttachments, documents, senderEmail, accountWarning } = result;
  
  let subject: string;
  let emoji: string;
  
  if (processedCount === 0) {
    subject = "❌ Dokumente konnten nicht verarbeitet werden";
    emoji = "❌";
  } else if (processedCount === totalAttachments) {
    subject = `✅ ${processedCount} ${processedCount === 1 ? 'Dokument' : 'Dokumente'} erfolgreich verarbeitet`;
    emoji = "✅";
  } else {
    subject = `⚠️ ${processedCount} von ${totalAttachments} Dokumenten verarbeitet`;
    emoji = "⚠️";
  }
  
  // Plain text version
  let text = `Hallo,\n\n`;
  
  if (processedCount === 0) {
    text += `Ihre Dokumente konnten leider nicht verarbeitet werden.\n\n`;
  } else if (processedCount === totalAttachments) {
    text += `Ihre ${processedCount} ${processedCount === 1 ? 'Dokument wurde' : 'Dokumente wurden'} erfolgreich verarbeitet und ${processedCount === 1 ? 'ist' : 'sind'} jetzt in Ihrem Dashboard verfügbar.\n\n`;
  } else {
    text += `${processedCount} von ${totalAttachments} Dokumenten wurden erfolgreich verarbeitet.\n\n`;
  }
  
  // List documents
  for (const doc of documents) {
    if (doc.success) {
      text += `✅ ${doc.filename}\n`;
      if (doc.title) text += `   → ${doc.title}\n`;
      if (doc.category) text += `   → Kategorie: ${doc.category}\n`;
      if (doc.amount) text += `   → Betrag: ${doc.amount}\n`;
    } else {
      text += `❌ ${doc.filename}\n`;
      if (doc.errorMessage) text += `   → ${doc.errorMessage}\n`;
    }
    text += `\n`;
  }
  
  if (accountWarning) {
    text += `\nℹ️ Hinweis: ${accountWarning}\n`;
  }
  
  text += `\nViele Grüße,\nIhr MeineDokBox Team`;
  
  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">${emoji} Dokumenten-Verarbeitung</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                ${processedCount === 0 
                  ? 'Ihre Dokumente konnten leider nicht verarbeitet werden.' 
                  : processedCount === totalAttachments 
                    ? `Ihre <strong>${processedCount} ${processedCount === 1 ? 'Dokument wurde' : 'Dokumente wurden'}</strong> erfolgreich verarbeitet und ${processedCount === 1 ? 'ist' : 'sind'} jetzt in Ihrem Dashboard verfügbar.`
                    : `<strong>${processedCount} von ${totalAttachments}</strong> Dokumenten wurden erfolgreich verarbeitet.`
                }
              </p>
            </td>
          </tr>
          ${accountWarning ? `
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>ℹ️ Hinweis:</strong> ${accountWarning}</p>
              </div>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 0 40px 30px;">
              ${documents.map(doc => `
                <div style="margin-bottom: 20px; padding: 16px; background-color: ${doc.success ? '#f0fdf4' : '#fef2f2'}; border-radius: 6px; border-left: 4px solid ${doc.success ? '#10b981' : '#ef4444'};">
                  <div style="display: flex; align-items: center; margin-bottom: ${doc.success && (doc.title || doc.category || doc.amount) ? '12px' : '0'};">
                    <span style="font-size: 20px; margin-right: 12px;">${doc.success ? '✅' : '❌'}</span>
                    <span style="font-size: 15px; font-weight: 600; color: ${doc.success ? '#065f46' : '#991b1b'};">${doc.filename}</span>
                  </div>
                  ${doc.success && doc.title ? `
                    <div style="margin-left: 32px; font-size: 14px; color: #065f46; margin-bottom: 4px;">
                      <strong>Titel:</strong> ${doc.title}
                    </div>
                  ` : ''}
                  ${doc.success && doc.category ? `
                    <div style="margin-left: 32px; font-size: 14px; color: #065f46; margin-bottom: 4px;">
                      <strong>Kategorie:</strong> ${doc.category}
                    </div>
                  ` : ''}
                  ${doc.success && doc.amount ? `
                    <div style="margin-left: 32px; font-size: 14px; color: #065f46;">
                      <strong>Betrag:</strong> ${doc.amount}
                    </div>
                  ` : ''}
                  ${!doc.success && doc.errorMessage ? `
                    <div style="margin-left: 32px; font-size: 14px; color: #991b1b;">
                      ${doc.errorMessage}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
                Viele Grüße,<br>
                Ihr <strong>MeineDokBox</strong> Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

// Invoice Paid Notification - sent to partner when shared invoice is marked as paid
export function getInvoicePaidNotificationEmail(
  partnerName: string,
  paidByName: string,
  documentTitle: string,
  amount: number | null,
  sender: string | null
): { subject: string; html: string; text: string } {
  const amountStr = amount !== null && amount !== undefined 
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
    : null;
  
  const subject = `Rechnung bezahlt: ${documentTitle}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; font-size: 24px; color: #10b981; font-weight: 600;">Rechnung bezahlt</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333; line-height: 1.6;">
                Hallo${partnerName ? ` ${partnerName}` : ''},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #333; line-height: 1.6;">
                <strong>${paidByName}</strong> hat eine Rechnung in eurer gemeinsamen DokBox als bezahlt markiert:
              </p>
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #065f46;">
                  ${documentTitle}
                </p>
                ${sender ? `<p style="margin: 0 0 8px; font-size: 14px; color: #065f46;">Absender: ${sender}</p>` : ''}
                ${amountStr ? `<p style="margin: 0; font-size: 16px; font-weight: 600; color: #065f46;">Betrag: ${amountStr}</p>` : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
                Viele Grüße,<br>
                Ihr <strong>MeineDokBox</strong> Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Rechnung bezahlt

Hallo${partnerName ? ` ${partnerName}` : ''},

${paidByName} hat eine Rechnung in eurer gemeinsamen DokBox als bezahlt markiert:

Dokument: ${documentTitle}
${sender ? `Absender: ${sender}` : ''}
${amountStr ? `Betrag: ${amountStr}` : ''}

Viele Grüße,
Ihr MeineDokBox Team`;

  return { subject, html, text };
}
