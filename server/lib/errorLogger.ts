import { db } from "../db";
import { errorLogs } from "@shared/schema";
import { desc, gte, count, sql, and, eq } from "drizzle-orm";
import { sendEmail } from "./sendEmail";

const ADMIN_EMAIL = "service@meinedokbox.de";
const EMAIL_THROTTLE_MS = 5 * 60 * 1000;
const emailThrottle = new Map<string, number>();

export interface ErrorLogData {
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  url?: string;
  method?: string;
  userId?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export function logError(data: ErrorLogData): void {
  setImmediate(async () => {
    try {
      await db.insert(errorLogs).values({
        level: data.level,
        message: data.message.substring(0, 2000),
        stack: data.stack ? data.stack.substring(0, 5000) : null,
        url: data.url || null,
        method: data.method || null,
        userId: data.userId || null,
        statusCode: data.statusCode || null,
        durationMs: data.durationMs || null,
        metadata: data.metadata || null,
      });

      if (data.level === "error" && (data.statusCode ?? 0) >= 500) {
        const throttleKey = `${data.statusCode}:${data.message.substring(0, 60)}`;
        const lastSent = emailThrottle.get(throttleKey) ?? 0;
        if (Date.now() - lastSent > EMAIL_THROTTLE_MS) {
          emailThrottle.set(throttleKey, Date.now());
          sendErrorAlertEmail(data).catch(() => {});
        }
      }
    } catch {
    }
  });
}

async function sendErrorAlertEmail(data: ErrorLogData): Promise<void> {
  const time = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const subject = `[MeineDokBox] Server-Fehler ${data.statusCode ?? ""}: ${data.message.substring(0, 80)}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2 style="color: #dc2626; margin-bottom: 8px;">Server-Fehler aufgetreten</h2>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding:4px 8px; font-weight:bold; color:#555; width:120px;">Zeit</td><td style="padding:4px 8px;">${time}</td></tr>
        <tr><td style="padding:4px 8px; font-weight:bold; color:#555;">Status</td><td style="padding:4px 8px;">${data.statusCode ?? "–"}</td></tr>
        <tr><td style="padding:4px 8px; font-weight:bold; color:#555;">Methode</td><td style="padding:4px 8px;">${data.method ?? "–"} ${data.url ?? ""}</td></tr>
        <tr><td style="padding:4px 8px; font-weight:bold; color:#555;">User-ID</td><td style="padding:4px 8px;">${data.userId ?? "nicht eingeloggt"}</td></tr>
        <tr><td style="padding:4px 8px; font-weight:bold; color:#555;">Dauer</td><td style="padding:4px 8px;">${data.durationMs != null ? `${data.durationMs} ms` : "–"}</td></tr>
        <tr><td style="padding:4px 8px; font-weight:bold; color:#555;">Fehler</td><td style="padding:4px 8px; color:#dc2626;">${data.message}</td></tr>
      </table>
      ${data.stack ? `<pre style="background:#f5f5f5; padding:12px; border-radius:4px; font-size:12px; overflow:auto; white-space:pre-wrap;">${data.stack.substring(0, 2000)}</pre>` : ""}
      <p style="color:#888; font-size:12px;">Weitere Fehler vom gleichen Typ werden 5 Minuten lang nicht gemeldet.</p>
    </div>
  `;

  const text = `Server-Fehler: ${data.message}\nStatus: ${data.statusCode}\nURL: ${data.method} ${data.url}\nUser: ${data.userId ?? "–"}\nZeit: ${time}`;

  await sendEmail({ to: ADMIN_EMAIL, subject, html, text });
}

export async function getErrorLogStats() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayResult, weekResult, monthResult, totalResult, byLevelResult] = await Promise.all([
    db.select({ count: count() }).from(errorLogs).where(gte(errorLogs.createdAt, since24h)),
    db.select({ count: count() }).from(errorLogs).where(gte(errorLogs.createdAt, since7d)),
    db.select({ count: count() }).from(errorLogs).where(gte(errorLogs.createdAt, since30d)),
    db.select({ count: count() }).from(errorLogs),
    db.select({ level: errorLogs.level, count: count() }).from(errorLogs).groupBy(errorLogs.level),
  ]);

  const byLevel: Record<string, number> = {};
  for (const row of byLevelResult) {
    byLevel[row.level] = row.count;
  }

  return {
    today: todayResult[0]?.count ?? 0,
    week: weekResult[0]?.count ?? 0,
    month: monthResult[0]?.count ?? 0,
    total: totalResult[0]?.count ?? 0,
    byLevel,
  };
}

export async function getErrorLogsPage(options: {
  level?: string;
  periodHours?: number;
  limit: number;
  offset: number;
}) {
  const { level, periodHours, limit, offset } = options;
  const conditions = [];

  if (level && level !== "all") {
    conditions.push(eq(errorLogs.level, level));
  }
  if (periodHours) {
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    conditions.push(gte(errorLogs.createdAt, since));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, totalResult] = await Promise.all([
    db.select().from(errorLogs)
      .where(whereClause)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(errorLogs).where(whereClause),
  ]);

  return {
    logs,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function clearErrorLogs(): Promise<void> {
  await db.delete(errorLogs);
}
