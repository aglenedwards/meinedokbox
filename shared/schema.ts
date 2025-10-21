import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, varchar, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscription plans
export const SUBSCRIPTION_PLANS = ["free", "trial", "premium"] as const;

// Document limits per subscription plan
export const PLAN_LIMITS = {
  free: {
    maxDocuments: 50,
    canUseEmailInbound: false,
    displayName: "Free",
    price: 0,
  },
  trial: {
    maxDocuments: -1, // unlimited during trial
    canUseEmailInbound: true,
    displayName: "Trial (2 Wochen)",
    price: 0,
    trialDurationDays: 14,
  },
  premium: {
    maxDocuments: -1, // unlimited
    canUseEmailInbound: true,
    displayName: "Premium",
    price: 4.99,
  },
} as const;

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // E-Mail Inbound feature
  inboundEmail: varchar("inbound_email").unique(),
  emailWhitelist: text("email_whitelist").array(),
  // Subscription management
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 15 document categories covering all common document types
export const DOCUMENT_CATEGORIES = [
  "Finanzen & Banken",
  "Versicherungen", 
  "Steuern & Buchhaltung",
  "Arbeit & Gehalt",
  "Verträge & Abos",
  "Behörden & Amtliches",
  "Gesundheit & Arzt",
  "Wohnen & Immobilien",
  "Auto & Mobilität",
  "Schule & Ausbildung",
  "Familie & Kinder",
  "Rente & Vorsorge",
  "Einkäufe & Online-Bestellungen",
  "Reisen & Freizeit",
  "Sonstiges / Privat"
] as const;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  extractedText: text("extracted_text").notNull(),
  fileUrl: text("file_url"),
  pageUrls: text("page_urls").array(),
  thumbnailUrl: text("thumbnail_url"),
  mimeType: varchar("mime_type", { length: 100 }),
  confidence: real("confidence").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
  deletedAt: timestamp("deleted_at"),
  // Phase 2: Smart metadata extraction
  extractedDate: timestamp("extracted_date"),
  amount: real("amount"),
  sender: text("sender"),
});

// Tags system for document organization
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Junction table for many-to-many relationship between documents and tags
export const documentTags = pgTable("document_tags", {
  documentId: varchar("document_id").notNull(),
  tagId: varchar("tag_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// E-Mail processing logs
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fromAddress: text("from_address").notNull(),
  subject: text("subject"),
  receivedAt: timestamp("received_at").notNull().default(sql`now()`),
  attachmentCount: real("attachment_count").notNull().default(0),
  processedCount: real("processed_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, success, error
  errorMessage: text("error_message"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentTagSchema = createInsertSchema(documentTags).omit({
  createdAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  receivedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;
export type DocumentTag = typeof documentTags.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;
