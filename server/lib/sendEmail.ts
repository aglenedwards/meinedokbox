/**
 * Send email using SMTP (Hostinger)
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log(`[Email] Attempting to send email to: ${options.to}`);
  console.log(`[Email] SMTP Host: ${smtpHost ? 'configured' : 'NOT configured'}`);
  console.log(`[Email] SMTP Port: ${smtpPort || 'NOT configured'}`);
  console.log(`[Email] SMTP User: ${smtpUser ? 'configured' : 'NOT configured'}`);

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.error("[Email] ERROR: SMTP credentials not configured");
    return false;
  }

  try {
    // Create transporter with Hostinger SMTP settings
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: true, // true for port 465
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"MeineDokBox" <${smtpUser}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    console.log("[Email] ✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send email:", error);
    return false;
  }
}

/**
 * Send shared access invitation email
 */
export async function sendSharedAccessInvitation(
  to: string,
  ownerName: string
): Promise<boolean> {
  const subject = `${ownerName} lädt Sie zu MeineDokBox ein`;
  
  const text = `
Hallo!

${ownerName} möchte sein MeineDokBox-Konto mit Ihnen teilen.

Mit dieser Einladung erhalten Sie vollen Zugriff auf alle geteilten Dokumente und können gemeinsam Dokumente verwalten.

So akzeptieren Sie die Einladung:
1. Gehen Sie zu MeineDokBox: https://meinedokbox.de
2. Melden Sie sich mit dieser E-Mail-Adresse an (${to})
3. Die Einladung wird automatisch akzeptiert

Bei Fragen können Sie sich jederzeit an ${ownerName} wenden.

Viele Grüße,
Ihr MeineDokBox Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      color: white !important;
      margin: 0 0 10px 0;
    }
    .header p {
      color: white !important;
      margin: 0;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .steps {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .step {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .step:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div style="background: #667eea; color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 24px;">📂 MeineDokBox</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Einladung zum gemeinsamen Dokumenten-Management</p>
  </div>
  
  <div class="content">
    <p>Hallo!</p>
    
    <p><strong>${ownerName}</strong> möchte sein MeineDokBox-Konto mit Ihnen teilen.</p>
    
    <p>Mit dieser Einladung erhalten Sie vollen Zugriff auf alle geteilten Dokumente und können gemeinsam Dokumente verwalten.</p>
    
    <div class="steps">
      <h3>So akzeptieren Sie die Einladung:</h3>
      <div class="step">Gehen Sie zu MeineDokBox</div>
      <div class="step">Melden Sie sich mit dieser E-Mail-Adresse an (<strong>${to}</strong>)</div>
      <div class="step">Die Einladung wird automatisch akzeptiert</div>
    </div>
    
    <center>
      <a href="https://meinedokbox.de" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Jetzt anmelden
      </a>
    </center>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Bei Fragen können Sie sich jederzeit an ${ownerName} wenden.
    </p>
    
    <p style="margin-top: 20px; font-size: 14px; color: #999;">
      Viele Grüße,<br>
      Ihr MeineDokBox Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  const verificationLink = `${process.env.REPLIT_DEV_DOMAIN || 'https://meinedokbox.de'}/verify-email?token=${verificationToken}`;
  
  const subject = `Bestätigen Sie Ihre E-Mail-Adresse für MeineDokBox`;
  
  const text = `
Hallo ${firstName}!

Willkommen bei MeineDokBox!

Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:

${verificationLink}

Dieser Link ist 24 Stunden gültig.

Falls Sie sich nicht bei MeineDokBox registriert haben, können Sie diese E-Mail ignorieren.

Viele Grüße,
Ihr MeineDokBox Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 8px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div style="background: #667eea; color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 24px;">📂 MeineDokBox</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">E-Mail-Adresse bestätigen</p>
  </div>
  
  <div class="content">
    <p>Hallo ${firstName}!</p>
    
    <p><strong>Willkommen bei MeineDokBox!</strong></p>
    
    <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:</p>
    
    <center>
      <a href="${verificationLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;">
        E-Mail-Adresse bestätigen
      </a>
    </center>
    
    <p style="font-size: 14px; color: #666;">
      Dieser Link ist 24 Stunden gültig.
    </p>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Falls Sie sich nicht bei MeineDokBox registriert haben, können Sie diese E-Mail ignorieren.
    </p>
    
    <p style="margin-top: 20px; font-size: 14px; color: #999;">
      Viele Grüße,<br>
      Ihr MeineDokBox Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}
