import { storage } from "./storage";
import { db } from "./db";
import { documents, users } from "@shared/schema";
import { eq, and, sql, lte, isNotNull } from "drizzle-orm";

async function sendReactivationEmail(
  to: string, 
  subject: string, 
  html: string, 
  text: string
): Promise<string | null> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  
  if (!apiKey || !domain) {
    console.error("[ReactivationCron] Missing Mailgun credentials");
    return null;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("from", `MeineDokBox <noreply@${domain}>`);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("text", text);
    formData.append("html", html);

    const response = await fetch(`https://api.eu.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (response.ok) {
      const data = await response.json() as { id?: string };
      return data.id || null;
    }
    
    console.error("[ReactivationCron] Mailgun error:", await response.text());
    return null;
  } catch (error) {
    console.error("[ReactivationCron] Send error:", error);
    return null;
  }
}

function getUnsubscribeUrl(userId: string): string {
  const baseUrl = process.env.REPLIT_DEPLOYMENT_URL || process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.repl.co` 
    : "https://meinedokbox.de";
  return `${baseUrl}/unsubscribe?uid=${userId}`;
}

export function getReactivationEmail1Sleeper(userName: string, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = "Dein digitaler Aktenschrank wartet auf dich!";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
<p style="margin:0 0 8px 0;font-size:28px;color:#ffffff !important;">&#128194; MeineDokBox</p>
<h1 style="margin:0;font-size:22px;color:#ffffff !important;font-weight:600;">Dein Aktenschrank wartet!</h1>
</td></tr>
<tr><td style="padding:40px 36px 20px 36px;">
<p style="margin:0 0 20px 0;font-size:16px;color:#333333;">Hey${userName ? ` ${userName}` : ''},</p>
<p style="margin:0 0 24px 0;font-size:16px;color:#555555;">du hast dich bei MeineDokBox registriert, aber noch kein einziges Dokument hochgeladen. Dabei geht's so einfach:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
<tr><td style="padding:14px 18px;background-color:#f8f9ff;border-radius:8px;margin-bottom:8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="36" style="vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;font-weight:700;">1</span></td><td style="padding-left:12px;font-size:15px;color:#333333;"><strong>Foto machen</strong> &#8211; Dokument abfotografieren</td></tr>
</table>
</td></tr>
<tr><td style="height:8px;"></td></tr>
<tr><td style="padding:14px 18px;background-color:#f8f9ff;border-radius:8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="36" style="vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;font-weight:700;">2</span></td><td style="padding-left:12px;font-size:15px;color:#333333;"><strong>Hochladen</strong> &#8211; Bild in die App ziehen</td></tr>
</table>
</td></tr>
<tr><td style="height:8px;"></td></tr>
<tr><td style="padding:14px 18px;background-color:#f8f9ff;border-radius:8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="36" style="vertical-align:top;padding-top:2px;"><span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;font-weight:700;">3</span></td><td style="padding-left:12px;font-size:15px;color:#333333;"><strong>Fertig!</strong> &#8211; Unsere KI sortiert alles automatisch</td></tr>
</table>
</td></tr>
</table>
<p style="margin:0 0 30px 0;font-size:16px;color:#555555;">Probier's doch einfach mal aus &#8211; dein erster Upload dauert keine 30 Sekunden!</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://meinedokbox.de" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Jetzt erstes Dokument hochladen</a>
</td></tr></table>
<p style="margin:28px 0 0 0;padding:18px;background-color:#fef9e7;border-radius:8px;font-size:14px;color:#7c6f2a;border-left:4px solid #f5c518;">&#128161; <strong>Tipp:</strong> Du hast eine Rechnung, einen Vertrag oder ein Attest rumliegen? Perfekt zum Testen!</p>
</td></tr>
<tr><td style="padding:0 36px 36px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:16px;">
<tr><td style="text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#9ca3af;"><strong>MeineDokBox</strong> &#8211; Intelligente Dokumentenverwaltung</p>
<p style="margin:0;font-size:11px;"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Keine weiteren E-Mails erhalten</a></p>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\ndu hast dich bei MeineDokBox registriert, aber noch kein Dokument hochgeladen.\n\nSo einfach geht's:\n1. Foto machen\n2. Hochladen\n3. Fertig - die KI sortiert alles!\n\nProbier's aus: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

export function getReactivationEmail1PowerUser(userName: string, docCount: number, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = `Dein Zugang ist abgelaufen - ${docCount} Dokument${docCount > 1 ? 'e' : ''} warten auf dich!`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
<p style="margin:0 0 8px 0;font-size:28px;color:#ffffff !important;">&#128194; MeineDokBox</p>
<h1 style="margin:0;font-size:22px;color:#ffffff !important;font-weight:600;">Deine Dokumente vermissen dich!</h1>
</td></tr>
<tr><td style="padding:40px 36px 20px 36px;">
<p style="margin:0 0 20px 0;font-size:16px;color:#333333;">Hey${userName ? ` ${userName}` : ''},</p>
<p style="margin:0 0 24px 0;font-size:16px;color:#555555;">deine Testphase bei MeineDokBox ist abgelaufen.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px;border-radius:10px;text-align:center;">
<p style="margin:0 0 4px 0;font-size:36px;color:#ffffff !important;font-weight:700;">${docCount}</p>
<p style="margin:0;font-size:16px;color:#ffffff !important;">Dokument${docCount > 1 ? 'e' : ''} warten auf dich in deinem Archiv</p>
</td></tr></table>
<p style="margin:0 0 20px 0;font-size:16px;color:#555555;">Die gute Nachricht: Deine Dokumente sind sicher gespeichert und gehen nicht verloren. Mit einem Abo hast du sofort wieder vollen Zugriff.</p>
<p style="margin:0 0 16px 0;font-size:16px;color:#333333;">Schon ab <strong>4,99 EUR/Monat</strong> sicherst du dir:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
<tr><td style="padding:10px 0;font-size:15px;color:#333333;"><span style="color:#667eea;font-size:18px;margin-right:10px;">&#10003;</span> Unbegrenzten Zugriff auf alle deine Dokumente</td></tr>
<tr><td style="padding:10px 0;font-size:15px;color:#333333;border-top:1px solid #f0f0f0;"><span style="color:#667eea;font-size:18px;margin-right:10px;">&#10003;</span> KI-gesteuerte Kategorisierung</td></tr>
<tr><td style="padding:10px 0;font-size:15px;color:#333333;border-top:1px solid #f0f0f0;"><span style="color:#667eea;font-size:18px;margin-right:10px;">&#10003;</span> Dokumente mit dem Partner teilen</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://meinedokbox.de" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Jetzt Zugang sichern</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 36px 36px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:16px;">
<tr><td style="text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#9ca3af;"><strong>MeineDokBox</strong> &#8211; Intelligente Dokumentenverwaltung</p>
<p style="margin:0;font-size:11px;"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Keine weiteren E-Mails erhalten</a></p>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\ndeine Testphase ist abgelaufen. ${docCount} Dokument${docCount > 1 ? 'e' : ''} warten auf dich!\n\nSchon ab 4,99 EUR/Monat: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

export function getReactivationEmail2Sleeper(userName: string, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = "Noch unsicher? So einfach geht Dokumenten-Management";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
<p style="margin:0 0 8px 0;font-size:28px;color:#ffffff !important;">&#128194; MeineDokBox</p>
<h1 style="margin:0;font-size:22px;color:#ffffff !important;font-weight:600;">Warum Papierkram digital besser ist</h1>
</td></tr>
<tr><td style="padding:40px 36px 20px 36px;">
<p style="margin:0 0 20px 0;font-size:16px;color:#333333;">Hey${userName ? ` ${userName}` : ''},</p>
<p style="margin:0 0 28px 0;font-size:16px;color:#555555;">vielleicht hattest du noch keine Zeit zum Testen. Kein Problem! Hier sind 3 Situationen, in denen MeineDokBox Gold wert ist:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
<tr><td style="background-color:#f8f9ff;border-radius:10px;padding:20px;border:1px solid #e8ebf7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="44" style="vertical-align:top;"><span style="font-size:32px;">&#128203;</span></td>
<td style="padding-left:14px;"><p style="margin:0 0 4px 0;font-size:16px;font-weight:700;color:#333333;">Steuererkl&#228;rung</p><p style="margin:0;font-size:14px;color:#666666;">Alle Belege sofort finden statt stundenlang suchen</p></td></tr>
</table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
<tr><td style="background-color:#f8f9ff;border-radius:10px;padding:20px;border:1px solid #e8ebf7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="44" style="vertical-align:top;"><span style="font-size:32px;">&#128737;</span></td>
<td style="padding-left:14px;"><p style="margin:0 0 4px 0;font-size:16px;font-weight:700;color:#333333;">Versicherungsfall</p><p style="margin:0;font-size:14px;color:#666666;">Police in Sekunden parat, nicht in Ordnern w&#252;hlen</p></td></tr>
</table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
<tr><td style="background-color:#f8f9ff;border-radius:10px;padding:20px;border:1px solid #e8ebf7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="44" style="vertical-align:top;"><span style="font-size:32px;">&#127968;</span></td>
<td style="padding-left:14px;"><p style="margin:0 0 4px 0;font-size:16px;font-weight:700;color:#333333;">Umzug / Arztwechsel</p><p style="margin:0;font-size:14px;color:#666666;">Alle Unterlagen digital dabei, nichts vergessen</p></td></tr>
</table>
</td></tr></table>
<p style="margin:0 0 30px 0;padding:16px 20px;background-color:#f0f2f5;border-radius:8px;font-size:15px;color:#555555;">&#10024; <strong>Der Clou:</strong> Unsere KI erkennt automatisch, was auf dem Dokument steht und sortiert es f&#252;r dich ein.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://meinedokbox.de" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Kostenlos ausprobieren</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 36px 36px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:16px;">
<tr><td style="text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#9ca3af;"><strong>MeineDokBox</strong> &#8211; Intelligente Dokumentenverwaltung</p>
<p style="margin:0;font-size:11px;"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Keine weiteren E-Mails erhalten</a></p>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\nWarum Papierkram digital besser ist:\n- Steuererklaerung: Belege sofort finden\n- Versicherungsfall: Police in Sekunden parat\n- Umzug: Alle Unterlagen digital dabei\n\nJetzt testen: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

export function getReactivationEmail2PowerUser(userName: string, docCount: number, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = `Vermisst du deine ${docCount} Dokumente?`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
<p style="margin:0 0 8px 0;font-size:28px;color:#ffffff !important;">&#128194; MeineDokBox</p>
<h1 style="margin:0;font-size:22px;color:#ffffff !important;font-weight:600;">Deine Dokumente warten immer noch</h1>
</td></tr>
<tr><td style="padding:40px 36px 20px 36px;">
<p style="margin:0 0 20px 0;font-size:16px;color:#333333;">Hey${userName ? ` ${userName}` : ''},</p>
<p style="margin:0 0 24px 0;font-size:16px;color:#555555;">du hast <strong>${docCount} Dokument${docCount > 1 ? 'e' : ''}</strong> in deiner DokBox gespeichert. Die sind weiterhin sicher bei uns &#8211; aber ohne aktives Abo kannst du keine neuen hinzuf&#252;gen.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
<tr><td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td width="44" style="vertical-align:top;"><span style="font-size:32px;">&#127873;</span></td>
<td style="padding-left:14px;">
<p style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#166534;">Wusstest du schon?</p>
<p style="margin:0;font-size:15px;color:#333333;">Mit dem Empfehlungsprogramm kannst du dir dein Abo sogar <strong>komplett kostenlos</strong> sichern! Einfach 5 Freunde einladen.</p>
</td></tr></table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr><td align="center">
<a href="https://meinedokbox.de" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Zugang wiederherstellen</a>
</td></tr></table>
<p style="margin:0;text-align:center;font-size:14px;color:#888888;">Schon ab <strong style="color:#667eea;">4,99 EUR/Monat</strong> &#8211; weniger als ein Kaffee!</p>
</td></tr>
<tr><td style="padding:0 36px 36px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:16px;">
<tr><td style="text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#9ca3af;"><strong>MeineDokBox</strong> &#8211; Intelligente Dokumentenverwaltung</p>
<p style="margin:0;font-size:11px;"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Keine weiteren E-Mails erhalten</a></p>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\n${docCount} Dokumente warten in deiner DokBox. Ohne Abo kannst du keine neuen hinzufuegen.\n\nTipp: Mit 5 Empfehlungen wird dein Abo kostenlos!\n\nZugang wiederherstellen: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

export function getReactivationEmail3(userName: string, docCount: number, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = "Letzte Erinnerung: Sichere dir deinen Zugang";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
<p style="margin:0 0 8px 0;font-size:28px;color:#ffffff !important;">&#128194; MeineDokBox</p>
<h1 style="margin:0;font-size:22px;color:#ffffff !important;font-weight:600;">Wir vermissen dich!</h1>
</td></tr>
<tr><td style="padding:40px 36px 20px 36px;">
<p style="margin:0 0 20px 0;font-size:16px;color:#333333;">Hey${userName ? ` ${userName}` : ''},</p>
<p style="margin:0 0 24px 0;font-size:16px;color:#555555;">dies ist unsere letzte Erinnerung &#8211; versprochen! Wir m&#246;chten dich nicht nerven.</p>
${docCount > 0 ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:22px;border-radius:10px;text-align:center;">
<p style="margin:0 0 4px 0;font-size:32px;color:#ffffff !important;font-weight:700;">${docCount}</p>
<p style="margin:0;font-size:15px;color:#ffffff !important;">gespeicherte Dokumente bleiben nat&#252;rlich erhalten</p>
</td></tr></table>` : ''}
<p style="margin:0 0 28px 0;font-size:16px;color:#555555;">Falls MeineDokBox nichts f&#252;r dich ist, verstehen wir das. Aber falls du es dir anders &#252;berlegst &#8211; wir sind jederzeit f&#252;r dich da!</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr><td align="center">
<a href="https://meinedokbox.de" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff !important;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Nochmal reinschauen</a>
</td></tr></table>
<p style="margin:0;text-align:center;padding:14px 18px;background-color:#f8f9ff;border-radius:8px;font-size:13px;color:#888888;">Du erh&#228;ltst nach dieser E-Mail keine weiteren Erinnerungen von uns.</p>
</td></tr>
<tr><td style="padding:0 36px 36px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:16px;">
<tr><td style="text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#9ca3af;"><strong>MeineDokBox</strong> &#8211; Intelligente Dokumentenverwaltung</p>
<p style="margin:0;font-size:11px;"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Keine weiteren E-Mails erhalten</a></p>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\ndies ist unsere letzte Erinnerung - versprochen!\n\n${docCount > 0 ? `Deine ${docCount} Dokumente bleiben erhalten.` : ''}\n\nNochmal reinschauen: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

async function getDocumentCount(userId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(eq(documents.userId, userId));
  return Number(result[0]?.count || 0);
}

export async function checkAndSendReactivationEmails(): Promise<void> {
  try {
    console.log("[ReactivationCron] Starting reactivation email check...");
    
    const usersToReactivate = await storage.getUsersForReactivation();
    console.log(`[ReactivationCron] Found ${usersToReactivate.length} users for potential reactivation`);

    const now = new Date();
    let sentCount = 0;

    for (const user of usersToReactivate) {
      if (!user.email || !user.trialEndsAt) continue;
      
      const trialEndDate = new Date(user.trialEndsAt);
      const daysSinceTrialEnd = Math.floor((now.getTime() - trialEndDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const currentStep = user.reactivationStep || 0;
      const userName = user.firstName || '';
      const docCount = await getDocumentCount(user.id);
      const isSleeper = docCount === 0;
      
      let emailData: { subject: string; html: string; text: string } | null = null;
      let nextStep = 0;
      let emailType = '';

      // Step 1: 1 day after trial end
      if (currentStep === 0 && daysSinceTrialEnd >= 1) {
        if (isSleeper) {
          emailData = getReactivationEmail1Sleeper(userName, user.id);
          emailType = 'reactivation_1_sleeper';
        } else {
          emailData = getReactivationEmail1PowerUser(userName, docCount, user.id);
          emailType = 'reactivation_1_power';
        }
        nextStep = 1;
      }
      // Step 2: 7 days after trial end
      else if (currentStep === 1 && daysSinceTrialEnd >= 7) {
        // Don't send if last email was sent less than 5 days ago
        if (user.reactivationLastSentAt) {
          const daysSinceLastEmail = Math.floor((now.getTime() - new Date(user.reactivationLastSentAt).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceLastEmail < 5) continue;
        }
        if (isSleeper) {
          emailData = getReactivationEmail2Sleeper(userName, user.id);
          emailType = 'reactivation_2_sleeper';
        } else {
          emailData = getReactivationEmail2PowerUser(userName, docCount, user.id);
          emailType = 'reactivation_2_power';
        }
        nextStep = 2;
      }
      // Step 3: 14 days after trial end
      else if (currentStep === 2 && daysSinceTrialEnd >= 14) {
        if (user.reactivationLastSentAt) {
          const daysSinceLastEmail = Math.floor((now.getTime() - new Date(user.reactivationLastSentAt).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceLastEmail < 5) continue;
        }
        emailData = getReactivationEmail3(userName, docCount, user.id);
        emailType = 'reactivation_3';
        nextStep = 3;
      }

      if (emailData && nextStep > 0) {
        const mailgunId = await sendReactivationEmail(user.email, emailData.subject, emailData.html, emailData.text);
        
        // Log to marketing_emails table
        await storage.createMarketingEmail({
          userId: user.id,
          emailType,
          subject: emailData.subject,
          recipientEmail: user.email,
          mailgunMessageId: mailgunId || undefined,
          status: mailgunId ? 'sent' : 'failed',
        });

        // Update user reactivation step
        await storage.updateUserReactivationStep(user.id, nextStep);
        
        sentCount++;
        console.log(`[ReactivationCron] Sent ${emailType} to ${user.email} (step ${nextStep})`);
      }
    }

    console.log(`[ReactivationCron] Finished. Sent ${sentCount} reactivation emails.`);
  } catch (error) {
    console.error("[ReactivationCron] Error:", error);
  }
}

export function startReactivationCron(): void {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
  
  console.log("[ReactivationCron] Starting cron job (runs every 6 hours)");
  
  // Run immediately on startup (delayed by 30 seconds to let other services start)
  setTimeout(() => {
    checkAndSendReactivationEmails();
  }, 30000);
  
  // Then run every 6 hours
  setInterval(() => {
    checkAndSendReactivationEmails();
  }, INTERVAL_MS);
}
