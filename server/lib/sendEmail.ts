/**
 * Send email using Mailgun API
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  console.log(`[Email] Attempting to send email to: ${options.to}`);
  console.log(`[Email] Mailgun domain: ${domain ? 'configured' : 'NOT configured'}`);
  console.log(`[Email] Mailgun API key: ${apiKey ? 'configured' : 'NOT configured'}`);

  if (!apiKey || !domain) {
    console.error("[Email] ERROR: Mailgun credentials not configured");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("from", `MeineDokBox <noreply@${domain}>`);
    formData.append("to", options.to);
    formData.append("subject", options.subject);
    formData.append("text", options.text);
    
    if (options.html) {
      formData.append("html", options.html);
    }

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Email] Mailgun API error (status " + response.status + "):", errorText);
      return false;
    }

    const result = await response.json();
    console.log("[Email] ✅ Email sent successfully:", result);
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

Mit dieser Einladung erhalten Sie vollen Zugriff auf alle Dokumente und können gemeinsam Dokumente verwalten.

So akzeptieren Sie die Einladung:
1. Gehen Sie zu MeineDokBox: ${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://meinedokbox.replit.app'}
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
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
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
  <div class="header">
    <h1>📂 MeineDokBox</h1>
    <p>Einladung zum gemeinsamen Dokumenten-Management</p>
  </div>
  
  <div class="content">
    <p>Hallo!</p>
    
    <p><strong>${ownerName}</strong> möchte sein MeineDokBox-Konto mit Ihnen teilen.</p>
    
    <p>Mit dieser Einladung erhalten Sie vollen Zugriff auf alle Dokumente und können gemeinsam Dokumente verwalten.</p>
    
    <div class="steps">
      <h3>So akzeptieren Sie die Einladung:</h3>
      <div class="step">Gehen Sie zu MeineDokBox</div>
      <div class="step">Melden Sie sich mit dieser E-Mail-Adresse an (<strong>${to}</strong>)</div>
      <div class="step">Die Einladung wird automatisch akzeptiert</div>
    </div>
    
    <center>
      <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://meinedokbox.replit.app'}" class="button">
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
