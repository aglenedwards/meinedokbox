import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, varchar, timestamp, real, boolean } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts - each account can have multiple users (owner + members)
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUserId: varchar("owner_user_id").notNull(),
  name: text("name"), // Optional: "Familie Müller", "Mein Account", etc.
  baseSeats: integer("base_seats").notNull().default(2), // From plan/subscription
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Account members - links users to accounts with roles
export const accountMembers = pgTable("account_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"), // owner, member
  canUpload: boolean("can_upload").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Invitations - token-based invites to join accounts
export const invites = pgTable("invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  email: varchar("email").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  canUpload: boolean("can_upload").notNull().default(true),
  token: varchar("token").notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, expired
  invitedBy: varchar("invited_by").notNull(), // user_id who sent the invite
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
});

// Entitlements - flexible key-value storage for account features
export const entitlements = pgTable("entitlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  key: varchar("key", { length: 100 }).notNull(), // e.g. 'addon_seats', 'max_documents', 'has_export'
  valueInt: integer("value_int"), // For numeric values
  valueText: text("value_text"), // For text values
  valueBool: boolean("value_bool"), // For boolean values
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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
  userId: varchar("user_id").notNull(), // Keep for backward compatibility
  accountId: varchar("account_id"), // New: documents belong to accounts
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

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertAccountMemberSchema = createInsertSchema(accountMembers).omit({
  id: true,
  createdAt: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertEntitlementSchema = createInsertSchema(entitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccountMember = z.infer<typeof insertAccountMemberSchema>;
export type AccountMember = typeof accountMembers.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type Invite = typeof invites.$inferSelect;
export type InsertEntitlement = z.infer<typeof insertEntitlementSchema>;
export type Entitlement = typeof entitlements.$inferSelect;
