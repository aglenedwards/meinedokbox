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

export function getDay14Email(userName: string): { subject: string; html: string; text: string } {
  const subject = "Ihre Testphase endet morgen 📅";
  const text = `Hallo ${userName},\n\nIhre 14-tägige Testphase von MeineDokBox endet morgen. Um weiterhin alle Funktionen nutzen zu können, wählen Sie jetzt Ihren passenden Plan.\n\nUnsere Pläne:\n- Solo: €3,99/Monat (1 Nutzer, 2GB)\n- Family: €6,99/Monat (2 Nutzer, 5GB) - EMPFOHLEN\n- Family Plus: €9,99/Monat (4 Nutzer, 15GB)\n\nJetzt Plan wählen und nahtlos weitermachen!\n\nViele Grüße,\nIhr MeineDokBox Team`;
  
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
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">Ihre Testphase endet morgen 📅</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo${userName ? ' ' + userName : ''},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Ihre <strong>14-tägige Testphase</strong> von MeineDokBox endet morgen. Um weiterhin alle Funktionen nutzen zu können, wählen Sie jetzt Ihren passenden Plan.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-radius: 6px; margin-bottom: 12px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Solo</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">€3,99<span style="font-size: 14px; font-weight: 400; color: #666;">/Monat</span></div>
                    <div style="font-size: 14px; color: #666;">1 Nutzer • 2GB Speicher</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px; margin-bottom: 12px; position: relative;">
                    <div style="position: absolute; top: 12px; right: 12px; background-color: #fbbf24; color: #1a1a1a; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">EMPFOHLEN</div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Family</div>
                    <div style="font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">€6,99<span style="font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.9);">/Monat</span></div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.9);">2 Nutzer • 5GB Speicher</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #f8f8f8; border-radius: 6px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Family Plus</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">€9,99<span style="font-size: 14px; font-weight: 400; color: #666;">/Monat</span></div>
                    <div style="font-size: 14px; color: #666;">4 Nutzer • 15GB Speicher</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/#pricing` : '#pricing'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Jetzt Plan wählen</a>
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

export function getGraceStartEmail(userName: string): { subject: string; html: string; text: string } {
  const subject = "Testphase abgelaufen - Wählen Sie jetzt Ihren Plan ⏰";
  const text = `Hallo ${userName},\n\nIhre Testphase ist abgelaufen. Sie haben noch 3 Tage Zeit, um einen Plan auszuwählen.\n\nWährend dieser Kulanzfrist:\n✓ Können Sie alle Ihre Dokumente weiterhin ansehen und herunterladen\n✗ Upload neuer Dokumente ist vorübergehend deaktiviert\n\nWählen Sie jetzt Ihren Plan und laden Sie sofort wieder Dokumente hoch!\n\nViele Grüße,\nIhr MeineDokBox Team`;
  
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
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">Testphase abgelaufen ⏰</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo${userName ? ' ' + userName : ''},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Ihre Testphase ist abgelaufen. Sie haben noch <strong style="color: #f59e0b;">3 Tage</strong> Zeit, um einen Plan auszuwählen.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #92400e;">Während dieser Kulanzfrist:</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #78350f;">✓ Können Sie alle Ihre Dokumente weiterhin ansehen und herunterladen</p>
                <p style="margin: 0; font-size: 14px; color: #78350f;">✗ Upload neuer Dokumente ist vorübergehend deaktiviert</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/#pricing` : '#pricing'}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Jetzt Plan wählen</a>
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

export function getGraceLastDayEmail(userName: string): { subject: string; html: string; text: string } {
  const subject = "⚠️ Letzte Chance: Morgen wechselt Ihr Account in den Nur-Lese-Modus";
  const text = `Hallo ${userName},\n\nDies ist Ihre letzte Erinnerung: Morgen wechselt Ihr MeineDokBox-Account in den Nur-Lese-Modus.\n\nAb morgen:\n✗ Kein Upload neuer Dokumente mehr möglich\n✗ Keine Bearbeitung bestehender Dokumente\n✓ Weiterhin Zugriff auf alle Ihre Dokumente (Ansehen & Download)\n\nWählen Sie HEUTE noch Ihren Plan und behalten Sie vollen Zugriff!\n\nViele Grüße,\nIhr MeineDokBox Team`;
  
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid #dc2626;">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; font-size: 24px; color: #dc2626; font-weight: 600;">⚠️ Letzte Chance</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo${userName ? ' ' + userName : ''},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Dies ist Ihre <strong style="color: #dc2626;">letzte Erinnerung</strong>: Morgen wechselt Ihr MeineDokBox-Account in den Nur-Lese-Modus.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #991b1b;">Ab morgen:</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #7f1d1d;">✗ Kein Upload neuer Dokumente mehr möglich</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #7f1d1d;">✗ Keine Bearbeitung bestehender Dokumente</p>
                <p style="margin: 0; font-size: 14px; color: #7f1d1d;">✓ Weiterhin Zugriff auf alle Ihre Dokumente (Ansehen & Download)</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/#pricing` : '#pricing'}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">JETZT Plan wählen</a>
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

export function getReadOnlyStartEmail(userName: string): { subject: string; html: string; text: string } {
  const subject = "Ihr Account ist jetzt im Nur-Lese-Modus";
  const text = `Hallo ${userName},\n\nIhr MeineDokBox-Account befindet sich jetzt im Nur-Lese-Modus.\n\nAktueller Status:\n✗ Kein Upload neuer Dokumente möglich\n✗ Keine Bearbeitung bestehender Dokumente\n✓ Weiterhin Zugriff auf alle Ihre Dokumente (Ansehen & Download)\n\nUpgraden Sie jetzt auf einen bezahlten Plan und erhalten Sie sofort wieder vollen Zugriff!\n\nViele Grüße,\nIhr MeineDokBox Team`;
  
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
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">Nur-Lese-Modus aktiv</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hallo${userName ? ' ' + userName : ''},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Ihr MeineDokBox-Account befindet sich jetzt im <strong>Nur-Lese-Modus</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; border-radius: 4px;">
                <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #374151;">Aktueller Status:</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">✗ Kein Upload neuer Dokumente möglich</p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">✗ Keine Bearbeitung bestehender Dokumente</p>
                <p style="margin: 0; font-size: 14px; color: #4b5563;">✓ Weiterhin Zugriff auf alle Ihre Dokumente (Ansehen & Download)</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333; text-align: center;">
                <strong>Upgraden Sie jetzt</strong> auf einen bezahlten Plan und erhalten Sie sofort wieder vollen Zugriff!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app/#pricing` : '#pricing'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Jetzt upgraden</a>
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
