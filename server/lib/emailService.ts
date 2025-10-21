import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const APP_URL = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'http://localhost:5000';

export async function sendInvitationEmail(
  toEmail: string,
  token: string,
  inviterEmail: string
): Promise<void> {
  const acceptUrl = `${APP_URL}/accept-invite?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">PaperEase</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Einladung zu einem Team</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hallo!</h2>
    
    <p><strong>${inviterEmail}</strong> hat Sie eingeladen, einem PaperEase-Team beizutreten.</p>
    
    <p>Mit PaperEase können Sie gemeinsam Dokumente verwalten, organisieren und durchsuchen – alles an einem Ort.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Einladung annehmen</a>
    </div>
    
    <p style="color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
      Diese Einladung ist 7 Tage gültig. Wenn Sie die Einladung nicht annehmen möchten, können Sie diese E-Mail ignorieren.
    </p>
    
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
      <a href="${acceptUrl}" style="color: #667eea; word-break: break-all;">${acceptUrl}</a>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>PaperEase - Intelligente Dokumentenverwaltung</p>
  </div>
</body>
</html>
  `;

  const textContent = `
PaperEase - Einladung zu einem Team

Hallo!

${inviterEmail} hat Sie eingeladen, einem PaperEase-Team beizutreten.

Mit PaperEase können Sie gemeinsam Dokumente verwalten, organisieren und durchsuchen – alles an einem Ort.

Klicken Sie auf den folgenden Link, um die Einladung anzunehmen:
${acceptUrl}

Diese Einladung ist 7 Tage gültig.

---
PaperEase - Intelligente Dokumentenverwaltung
  `;

  try {
    await mg.messages.create(MAILGUN_DOMAIN, {
      from: `PaperEase <noreply@${MAILGUN_DOMAIN}>`,
      to: [toEmail],
      subject: `Einladung zu PaperEase von ${inviterEmail}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email Service] Invitation email sent to ${toEmail}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send invitation email to ${toEmail}:`, error);
    throw error;
  }
}
