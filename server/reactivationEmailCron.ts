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

function getReactivationEmail1Sleeper(userName: string, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = "Dein digitaler Aktenschrank wartet auf dich!";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#244e7e;color:white;padding:25px;border-radius:8px 8px 0 0;text-align:center}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.button{display:inline-block;background:#244e7e;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px">Dein Aktenschrank wartet!</h1></div><div class="content"><p>Hey${userName ? ` ${userName}` : ''},</p><p>du hast dich bei MeineDokBox registriert, aber noch kein einziges Dokument hochgeladen. Dabei geht's so einfach:</p><ol><li><strong>Foto machen</strong> - Dokument abfotografieren</li><li><strong>Hochladen</strong> - Bild in die App ziehen</li><li><strong>Fertig!</strong> - Unsere KI sortiert alles automatisch</li></ol><p>Probier's doch einfach mal aus - dein erster Upload dauert keine 30 Sekunden!</p><a href="https://meinedokbox.de" class="button" style="color:white">Jetzt erstes Dokument hochladen</a><p style="color:#6b7280;font-size:14px;margin-top:25px">PS: Du hast eine Rechnung, einen Vertrag oder ein Attest rumliegen? Perfekt zum Testen!</p><div class="footer"><p><strong>MeineDokBox</strong> - Intelligente Dokumentenverwaltung</p><p style="font-size:11px"><a href="${unsubUrl}" style="color:#9ca3af">Keine weiteren E-Mails erhalten</a></p></div></div></div></body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\ndu hast dich bei MeineDokBox registriert, aber noch kein Dokument hochgeladen.\n\nSo einfach geht's:\n1. Foto machen\n2. Hochladen\n3. Fertig - die KI sortiert alles!\n\nProbier's aus: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

function getReactivationEmail1PowerUser(userName: string, docCount: number, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = `Dein Zugang ist abgelaufen - ${docCount} Dokument${docCount > 1 ? 'e' : ''} warten auf dich!`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#244e7e;color:white;padding:25px;border-radius:8px 8px 0 0;text-align:center}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.highlight{background:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;text-align:center;font-size:18px}.button{display:inline-block;background:#244e7e;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px">Deine Dokumente vermissen dich!</h1></div><div class="content"><p>Hey${userName ? ` ${userName}` : ''},</p><p>deine Testphase bei MeineDokBox ist abgelaufen.</p><div class="highlight"><strong>${docCount} Dokument${docCount > 1 ? 'e' : ''}</strong> warten auf dich in deinem Archiv</div><p>Die gute Nachricht: Deine Dokumente sind sicher gespeichert und gehen nicht verloren. Mit einem Abo hast du sofort wieder vollen Zugriff.</p><p>Schon ab <strong>2,99 EUR/Monat</strong> sicherst du dir:</p><ul><li>Unbegrenzten Zugriff auf alle deine Dokumente</li><li>KI-gesteuerte Kategorisierung</li><li>Dokumente mit dem Partner teilen</li></ul><a href="https://meinedokbox.de" class="button" style="color:white">Jetzt Zugang sichern</a><div class="footer"><p><strong>MeineDokBox</strong> - Intelligente Dokumentenverwaltung</p><p style="font-size:11px"><a href="${unsubUrl}" style="color:#9ca3af">Keine weiteren E-Mails erhalten</a></p></div></div></div></body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\ndeine Testphase ist abgelaufen. ${docCount} Dokument${docCount > 1 ? 'e' : ''} warten auf dich!\n\nSchon ab 2,99 EUR/Monat: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

function getReactivationEmail2Sleeper(userName: string, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = "Noch unsicher? So einfach geht Dokumenten-Management";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#244e7e;color:white;padding:25px;border-radius:8px 8px 0 0;text-align:center}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.button{display:inline-block;background:#244e7e;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}.feature-box{background:white;padding:15px;border-radius:6px;margin:10px 0;border-left:3px solid #244e7e}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px">Warum Papierkram digital besser ist</h1></div><div class="content"><p>Hey${userName ? ` ${userName}` : ''},</p><p>vielleicht hattest du noch keine Zeit zum Testen. Kein Problem! Hier sind 3 Situationen, in denen MeineDokBox Gold wert ist:</p><div class="feature-box"><strong>Steuererklaerung:</strong> Alle Belege sofort finden statt stundenlang suchen</div><div class="feature-box"><strong>Versicherungsfall:</strong> Police in Sekunden parat, nicht in Ordnern wuehlen</div><div class="feature-box"><strong>Umzug/Arztwechsel:</strong> Alle Unterlagen digital dabei, nichts vergessen</div><p>Der Clou: Unsere KI erkennt automatisch, was auf dem Dokument steht und sortiert es fuer dich ein.</p><a href="https://meinedokbox.de" class="button" style="color:white">Kostenlos ausprobieren</a><div class="footer"><p><strong>MeineDokBox</strong> - Intelligente Dokumentenverwaltung</p><p style="font-size:11px"><a href="${unsubUrl}" style="color:#9ca3af">Keine weiteren E-Mails erhalten</a></p></div></div></div></body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\nWarum Papierkram digital besser ist:\n- Steuererklaerung: Belege sofort finden\n- Versicherungsfall: Police in Sekunden parat\n- Umzug: Alle Unterlagen digital dabei\n\nJetzt testen: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

function getReactivationEmail2PowerUser(userName: string, docCount: number, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = `Vermisst du deine ${docCount} Dokumente?`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#244e7e;color:white;padding:25px;border-radius:8px 8px 0 0;text-align:center}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.button{display:inline-block;background:#244e7e;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px">Deine Dokumente warten immer noch</h1></div><div class="content"><p>Hey${userName ? ` ${userName}` : ''},</p><p>du hast <strong>${docCount} Dokument${docCount > 1 ? 'e' : ''}</strong> in deiner DokBox gespeichert. Die sind weiterhin sicher bei uns - aber ohne aktives Abo kannst du keine neuen hinzufuegen.</p><p>Wusstest du schon? Mit dem Empfehlungsprogramm kannst du dir dein Abo sogar <strong>komplett kostenlos</strong> sichern! Einfach 5 Freunde einladen.</p><a href="https://meinedokbox.de" class="button" style="color:white">Zugang wiederherstellen</a><p style="color:#6b7280;font-size:14px">Schon ab 2,99 EUR/Monat - weniger als ein Kaffee!</p><div class="footer"><p><strong>MeineDokBox</strong> - Intelligente Dokumentenverwaltung</p><p style="font-size:11px"><a href="${unsubUrl}" style="color:#9ca3af">Keine weiteren E-Mails erhalten</a></p></div></div></div></body></html>`;
  const text = `Hey${userName ? ` ${userName}` : ''},\n\n${docCount} Dokumente warten in deiner DokBox. Ohne Abo kannst du keine neuen hinzufuegen.\n\nTipp: Mit 5 Empfehlungen wird dein Abo kostenlos!\n\nZugang wiederherstellen: https://meinedokbox.de\n\nKeine weiteren E-Mails: ${unsubUrl}`;
  return { subject, html, text };
}

function getReactivationEmail3(userName: string, docCount: number, userId: string) {
  const unsubUrl = getUnsubscribeUrl(userId);
  const subject = "Letzte Erinnerung: Sichere dir deinen Zugang";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#244e7e;color:white;padding:25px;border-radius:8px 8px 0 0;text-align:center}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.button{display:inline-block;background:#244e7e;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px">Wir vermissen dich!</h1></div><div class="content"><p>Hey${userName ? ` ${userName}` : ''},</p><p>dies ist unsere letzte Erinnerung - versprochen! Wir moechten dich nicht nerven.</p>${docCount > 0 ? `<p>Deine <strong>${docCount} gespeicherten Dokumente</strong> bleiben natuerlich erhalten.</p>` : ''}<p>Falls MeineDokBox nichts fuer dich ist, verstehen wir das. Aber falls du es dir anders ueberlegst - wir sind jederzeit fuer dich da!</p><a href="https://meinedokbox.de" class="button" style="color:white">Nochmal reinschauen</a><p style="color:#6b7280;font-size:14px">Du erhaeltst nach dieser E-Mail keine weiteren Erinnerungen von uns.</p><div class="footer"><p><strong>MeineDokBox</strong> - Intelligente Dokumentenverwaltung</p><p style="font-size:11px"><a href="${unsubUrl}" style="color:#9ca3af">Keine weiteren E-Mails erhalten</a></p></div></div></div></body></html>`;
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
