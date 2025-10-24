import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, varchar, timestamp, real, boolean } from "drizzle-orm/pg-core";
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
export const SUBSCRIPTION_PLANS = ["free", "trial", "solo", "family", "family-plus"] as const;

// Document limits per subscription plan
export const PLAN_LIMITS = {
  free: {
    maxUploadsPerMonth: 0,   // Read-only: no uploads allowed
    maxStorageGB: 2,         // Can keep existing documents up to 2GB
    canUpload: false,        // Read-only: can only view/download existing documents
    canUseAI: false,
    canUseEmailInbound: false,
    maxUsers: 1,
    displayName: "Free",
    price: 0,
  },
  trial: {
    maxUploadsPerMonth: 500, // Generous trial limit
    maxStorageGB: 25,        // Generous trial storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: true,
    maxUsers: 2,             // Can invite 1 user during trial
    displayName: "Family-Trial",
    price: 0,
    trialDurationDays: 14,
  },
  solo: {
    maxUploadsPerMonth: 50,  // 50 new documents per month
    maxStorageGB: 2,         // 2GB total storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: false,
    maxUsers: 1,
    displayName: "Solo",
    priceMonthly: 3.99,
    priceYearly: 38.30,      // 20% discount
  },
  family: {
    maxUploadsPerMonth: 200, // 200 new documents per month
    maxStorageGB: 10,        // 10GB total storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: true,
    maxUsers: 2,             // Master + 1 invited user
    displayName: "Family",
    priceMonthly: 6.99,
    priceYearly: 67.10,      // 20% discount
  },
  "family-plus": {
    maxUploadsPerMonth: 500, // 500 new documents per month
    maxStorageGB: 25,        // 25GB total storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: true,
    maxUsers: 4,             // Master + 3 invited users
    displayName: "Family Plus",
    priceMonthly: 9.99,
    priceYearly: 95.90,      // 20% discount
  },
} as const;

// User storage table with Email/Password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash"), // bcrypt hash for password authentication
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  // E-Mail verification (Double Opt-in)
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  // Password reset
  passwordResetToken: varchar("password_reset_token"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"),
  // E-Mail Inbound feature
  inboundEmail: varchar("inbound_email").unique(),
  emailWhitelist: text("email_whitelist").array(),
  // Subscription management
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  // Upload tracking (monthly limit)
  uploadedThisMonth: real("uploaded_this_month").notNull().default(0),
  uploadCounterResetAt: timestamp("upload_counter_reset_at").defaultNow(),
  // Billing address (collected only when upgrading to premium)
  billingCompany: varchar("billing_company"),
  billingStreet: varchar("billing_street"),
  billingPostalCode: varchar("billing_postal_code"),
  billingCity: varchar("billing_city"),
  billingCountry: varchar("billing_country").default("Deutschland"),
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

// Folders for document organization
export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  isShared: boolean("is_shared").notNull().default(true), // If true, shared users can see documents in this folder
  icon: varchar("icon", { length: 50 }).default("📂"), // Emoji icon for visual distinction
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  folderId: varchar("folder_id"), // Optional: documents can be in a folder or not
  title: text("title").notNull(),
  category: text("category").notNull(),
  extractedText: text("extracted_text").notNull(),
  fileUrl: text("file_url"),
  pageUrls: text("page_urls").array(),
  thumbnailUrl: text("thumbnail_url"),
  mimeType: varchar("mime_type", { length: 100 }),
  confidence: real("confidence").notNull(),
  isShared: boolean("is_shared").notNull().default(false), // DEFAULT: docs are private (not shared). User can manually share.
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

// Email whitelist for inbound email security
export const emailWhitelist = pgTable("email_whitelist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  allowedEmail: varchar("allowed_email").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Shared Access - Premium feature to share account with a second person
export const sharedAccess = pgTable("shared_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(), // Premium user who owns the account
  sharedWithEmail: varchar("shared_with_email").notNull(), // Email of invited person
  sharedWithUserId: varchar("shared_with_user_id"), // Set when invitation is accepted and user logs in
  invitationToken: varchar("invitation_token").unique(), // Unique token for invitation link
  tokenExpiresAt: timestamp("token_expires_at"), // Token expiry (7 days from invitation)
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, active, revoked, expired
  invitedAt: timestamp("invited_at").notNull().default(sql`now()`),
  acceptedAt: timestamp("accepted_at"),
});

// Trial notification emails tracking
export const trialNotifications = pgTable("trial_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  notificationType: varchar("notification_type", { length: 30 }).notNull(), // day_14, grace_start, grace_last_day, readonly_start
  sentAt: timestamp("sent_at").notNull().default(sql`now()`),
  emailStatus: varchar("email_status", { length: 20 }).notNull().default("sent"), // sent, failed, bounced
});

// Email queue jobs for reliable email delivery with PostgreSQL persistence
export const emailJobs = pgTable("email_jobs", {
  id: varchar("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // verification, invitation
  email: varchar("email").notNull(),
  name: varchar("name"),
  token: varchar("token").notNull(),
  attempts: real("attempts").notNull().default(0),
  maxAttempts: real("max_attempts").notNull().default(3),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, success, failed
  error: text("error"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastAttemptAt: timestamp("last_attempt_at"),
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
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

export const insertSharedAccessSchema = createInsertSchema(sharedAccess).omit({
  id: true,
  invitedAt: true,
});

export const insertTrialNotificationSchema = createInsertSchema(trialNotifications).omit({
  id: true,
  sentAt: true,
});

export const insertEmailWhitelistSchema = createInsertSchema(emailWhitelist).omit({
  id: true,
  createdAt: true,
});

export const insertEmailJobSchema = createInsertSchema(emailJobs).omit({
  createdAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;
export type DocumentTag = typeof documentTags.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertSharedAccess = z.infer<typeof insertSharedAccessSchema>;
export type SharedAccess = typeof sharedAccess.$inferSelect;
export type InsertTrialNotification = z.infer<typeof insertTrialNotificationSchema>;
export type TrialNotification = typeof trialNotifications.$inferSelect;
export type InsertEmailWhitelist = z.infer<typeof insertEmailWhitelistSchema>;
export type EmailWhitelist = typeof emailWhitelist.$inferSelect;
export type InsertEmailJob = z.infer<typeof insertEmailJobSchema>;
export type EmailJob = typeof emailJobs.$inferSelect;
