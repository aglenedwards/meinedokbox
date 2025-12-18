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

// Stripe Price IDs (from Stripe Dashboard - LIVE MODE)
export const STRIPE_PRICE_IDS = {
  solo: {
    monthly: "price_1SMvEJDu6qqEfVDmFKeAnn2g",
    yearly: "price_1SMvEJDu6qqEfVDmnaSGZ9Cd",
  },
  family: {
    monthly: "price_1SMvILDu6qqEfVDmQl7l6VaN",
    yearly: "price_1SMvILDu6qqEfVDm6hzJDM6X",
  },
  "family-plus": {
    monthly: "price_1SMvJUDu6qqEfVDmRleqxfKp",
    yearly: "price_1SMvJqDu6qqEfVDmL1yBdXuy",
  },
} as const;

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
    maxUploadsPerMonth: 200, // Same as Family plan
    maxStorageGB: 10,        // Same as Family plan
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: true,
    maxUsers: 2,             // Can invite 1 user during trial (same as Family)
    displayName: "Family-Trial",
    price: 0,
    trialDurationDays: 7,
  },
  solo: {
    maxUploadsPerMonth: 50,  // 50 new documents per month
    maxStorageGB: 2,         // 2GB total storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: false,
    maxUsers: 1,
    displayName: "Solo",
    priceMonthly: 4.99,      // inkl. 19% MwSt.
    priceYearly: 47.88,      // 3,99€/Monat × 12 (20% discount)
  },
  family: {
    maxUploadsPerMonth: 200, // 200 new documents per month
    maxStorageGB: 10,        // 10GB total storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: true,
    maxUsers: 2,             // Master + 1 invited user
    displayName: "Family",
    priceMonthly: 7.99,      // inkl. 19% MwSt.
    priceYearly: 83.88,      // 6,99€/Monat × 12 (12% discount)
  },
  "family-plus": {
    maxUploadsPerMonth: 500, // 500 new documents per month
    maxStorageGB: 25,        // 25GB total storage
    canUpload: true,
    canUseAI: true,
    canUseEmailInbound: true,
    maxUsers: 4,             // Master + 3 invited users
    displayName: "Family Plus",
    priceMonthly: 11.99,     // inkl. 19% MwSt.
    priceYearly: 119.88,     // 9,99€/Monat × 12 (17% discount)
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
  // Welcome modal (shown once on first login)
  hasSeenWelcomeModal: boolean("has_seen_welcome_modal").notNull().default(false),
  // Onboarding tour (shown once after welcome modal)
  hasSeenOnboarding: boolean("has_seen_onboarding").notNull().default(false),
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
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePriceId: varchar("stripe_price_id"),
  // Notification preferences
  notifyNewFeatures: boolean("notify_new_features").notNull().default(false),
  // Marketing attribution (UTM tracking)
  utmSource: varchar("utm_source"),
  utmMedium: varchar("utm_medium"),
  utmCampaign: varchar("utm_campaign"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Referral program
  referralCode: varchar("referral_code", { length: 12 }).unique(), // Unique referral code for this user
  referredBy: varchar("referred_by"), // User ID who referred this user
  referralBonusGB: real("referral_bonus_gb").notNull().default(0), // +1GB per active referral
  freeFromReferrals: boolean("free_from_referrals").notNull().default(false), // True if 5+ active referrals
});

// Referral tracking table
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(), // User who made the referral (Master gets credit, even if Slave referred)
  referredUserId: varchar("referred_user_id").notNull(), // User who was referred
  referredBySlaveId: varchar("referred_by_slave_id"), // If a Slave made the referral, track them here
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending (trial), active (paying), churned
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  activatedAt: timestamp("activated_at"), // When referred user became paying customer
  churnedAt: timestamp("churned_at"), // When referred user stopped paying
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

// System tags that are automatically assigned by AI
export const SYSTEM_TAGS = [
  "steuerrelevant",
  "geschäftlich",
  "privat",
  "versicherung",
  "miete",
  "gesundheit",
  "bank",
  "vertrag",
  "rechnung",
  "lohnabrechnung",
  "spende",
] as const;

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
  // Phase 3: Smart folders & scenarios
  year: real("year"), // Year extracted from document (for tax/time-based filtering)
  documentDate: timestamp("document_date"), // Exact date from document if available
  systemTags: text("system_tags").array(), // Auto-assigned tags by AI (e.g., "steuerrelevant", "geschäftlich")
  // Duplicate detection
  fileHash: varchar("file_hash", { length: 64 }), // SHA-256 hash for duplicate detection
  // Payment tracking for invoices/bills
  paymentStatus: varchar("payment_status", { length: 20 }).default("not_applicable"), // 'unpaid', 'paid', 'not_applicable'
  paymentReminderSentAt: timestamp("payment_reminder_sent_at").array(), // Track when reminders were sent
}, (table) => [
  index("idx_file_hash").on(table.fileHash), // Index for fast duplicate lookups
]);

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
  notificationType: varchar("notification_type", { length: 30 }).notNull(), // day_3, day_6
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

// Smart Folders - Intelligent document views based on filters
export const smartFolders = pgTable("smart_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  icon: varchar("icon", { length: 50 }).default("🔍"), // Emoji icon
  isSystem: boolean("is_system").notNull().default(false), // true = predefined by system, false = user-created
  // Filter configuration (stored as JSON)
  filters: jsonb("filters").notNull(), // { categories?: string[], systemTags?: string[], userTagIds?: string[], dateRange?: { from: string, to: string }, year?: number }
  downloadEnabled: boolean("download_enabled").notNull().default(true), // Can be downloaded as ZIP
  shareWithPartner: boolean("share_with_partner").notNull().default(false), // If true, all documents in this folder are visible to partners
  sortOrder: real("sort_order").notNull().default(0), // For custom ordering
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  documentDate: z.union([
    z.string().datetime(), // ISO datetime format
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Simple date format YYYY-MM-DD
  ]).nullable().optional(),
  amount: z.number().nullable().optional(),
  sender: z.string().max(200).nullable().optional(),
  systemTags: z.array(z.enum(SYSTEM_TAGS)).nullable().optional(),
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

export const insertSmartFolderSchema = createInsertSchema(smartFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Feature Request status options
export const FEATURE_REQUEST_STATUS = ["pending", "approved", "planned", "in_progress", "completed", "rejected"] as const;

// Feature Requests / Community Board
export const featureRequests = pgTable("feature_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, planned, in_progress, completed, rejected
  isPublished: boolean("is_published").notNull().default(false), // Admin must approve before visible
  adminNote: text("admin_note"), // Optional note from admin
  voteCount: real("vote_count").notNull().default(0), // Cached vote count (real user votes only)
  baseVotes: real("base_votes").notNull().default(0), // Admin-set base votes for social proof (displayed as voteCount + baseVotes)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Votes for feature requests
export const featureRequestVotes = pgTable("feature_request_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureRequestId: varchar("feature_request_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Video Tutorials
export const videoTutorials = pgTable("video_tutorials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(), // YouTube embed URL or direct video URL
  thumbnailUrl: text("thumbnail_url"),
  category: varchar("category", { length: 50 }).notNull(), // e.g., "Upload", "Ordner", "Suche", "Einstellungen"
  sortOrder: real("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Changelog / What's New entries
export const CHANGELOG_TYPES = ["new", "improved", "fixed"] as const;

export const changelog = pgTable("changelog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("new"), // new, improved, fixed
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertChangelogSchema = createInsertSchema(changelog).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureRequestSchema = createInsertSchema(featureRequests).omit({
  id: true,
  voteCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeatureRequestVoteSchema = createInsertSchema(featureRequestVotes).omit({
  id: true,
  createdAt: true,
});

export const insertVideoTutorialSchema = createInsertSchema(videoTutorials).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Extended document type with folder information (from LEFT JOIN)
export type DocumentWithFolder = Document & {
  folderName: string | null;
  folderIcon: string | null;
};

// Paginated documents response
export type PaginatedDocuments = {
  documents: DocumentWithFolder[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

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
export type InsertSmartFolder = z.infer<typeof insertSmartFolderSchema>;
export type SmartFolder = typeof smartFolders.$inferSelect;
export type InsertFeatureRequest = z.infer<typeof insertFeatureRequestSchema>;
export type FeatureRequest = typeof featureRequests.$inferSelect;
export type InsertFeatureRequestVote = z.infer<typeof insertFeatureRequestVoteSchema>;
export type FeatureRequestVote = typeof featureRequestVotes.$inferSelect;
export type InsertVideoTutorial = z.infer<typeof insertVideoTutorialSchema>;
export type VideoTutorial = typeof videoTutorials.$inferSelect;
export type InsertChangelog = z.infer<typeof insertChangelogSchema>;
export type Changelog = typeof changelog.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
