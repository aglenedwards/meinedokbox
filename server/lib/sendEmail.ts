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
 * Send shared access invitation email with token link
 */
export async function sendSharedAccessInvitation(
  to: string,
  ownerName: string,
  invitationToken: string
): Promise<boolean> {
  const inviteLink = `https://meinedokbox.de/invite?token=${invitationToken}`;
  const subject = `${ownerName} lädt Sie zu MeineDokBox ein`;
  
  const text = `
Hallo!

${ownerName} möchte sein MeineDokBox-Konto mit Ihnen teilen.

Mit dieser Einladung erhalten Sie vollen Zugriff auf alle geteilten Dokumente und können gemeinsam Dokumente verwalten.

So akzeptieren Sie die Einladung:
1. Klicken Sie auf diesen Link: ${inviteLink}
2. Registrieren Sie sich mit dieser E-Mail-Adresse (${to})
3. Nach der Verifizierung haben Sie sofort Zugriff

Der Einladungslink ist 7 Tage gültig.

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
      <div class="step">Klicken Sie auf den Button unten</div>
      <div class="step">Registrieren Sie sich mit dieser E-Mail-Adresse (<strong>${to}</strong>)</div>
      <div class="step">Nach der Verifizierung haben Sie sofort Zugriff</div>
    </div>
    
    <center>
      <a href="${inviteLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Einladung annehmen
      </a>
    </center>
    
    <p style="margin-top: 15px; font-size: 13px; color: #666; text-align: center;">
      Der Einladungslink ist 7 Tage gültig.
    </p>
    
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
  // Get the base URL - use production domain in production, dev domain in development
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://meinedokbox.de' 
    : `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
  
  const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  console.log(`[VerificationEmail] Sending to ${to} with link: ${verificationLink}`);
  
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

/**
 * Send password reset email with token link
 */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetToken: string
): Promise<boolean> {
  // Get the base URL - use production domain in production, dev domain in development
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://meinedokbox.de' 
    : `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
  
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  
  console.log(`[PasswordResetEmail] Sending to ${to} with link: ${resetLink}`);
  
  const subject = `Passwort zurücksetzen für MeineDokBox`;
  
  const text = `
Hallo ${firstName}!

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts bei MeineDokBox erhalten.

Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:

${resetLink}

Dieser Link ist 1 Stunde gültig.

Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.

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
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Passwort zurücksetzen</p>
  </div>
  
  <div class="content">
    <p>Hallo ${firstName}!</p>
    
    <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts bei MeineDokBox erhalten.</p>
    
    <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
    
    <center>
      <a href="${resetLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600;">
        Passwort zurücksetzen
      </a>
    </center>
    
    <p style="font-size: 14px; color: #666;">
      Dieser Link ist 1 Stunde gültig.
    </p>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.
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
 * Send contact form message to service email
 */
export async function sendContactFormEmail(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const serviceEmail = "service@meinedokbox.de";
  const emailSubject = `[Kontaktformular] ${subject}`;
  
  const text = `
Neue Nachricht über das Kontaktformular:

Von: ${name} (${email})
Betreff: ${subject}

Nachricht:
${message}

---
Diese Nachricht wurde über das Kontaktformular auf meinedokbox.de gesendet.
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
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .info-row {
      margin: 10px 0;
      display: flex;
      gap: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #667eea;
      min-width: 100px;
    }
    .message-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div style="background: #667eea; color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 28px;">Kontaktformular</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Neue Nachricht erhalten</p>
  </div>
  
  <div class="content">
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Von:</span>
        <span>${name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">E-Mail:</span>
        <span><a href="mailto:${email}">${email}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Betreff:</span>
        <span>${subject}</span>
      </div>
    </div>
    
    <h3 style="margin-top: 20px;">Nachricht:</h3>
    <div class="message-box">
      ${message}
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">
      Diese Nachricht wurde über das Kontaktformular auf meinedokbox.de gesendet.
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: serviceEmail, subject: emailSubject, text, html });
}

/**
 * Send admin notification when a new user registers
 */
export async function sendAdminNewUserNotification(
  userEmail: string,
  userName: string,
  userId: string
): Promise<boolean> {
  const serviceEmail = "service@meinedokbox.de";
  const subject = `🎉 Neue Registrierung: ${userName}`;
  
  const text = `
Neue Benutzer-Registrierung bei MeineDokBox:

Name: ${userName}
E-Mail: ${userEmail}
User ID: ${userId}
Zeitpunkt: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}

Der Benutzer befindet sich nun in der 7-tägigen Testphase.

---
Automatische Benachrichtigung von MeineDokBox
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white !important;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .info-row {
      margin: 10px 0;
      display: flex;
      gap: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #10b981;
      min-width: 120px;
    }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 28px;">🎉 Neue Registrierung</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Ein neuer Benutzer hat sich registriert</p>
  </div>
  
  <div class="content">
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span>${userName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">E-Mail:</span>
        <span><a href="mailto:${userEmail}">${userEmail}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">User ID:</span>
        <span><code>${userId}</code></span>
      </div>
      <div class="info-row">
        <span class="info-label">Zeitpunkt:</span>
        <span>${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</span>
      </div>
    </div>
    
    <p style="margin-top: 20px;">
      Der Benutzer befindet sich nun in der <strong>7-tägigen Testphase</strong>.
    </p>
    
    <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">
      Automatische Benachrichtigung von MeineDokBox
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: serviceEmail, subject, text, html });
}

/**
 * Send admin notification when a subscription is purchased
 */
export async function sendAdminNewSubscriptionNotification(
  userEmail: string,
  userName: string,
  plan: string,
  period: string,
  amount: number
): Promise<boolean> {
  const serviceEmail = "service@meinedokbox.de";
  const subject = `💰 Neues Abo: ${plan} (${period}) - ${userName}`;
  
  const planNames: Record<string, string> = {
    'solo': 'Solo',
    'family': 'Family',
    'family-plus': 'Family Plus'
  };
  
  const periodNames: Record<string, string> = {
    'monthly': 'Monatlich',
    'yearly': 'Jährlich'
  };
  
  const text = `
Neues Abonnement abgeschlossen bei MeineDokBox:

Kunde: ${userName} (${userEmail})
Plan: ${planNames[plan] || plan}
Abrechnungszeitraum: ${periodNames[period] || period}
Betrag: ${(amount / 100).toFixed(2)} €
Zeitpunkt: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}

Das Abonnement wurde erfolgreich über Stripe abgeschlossen.

---
Automatische Benachrichtigung von MeineDokBox
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
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white !important;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
    }
    .info-row {
      margin: 10px 0;
      display: flex;
      gap: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #f59e0b;
      min-width: 150px;
    }
    .amount {
      font-size: 24px;
      font-weight: 700;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 28px;">💰 Neues Abonnement</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Ein Kunde hat ein Abonnement abgeschlossen</p>
  </div>
  
  <div class="content">
    <div class="amount">
      ${(amount / 100).toFixed(2)} €
    </div>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Kunde:</span>
        <span>${userName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">E-Mail:</span>
        <span><a href="mailto:${userEmail}">${userEmail}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Plan:</span>
        <span><strong>${planNames[plan] || plan}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Abrechnungszeitraum:</span>
        <span>${periodNames[period] || period}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Zeitpunkt:</span>
        <span>${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</span>
      </div>
    </div>
    
    <p style="margin-top: 20px;">
      Das Abonnement wurde erfolgreich über <strong>Stripe</strong> abgeschlossen.
    </p>
    
    <p style="margin-top: 30px; font-size: 14px; color: #999; text-align: center;">
      Automatische Benachrichtigung von MeineDokBox
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: serviceEmail, subject, text, html });
}

