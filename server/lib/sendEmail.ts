/**
 * Send email using Mailgun API
 */
import { getAppUrl } from '../emailService';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  console.log(`[Mailgun] Attempting to send email to: ${options.to}`);
  console.log(`[Mailgun] Domain: ${domain ? 'configured' : 'NOT configured'}`);
  console.log(`[Mailgun] API Key: ${apiKey ? 'configured' : 'NOT configured'}`);

  if (!apiKey || !domain) {
    console.error("[Mailgun] ERROR: Mailgun credentials not configured");
    return false;
  }

  try {
    const fromEmail = `service@${domain}`;
    
    const formData = new URLSearchParams();
    formData.append('from', `MeineDokBox <${fromEmail}>`);
    formData.append('to', options.to);
    formData.append('subject', options.subject);
    formData.append('text', options.text);
    if (options.html) {
      formData.append('html', options.html);
    }

    const response = await fetch(`https://api.eu.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Mailgun] Error response:', errorText);
      return false;
    }

    const result = await response.json();
    console.log("[Mailgun] ✅ Email sent successfully:", result.id);
    return true;
  } catch (error) {
    console.error("[Mailgun] ❌ Failed to send email:", error);
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
  const baseUrl = getAppUrl();
  const inviteLink = `${baseUrl}/invite?token=${invitationToken}`;
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
  // Use centralized getAppUrl() which checks APP_URL first, then REPLIT_DOMAINS
  const baseUrl = getAppUrl();
  
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
  // Use centralized getAppUrl() which checks APP_URL first, then REPLIT_DOMAINS
  const baseUrl = getAppUrl();
  
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

/**
 * Send admin notification when a subscription is cancelled
 */
export async function sendAdminSubscriptionCancelledNotification(
  userEmail: string,
  userName: string,
  plan: string
): Promise<boolean> {
  const serviceEmail = "service@meinedokbox.de";
  const subject = `⚠️ Abo gekündigt: ${plan} - ${userName}`;
  
  const planNames: Record<string, string> = {
    'solo': 'Solo',
    'family': 'Family',
    'family-plus': 'Family Plus',
    'free': 'Kostenlos'
  };
  
  const text = `
Abonnement gekündigt bei MeineDokBox:

Kunde: ${userName} (${userEmail})
Vorheriger Plan: ${planNames[plan] || plan}
Zeitpunkt: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}

Der Kunde wurde auf den kostenlosen Plan zurückgestuft.

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
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #ef4444;
    }
    .info-row {
      margin: 10px 0;
      display: flex;
      gap: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #ef4444;
      min-width: 150px;
    }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 28px;">⚠️ Abo gekündigt</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Ein Kunde hat sein Abonnement beendet</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
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
        <span class="info-label">Vorheriger Plan:</span>
        <span><strong>${planNames[plan] || plan}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Zeitpunkt:</span>
        <span>${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</span>
      </div>
    </div>
    
    <p style="margin-top: 20px;">
      Der Kunde wurde auf den <strong>kostenlosen Plan</strong> zurückgestuft.
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
 * Send notification email when a user is removed from a family account
 * They become their own Master with 7-day trial
 */
export async function sendAccountSeparatedEmail(
  to: string,
  userName: string,
  masterName: string
): Promise<boolean> {
  const baseUrl = getAppUrl();
  const loginLink = `${baseUrl}/login`;
  const subject = "Wichtig: Änderungen an deinem MeineDokBox-Zugang";
  
  const text = `
Hallo ${userName}!

Dein Zugang zum MeineDokBox-Konto von ${masterName} wurde beendet.

Keine Sorge - deine Dokumente sind sicher! Du hast jetzt dein eigenes MeineDokBox-Konto:

✓ Alle deine Dokumente bleiben erhalten
✓ Du hast 7 Tage kostenlos Zeit um ein eigenes Abo zu wählen
✓ Nach dem Test-Zeitraum kannst du weiterhin deine Dokumente ansehen

So geht es weiter:
1. Melde dich mit deiner E-Mail (${to}) an
2. Wähle ein Abo-Modell, das zu dir passt
3. Lade weiterhin Dokumente hoch und organisiere sie

Du kannst dich jetzt anmelden: ${loginLink}

Bei Fragen sind wir gerne für dich da!

Viele Grüße,
Dein MeineDokBox Team
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
    .benefits {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .benefit {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .benefit:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 24px;">📂 MeineDokBox</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Wichtige Änderungen an deinem Zugang</p>
  </div>
  
  <div class="content">
    <p>Hallo ${userName}!</p>
    
    <p>Dein Zugang zum MeineDokBox-Konto von <strong>${masterName}</strong> wurde beendet.</p>
    
    <div class="benefits">
      <h3 style="color: #10b981; margin-top: 0;">🎉 Gute Nachrichten!</h3>
      <div class="benefit">Alle deine Dokumente bleiben erhalten</div>
      <div class="benefit">Du hast <strong>7 Tage kostenlos</strong> Zeit um ein eigenes Abo zu wählen</div>
      <div class="benefit">Nach dem Test-Zeitraum kannst du weiterhin deine Dokumente ansehen</div>
    </div>
    
    <p>Du hast jetzt dein eigenes MeineDokBox-Konto! Melde dich einfach an und wähle ein Abo-Modell, das zu dir passt.</p>
    
    <center>
      <a href="${loginLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Jetzt anmelden
      </a>
    </center>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Bei Fragen sind wir gerne für dich da!
    </p>
    
    <p style="margin-top: 20px; font-size: 14px; color: #666; text-align: center;">
      Viele Grüße,<br>
      Dein MeineDokBox Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Send notification to referrer when someone signs up via their referral link
 */
export async function sendReferralSignupNotification(
  to: string,
  referrerName: string
): Promise<boolean> {
  const baseUrl = getAppUrl();
  const referralLink = `${baseUrl}/referral`;
  const subject = `🎉 Neue Empfehlung: +1 GB Bonus-Speicher für dich!`;
  
  const text = `
Hallo ${referrerName}!

Tolle Neuigkeiten! Jemand hat sich über deinen Empfehlungslink registriert.

Du erhältst sofort +1 GB zusätzlichen Speicherplatz!

Dein nächstes Ziel: Sobald 5 deiner Empfehlungen zahlende Kunden werden, bekommst du den Family-Plan dauerhaft kostenlos!

Schau dir deinen Fortschritt an: ${referralLink}

Viele Grüße,
Dein MeineDokBox Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; text-align: center; }
    .bonus { font-size: 32px; font-weight: bold; color: #10b981; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 24px;">🎉 Neue Empfehlung!</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Jemand hat sich über deinen Link registriert</p>
  </div>
  <div class="content">
    <p>Hallo ${referrerName}!</p>
    <p>Tolle Neuigkeiten! Jemand hat sich über deinen Empfehlungslink registriert.</p>
    <div class="highlight">
      <p style="margin: 0; color: #666;">Du erhältst sofort</p>
      <p class="bonus" style="margin: 10px 0;">+1 GB</p>
      <p style="margin: 0; color: #666;">zusätzlichen Speicherplatz!</p>
    </div>
    <p><strong>Dein nächstes Ziel:</strong> Sobald 5 deiner Empfehlungen zahlende Kunden werden, bekommst du den Family-Plan dauerhaft kostenlos!</p>
    <center>
      <a href="${referralLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Fortschritt ansehen
      </a>
    </center>
    <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
      Viele Grüße,<br>
      Dein MeineDokBox Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Send notification to referrer when their referred user becomes a paying customer
 */
export async function sendReferralActivationNotification(
  to: string,
  referrerName: string,
  activeCount: number,
  isFreeNow: boolean,
  requiredReferrals: number = 5
): Promise<boolean> {
  const baseUrl = getAppUrl();
  const referralLink = `${baseUrl}/referral`;
  const remaining = requiredReferrals - activeCount;
  
  const subject = isFreeNow 
    ? `🎊 Glückwunsch! Dein MeineDokBox ist jetzt dauerhaft kostenlos!`
    : `✅ Deine Empfehlung ist jetzt zahlender Kunde (${activeCount}/${requiredReferrals})`;
  
  const text = isFreeNow
    ? `
Hallo ${referrerName}!

🎊 HERZLICHEN GLÜCKWUNSCH! 🎊

Du hast es geschafft! Mit ${requiredReferrals} aktiven zahlenden Empfehlungen ist dein Plan ab sofort DAUERHAFT KOSTENLOS!

Schau dir deine Empfehlungen an: ${referralLink}

Viele Grüße,
Dein MeineDokBox Team
    `.trim()
    : `
Hallo ${referrerName}!

Tolle Neuigkeiten! Eine deiner Empfehlungen ist jetzt zahlender Kunde geworden.

Dein Fortschritt: ${activeCount} von ${requiredReferrals} aktiven Empfehlungen

Bei ${requiredReferrals} aktiven Empfehlungen wird dein Plan dauerhaft kostenlos!

Schau dir deinen Fortschritt an: ${referralLink}

Viele Grüße,
Dein MeineDokBox Team
    `.trim();

  const html = isFreeNow
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .celebration { background: white; padding: 30px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b; }
    .free-text { font-size: 28px; font-weight: bold; color: #d97706; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 28px;">🎊 GLÜCKWUNSCH! 🎊</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 18px;">Du hast es geschafft!</p>
  </div>
  <div class="content">
    <p>Hallo ${referrerName}!</p>
    <div class="celebration">
      <p style="font-size: 48px; margin: 0;">🎉</p>
      <p class="free-text" style="margin: 15px 0;">DAUERHAFT KOSTENLOS!</p>
      <p style="margin: 0; color: #666;">Mit ${requiredReferrals} aktiven zahlenden Empfehlungen ist dein Plan ab sofort kostenlos!</p>
    </div>
    <p>Danke, dass du MeineDokBox weiterempfiehlst!</p>
    <center>
      <a href="${referralLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Deine Empfehlungen ansehen
      </a>
    </center>
    <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
      Viele Grüße,<br>
      Dein MeineDokBox Team
    </p>
  </div>
</body>
</html>
    `.trim()
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .progress-box { background: white; padding: 25px; border-radius: 6px; margin: 20px 0; text-align: center; border-left: 4px solid #10b981; }
    .progress-count { font-size: 36px; font-weight: bold; color: #10b981; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 24px;">✅ Empfehlung aktiviert!</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Eine deiner Empfehlungen ist jetzt zahlender Kunde</p>
  </div>
  <div class="content">
    <p>Hallo ${referrerName}!</p>
    <p>Tolle Neuigkeiten! Eine deiner Empfehlungen ist jetzt zahlender Kunde geworden.</p>
    <div class="progress-box">
      <p style="margin: 0; color: #666;">Dein Fortschritt</p>
      <p class="progress-count" style="margin: 10px 0;">${activeCount} / ${requiredReferrals}</p>
      <p style="margin: 0; color: #666;">aktive Empfehlungen</p>
    </div>
    <p><strong>Noch ${remaining} weitere</strong> und dein Plan wird dauerhaft kostenlos!</p>
    <center>
      <a href="${referralLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Fortschritt ansehen
      </a>
    </center>
    <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
      Viele Grüße,<br>
      Dein MeineDokBox Team
    </p>
  </div>
</body>
</html>
    `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Send day-8 referral program info email to all users
 * This introduces users to the referral program after they've had time to explore the app
 */
export async function sendReferralProgramInfoEmail(
  to: string,
  userName: string,
  referralCode: string
): Promise<boolean> {
  const baseUrl = getAppUrl();
  const referralLink = `${baseUrl}/register?ref=${referralCode}`;
  const referralDashboardLink = `${baseUrl}/referral`;
  
  const subject = `🎁 Teile MeineDokBox und erhalte kostenlos mehr Speicherplatz!`;
  
  const text = `
Hallo ${userName}!

Du nutzt MeineDokBox jetzt seit einer Woche - toll, dass du dabei bist!

Wir möchten dir heute unser Empfehlungsprogramm vorstellen:

🎁 FÜR JEDE EMPFEHLUNG:
+1 GB zusätzlicher Speicherplatz - sofort nach der Registrierung!

👑 BEI 5 AKTIVEN EMPFEHLUNGEN:
Dein Family-Plan wird DAUERHAFT KOSTENLOS!

Dein persönlicher Empfehlungslink:
${referralLink}

Teile diesen Link mit Freunden, Familie oder Kollegen. Du erhältst sofort +1 GB für jede Anmeldung!

Schau dir dein Empfehlungs-Dashboard an: ${referralDashboardLink}

Viele Grüße,
Dein MeineDokBox Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .reward-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #e9d5ff; }
    .reward-item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #f3e8ff; }
    .reward-item:last-child { border-bottom: none; }
    .reward-icon { font-size: 28px; margin-right: 15px; }
    .reward-text h4 { margin: 0 0 5px 0; color: #6d28d9; }
    .reward-text p { margin: 0; color: #666; font-size: 14px; }
    .link-box { background: #faf5ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px dashed #c4b5fd; }
    .link-url { font-family: monospace; font-size: 12px; word-break: break-all; color: #7c3aed; background: white; padding: 10px; border-radius: 4px; display: block; margin-top: 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: 500; }
    .button-secondary { background: #e9d5ff; color: #6d28d9; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 26px;">🎁 Empfehlungsprogramm</h1>
    <p style="color: #ffffff !important; margin: 0; font-size: 16px;">Teile MeineDokBox und werde belohnt!</p>
  </div>
  <div class="content">
    <p>Hallo ${userName}!</p>
    <p>Du nutzt MeineDokBox jetzt seit einer Woche - toll, dass du dabei bist! Wir möchten dir heute unser <strong>Empfehlungsprogramm</strong> vorstellen:</p>
    
    <div class="reward-box">
      <div class="reward-item">
        <span class="reward-icon">🎁</span>
        <div class="reward-text">
          <h4>+1 GB pro Empfehlung</h4>
          <p>Für jede Person, die sich über deinen Link registriert, erhältst du sofort 1 GB zusätzlichen Speicherplatz!</p>
        </div>
      </div>
      <div class="reward-item">
        <span class="reward-icon">👑</span>
        <div class="reward-text">
          <h4>Family-Plan dauerhaft kostenlos</h4>
          <p>Sobald 5 deiner Empfehlungen zahlende Kunden werden, ist dein Family-Plan für immer kostenlos!</p>
        </div>
      </div>
    </div>

    <div class="link-box">
      <p style="margin: 0 0 5px 0; font-weight: 500; color: #6d28d9;">Dein persönlicher Empfehlungslink:</p>
      <span class="link-url">${referralLink}</span>
    </div>

    <center style="margin: 30px 0;">
      <a href="${referralDashboardLink}" class="button" style="display: inline-block; background: #667eea; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: 500;">
        Empfehlungs-Dashboard öffnen
      </a>
    </center>

    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Teile den Link mit Freunden, Familie oder Kollegen und sammle Bonusspeicher!
    </p>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
      Viele Grüße,<br>
      Dein MeineDokBox Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

