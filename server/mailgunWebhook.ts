import crypto from "crypto";
import { storage } from "./storage";
import type { Express } from "express";
import { db } from "./db";
import { users, marketingEmails } from "@shared/schema";
import { eq } from "drizzle-orm";

function verifyWebhookSignature(signingKey: string, timestamp: string, token: string, signature: string): boolean {
  const encodedToken = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp.concat(token))
    .digest("hex");
  return encodedToken === signature;
}

export function setupMailgunWebhooks(app: Express) {
  app.post("/api/webhooks/mailgun", async (req, res) => {
    try {
      const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
      if (!signingKey) {
        console.error("[Mailgun Webhook] No signing key configured");
        return res.status(500).json({ message: "Webhook not configured" });
      }

      const eventData = req.body;
      const signature = eventData?.signature;
      
      if (!signature) {
        return res.status(400).json({ message: "Missing signature" });
      }

      const isValid = verifyWebhookSignature(
        signingKey,
        signature.timestamp,
        signature.token,
        signature.signature
      );

      if (!isValid) {
        console.error("[Mailgun Webhook] Invalid signature");
        return res.status(401).json({ message: "Invalid signature" });
      }

      const event = eventData["event-data"];
      if (!event) {
        return res.status(200).json({ message: "No event data" });
      }

      const eventType = event.event;
      const messageId = event.message?.headers?.["message-id"];
      
      if (!messageId) {
        console.log(`[Mailgun Webhook] Event ${eventType} without message-id, skipping`);
        return res.status(200).json({ message: "OK" });
      }

      // Find the marketing email by mailgun message ID
      const marketingEmail = await storage.getMarketingEmailByMailgunId(messageId);
      
      if (!marketingEmail) {
        // Could be a transactional email, not tracked in marketing_emails
        console.log(`[Mailgun Webhook] Event ${eventType} for unknown message ${messageId}`);
        return res.status(200).json({ message: "OK" });
      }

      const now = new Date();

      switch (eventType) {
        case "delivered":
          await storage.updateMarketingEmailStatus(marketingEmail.id, "delivered", {
            deliveredAt: now,
          });
          console.log(`[Mailgun Webhook] Delivered: ${marketingEmail.id}`);
          break;

        case "opened":
          await storage.updateMarketingEmailStatus(marketingEmail.id, "opened", {
            openedAt: marketingEmail.openedAt || now,
            openCount: (marketingEmail.openCount || 0) + 1,
          });
          console.log(`[Mailgun Webhook] Opened: ${marketingEmail.id} (count: ${(marketingEmail.openCount || 0) + 1})`);
          break;

        case "clicked":
          await storage.updateMarketingEmailStatus(marketingEmail.id, "clicked", {
            clickedAt: marketingEmail.clickedAt || now,
            clickCount: (marketingEmail.clickCount || 0) + 1,
          });
          console.log(`[Mailgun Webhook] Clicked: ${marketingEmail.id}`);
          break;

        case "unsubscribed":
          // Mark user as unsubscribed from marketing
          if (marketingEmail.userId) {
            await storage.updateUserUnsubscribe(marketingEmail.userId, true);
            console.log(`[Mailgun Webhook] User ${marketingEmail.userId} unsubscribed from marketing`);
          }
          break;

        case "failed":
        case "bounced":
          await storage.updateMarketingEmailStatus(marketingEmail.id, eventType, {});
          console.log(`[Mailgun Webhook] ${eventType}: ${marketingEmail.id}`);
          break;

        default:
          console.log(`[Mailgun Webhook] Unhandled event: ${eventType}`);
      }

      res.status(200).json({ message: "OK" });
    } catch (error) {
      console.error("[Mailgun Webhook] Error:", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  console.log("[Mailgun Webhook] Webhook endpoint registered at /api/webhooks/mailgun");
}
