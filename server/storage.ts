import { type User, type UpsertUser, type Document, type InsertDocument, type Tag, type InsertTag, type DocumentTag, type InsertDocumentTag, type SharedAccess, type InsertSharedAccess, type Folder, type InsertFolder, type TrialNotification, type InsertTrialNotification, type EmailWhitelist } from "@shared/schema";
import { db } from "./db";
import { users, documents, tags, documentTags, sharedAccess, folders, trialNotifications, emailWhitelist } from "@shared/schema";
import { eq, and, or, like, desc, asc, isNull, isNotNull, inArray, sql } from "drizzle-orm";
import { generateInboundEmail } from "./lib/emailInbound";
import crypto from "crypto";

export interface StorageStats {
  usedBytes: number;
  usedMB: number;
  usedGB: number;
  totalGB: number;
  percentageUsed: number;
  documentCount: number;
}

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "category-asc";

export interface PaginatedDocuments {
  documents: Document[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(id: string, data: Partial<Pick<User, 'subscriptionPlan' | 'trialEndsAt' | 'subscriptionEndsAt'>>): Promise<User | undefined>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUserId(userId: string, sortBy?: SortOption, includeOnlySharedFolders?: boolean): Promise<Document[]>;
  searchDocuments(userId: string, query?: string, categories?: string[], sortBy?: SortOption, includeOnlySharedFolders?: boolean, limit?: number, cursor?: string): Promise<PaginatedDocuments>;
  updateDocumentCategory(id: string, userId: string, category: string): Promise<Document | undefined>;
  updateDocumentSharing(id: string, userId: string, isShared: boolean): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<boolean>;
  bulkDeleteDocuments(ids: string[], userId: string): Promise<number>;
  getTrashedDocuments(userId: string): Promise<Document[]>;
  restoreDocument(id: string, userId: string): Promise<Document | undefined>;
  permanentlyDeleteDocument(id: string, userId: string): Promise<boolean>;
  getUserStorageStats(userId: string): Promise<StorageStats>;
  
  // Phase 2: Tags management
  createTag(tag: InsertTag): Promise<Tag>;
  getTags(userId: string): Promise<Tag[]>;
  updateTag(id: string, userId: string, data: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: string, userId: string): Promise<boolean>;
  addTagToDocument(documentId: string, tagId: string): Promise<DocumentTag>;
  removeTagFromDocument(documentId: string, tagId: string): Promise<boolean>;
  getDocumentTags(documentId: string): Promise<Tag[]>;
  getDocumentsByTag(userId: string, tagId: string): Promise<Document[]>;
  
  // Shared Access management (Premium feature)
  createSharedAccess(data: InsertSharedAccess): Promise<SharedAccess>;
  getSharedAccessByOwner(ownerId: string): Promise<SharedAccess | undefined>;
  getAllSharedAccessByOwner(ownerId: string): Promise<SharedAccess[]>;
  getSharedAccessByEmail(email: string): Promise<SharedAccess | undefined>;
  getSharedAccessByToken(token: string): Promise<SharedAccess | undefined>;
  acceptSharedInvitation(email: string, userId: string): Promise<SharedAccess | undefined>;
  acceptSharedInvitationByToken(token: string, userId: string): Promise<SharedAccess | undefined>;
  revokeSharedAccess(ownerId: string): Promise<boolean>;
  resendInvitation(invitationId: string, ownerId: string): Promise<SharedAccess | undefined>;
  getAccessibleAccounts(userId: string): Promise<{ ownedAccount: User | undefined; sharedAccounts: (SharedAccess & { owner: User })[] }>;
  
  // Folders management
  createFolder(folder: InsertFolder): Promise<Folder>;
  getUserFolders(userId: string): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  updateFolder(id: string, userId: string, data: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string, userId: string): Promise<boolean>;
  createDefaultFolders(userId: string): Promise<void>;
  
  // Trial notifications tracking
  createTrialNotification(data: InsertTrialNotification): Promise<TrialNotification>;
  getTrialNotification(userId: string, notificationType: string): Promise<TrialNotification | undefined>;
  getUsersNeedingTrialNotifications(): Promise<User[]>;
  
  // Email whitelist management (Security feature for inbound email)
  getEmailWhitelist(userId: string): Promise<EmailWhitelist[]>;
  getEmailWhitelistEntry(userId: string, email: string): Promise<EmailWhitelist | undefined>;
  addEmailToWhitelist(userId: string, email: string): Promise<EmailWhitelist>;
  removeEmailFromWhitelist(id: string, userId: string): Promise<boolean>;
  isEmailWhitelisted(userId: string, email: string): Promise<boolean>;
  
  // Partner access helper (for Master-Slave document sharing)
  getPartnerUserIds(userId: string): Promise<string[]>;
  
  // Upload counter management (monthly limit tracking)
  incrementUploadCounter(userId: string, incrementBy?: number): Promise<User | undefined>;
  resetUploadCounter(userId: string): Promise<User | undefined>;
  checkAndResetUploadCounter(userId: string): Promise<User | undefined>;
  
  // Admin functions
  getAllUsers(): Promise<User[]>;
  deleteUserCompletely(userId: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  private getSortOrder(sortBy?: SortOption) {
    switch (sortBy) {
      case "date-asc":
        return asc(documents.uploadedAt);
      case "title-asc":
        return asc(sql`LOWER(${documents.title})`);
      case "title-desc":
        return desc(sql`LOWER(${documents.title})`);
      case "category-asc":
        return asc(documents.category);
      case "date-desc":
      default:
        return desc(documents.uploadedAt);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUser(userData.id!);
    
    // For new users: Set up 14-day trial
    const isNewUser = !existingUser;
    const trialDurationMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    
    // Generate inbound email only for new users (using firstname.lastname format)
    let inboundEmail = existingUser?.inboundEmail;
    if (!inboundEmail && userData.firstName && userData.lastName) {
      inboundEmail = await generateInboundEmail(userData.firstName, userData.lastName);
    }
    
    const dataToInsert = {
      ...userData,
      inboundEmail,
      // Set trial end date for new users
      subscriptionPlan: isNewUser ? 'trial' : existingUser?.subscriptionPlan,
      trialEndsAt: isNewUser ? new Date(Date.now() + trialDurationMs) : existingUser?.trialEndsAt,
    };
    
    const [user] = await db
      .insert(users)
      .values(dataToInsert)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create default folders for new users
    if (isNewUser) {
      await this.createDefaultFolders(user.id);
      console.log(`[UpsertUser] Created default folders for new user ${user.id}`);
    }
    
    return user;
  }

  async updateUserSubscription(
    id: string,
    data: Partial<Pick<User, 'subscriptionPlan' | 'trialEndsAt' | 'subscriptionEndsAt'>>
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByUserId(userId: string, sortBy?: SortOption, includeOnlySharedFolders?: boolean): Promise<Document[]> {
    // Build base where clause
    let whereClause = and(
      eq(documents.userId, userId),
      isNull(documents.deletedAt)
    ) as any;

    // If shared user, filter to only show shared documents
    if (includeOnlySharedFolders) {
      whereClause = and(
        whereClause,
        eq(documents.isShared, true)
      ) as any;
    }

    return db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(this.getSortOrder(sortBy));
  }

  async searchDocuments(
    userId: string, 
    query?: string, 
    categories?: string[], 
    sortBy?: SortOption, 
    includeOnlySharedFolders?: boolean,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginatedDocuments> {
    // Get partner IDs for document sharing (Master <-> Slave)
    const partnerIds = await this.getPartnerUserIds(userId);

    // Build base where clause:
    // Show documents that are either:
    // 1. User's own documents (userId = myId)
    // 2. Shared documents from partners (userId IN partnerIds AND isShared = true)
    let whereClause: any;
    
    if (partnerIds.length > 0) {
      // User has partners - show own docs + shared partner docs
      whereClause = and(
        or(
          eq(documents.userId, userId), // Own documents
          and(
            inArray(documents.userId, partnerIds), // Partner's documents
            eq(documents.isShared, true) // Only if shared
          )
        ),
        isNull(documents.deletedAt)
      );
    } else {
      // No partners - show only own documents
      whereClause = and(
        eq(documents.userId, userId),
        isNull(documents.deletedAt)
      );
    }

    // Legacy support: if includeOnlySharedFolders is set (deprecated, not used anymore)
    // This was for the old folder-based privacy system
    if (includeOnlySharedFolders) {
      whereClause = and(
        whereClause,
        eq(documents.isShared, true)
      ) as any;
    }

    if (categories && categories.length > 0) {
      whereClause = and(whereClause, inArray(documents.category, categories)) as any;
    }

    if (query) {
      whereClause = and(
        whereClause,
        or(
          like(documents.title, `%${query}%`),
          like(documents.extractedText, `%${query}%`)
        )
      ) as any;
    }

    // Apply cursor-based pagination (using uploadedAt + id for unique ordering)
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split('_');
      whereClause = and(
        whereClause,
        or(
          sql`${documents.uploadedAt} < ${new Date(cursorDate)}`,
          and(
            sql`${documents.uploadedAt} = ${new Date(cursorDate)}`,
            sql`${documents.id} < ${cursorId}`
          )
        )
      ) as any;
    }

    // Get total count (without pagination)
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(whereClause);
    const total = countResult?.count || 0;

    // Fetch documents with limit + 1 to check if there are more
    const results = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(this.getSortOrder(sortBy), desc(documents.id)) // Secondary sort by id for stable ordering
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const documentsPage = hasMore ? results.slice(0, limit) : results;

    // Generate next cursor from last document
    const nextCursor = hasMore && documentsPage.length > 0
      ? `${documentsPage[documentsPage.length - 1].uploadedAt.toISOString()}_${documentsPage[documentsPage.length - 1].id}`
      : null;

    return {
      documents: documentsPage,
      nextCursor,
      hasMore,
      total,
    };
  }

  async updateDocumentCategory(id: string, userId: string, category: string): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ category })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.userId, userId)
        )
      )
      .returning();
    return updated;
  }

  async updateDocumentSharing(id: string, userId: string, isShared: boolean): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ isShared })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.userId, userId)
        )
      )
      .returning();
    return updated;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    // Soft delete: set deletedAt timestamp
    const result = await db
      .update(documents)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.userId, userId),
          isNull(documents.deletedAt)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async bulkDeleteDocuments(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;
    
    const result = await db
      .update(documents)
      .set({ deletedAt: new Date() })
      .where(
        and(
          inArray(documents.id, ids),
          eq(documents.userId, userId),
          isNull(documents.deletedAt)
        )
      );
    return result.rowCount || 0;
  }

  async getTrashedDocuments(userId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          isNotNull(documents.deletedAt)
        )
      )
      .orderBy(desc(documents.deletedAt));
  }

  async restoreDocument(id: string, userId: string): Promise<Document | undefined> {
    const [restored] = await db
      .update(documents)
      .set({ deletedAt: null })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.userId, userId),
          isNotNull(documents.deletedAt)
        )
      )
      .returning();
    return restored;
  }

  async permanentlyDeleteDocument(id: string, userId: string): Promise<boolean> {
    // Get document first to retrieve file paths
    const [doc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.userId, userId),
          isNotNull(documents.deletedAt)
        )
      )
      .limit(1);

    if (!doc) {
      return false;
    }

    // Delete files from S3 storage
    const { s3Client } = await import("./objectStorage");
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    
    // Helper to parse S3 paths
    const parseS3Path = (path: string) => {
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      const pathParts = path.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");
      return { bucketName, objectName };
    };

    // Collect all file paths to delete
    const filesToDelete: string[] = [];
    
    // Add all page files
    if (doc.pageUrls && doc.pageUrls.length > 0) {
      filesToDelete.push(...doc.pageUrls);
    } else if (doc.fileUrl) {
      filesToDelete.push(doc.fileUrl);
    }
    
    // Add thumbnail
    if (doc.thumbnailUrl) {
      filesToDelete.push(doc.thumbnailUrl);
    }

    // Delete all files from S3
    console.log(`🗑️  Permanently deleting ${filesToDelete.length} file(s) from S3 for document ${id}`);
    
    for (const filePath of filesToDelete) {
      try {
        const { bucketName, objectName } = parseS3Path(filePath);
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        });
        await s3Client.send(deleteCommand);
        console.log(`  ✓ Deleted from S3: ${objectName}`);
      } catch (error) {
        console.error(`  ✗ Failed to delete ${filePath} from S3:`, error);
        // Continue with other files even if one fails
      }
    }

    // Hard delete: actually remove from database
    const result = await db.delete(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.userId, userId),
        isNotNull(documents.deletedAt)
      )
    );
    
    const success = result.rowCount !== null && result.rowCount > 0;
    if (success) {
      console.log(`✓ Document ${id} permanently deleted from database and S3`);
    }
    
    return success;
  }

  async getUserStorageStats(userId: string): Promise<StorageStats> {
    const { s3Client } = await import("./objectStorage");
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    
    // Helper to parse S3 paths
    const parseS3Path = (path: string) => {
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      const pathParts = path.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");
      return { bucketName, objectName };
    };
    
    // Get all user's documents
    const userDocuments = await this.getDocumentsByUserId(userId);
    
    let totalBytes = 0;
    
    // Calculate total size from all document pages
    for (const doc of userDocuments) {
      const pageUrls = doc.pageUrls && doc.pageUrls.length > 0 
        ? doc.pageUrls 
        : doc.fileUrl 
          ? [doc.fileUrl] 
          : [];
      
      for (const pageUrl of pageUrls) {
        try {
          const { bucketName, objectName } = parseS3Path(pageUrl);
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectName,
          });
          const metadata = await s3Client.send(headCommand);
          totalBytes += metadata.ContentLength || 0;
        } catch (error) {
          console.error(`Failed to get stats for ${pageUrl}:`, error);
          // Continue with other files if one fails
        }
      }
      
      // Also count thumbnails if they exist
      if (doc.thumbnailUrl) {
        try {
          const { bucketName, objectName } = parseS3Path(doc.thumbnailUrl);
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectName,
          });
          const metadata = await s3Client.send(headCommand);
          totalBytes += metadata.ContentLength || 0;
        } catch (error) {
          console.error(`Failed to get stats for thumbnail ${doc.thumbnailUrl}:`, error);
        }
      }
    }
    
    const usedMB = totalBytes / (1024 * 1024);
    const usedGB = totalBytes / (1024 * 1024 * 1024);
    const totalGB = 5; // Free tier: 5 GB
    const percentageUsed = (usedGB / totalGB) * 100;
    
    return {
      usedBytes: totalBytes,
      usedMB: Math.round(usedMB * 100) / 100,
      usedGB: Math.round(usedGB * 100) / 100,
      totalGB,
      percentageUsed: Math.round(percentageUsed * 10) / 10,
      documentCount: userDocuments.length,
    };
  }

  // Phase 2: Tags management
  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getTags(userId: string): Promise<Tag[]> {
    return db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(asc(tags.name));
  }

  async updateTag(id: string, userId: string, data: Partial<InsertTag>): Promise<Tag | undefined> {
    const [updated] = await db
      .update(tags)
      .set(data)
      .where(
        and(
          eq(tags.id, id),
          eq(tags.userId, userId)
        )
      )
      .returning();
    return updated;
  }

  async deleteTag(id: string, userId: string): Promise<boolean> {
    // First remove all document-tag associations
    await db.delete(documentTags).where(eq(documentTags.tagId, id));
    
    // Then delete the tag itself
    const result = await db.delete(tags).where(
      and(
        eq(tags.id, id),
        eq(tags.userId, userId)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async addTagToDocument(documentId: string, tagId: string): Promise<DocumentTag> {
    const [documentTag] = await db
      .insert(documentTags)
      .values({ documentId, tagId })
      .onConflictDoNothing()
      .returning();
    return documentTag;
  }

  async removeTagFromDocument(documentId: string, tagId: string): Promise<boolean> {
    const result = await db.delete(documentTags).where(
      and(
        eq(documentTags.documentId, documentId),
        eq(documentTags.tagId, tagId)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDocumentTags(documentId: string): Promise<Tag[]> {
    const result = await db
      .select({
        id: tags.id,
        userId: tags.userId,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
      })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, documentId))
      .orderBy(asc(tags.name));
    
    return result;
  }

  async getDocumentsByTag(userId: string, tagId: string): Promise<Document[]> {
    const result = await db
      .select({
        id: documents.id,
        userId: documents.userId,
        folderId: documents.folderId,
        title: documents.title,
        category: documents.category,
        extractedText: documents.extractedText,
        fileUrl: documents.fileUrl,
        pageUrls: documents.pageUrls,
        thumbnailUrl: documents.thumbnailUrl,
        mimeType: documents.mimeType,
        confidence: documents.confidence,
        isShared: documents.isShared,
        uploadedAt: documents.uploadedAt,
        deletedAt: documents.deletedAt,
        extractedDate: documents.extractedDate,
        amount: documents.amount,
        sender: documents.sender,
      })
      .from(documentTags)
      .innerJoin(documents, eq(documentTags.documentId, documents.id))
      .where(
        and(
          eq(documentTags.tagId, tagId),
          eq(documents.userId, userId),
          isNull(documents.deletedAt)
        )
      )
      .orderBy(desc(documents.uploadedAt));
    
    return result;
  }

  // Shared Access implementations
  async createSharedAccess(data: InsertSharedAccess): Promise<SharedAccess> {
    const [access] = await db
      .insert(sharedAccess)
      .values(data)
      .returning();
    return access;
  }

  async getSharedAccessByOwner(ownerId: string): Promise<SharedAccess | undefined> {
    const [access] = await db
      .select()
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.ownerId, ownerId),
          eq(sharedAccess.status, 'active')
        )
      );
    return access;
  }

  async getAllSharedAccessByOwner(ownerId: string): Promise<SharedAccess[]> {
    const accesses = await db
      .select()
      .from(sharedAccess)
      .where(eq(sharedAccess.ownerId, ownerId))
      .orderBy(desc(sharedAccess.invitedAt));
    return accesses;
  }

  async getSharedAccessByEmail(email: string): Promise<SharedAccess | undefined> {
    const [access] = await db
      .select()
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.sharedWithEmail, email),
          eq(sharedAccess.status, 'pending')
        )
      );
    return access;
  }

  async getSharedAccessByToken(token: string): Promise<SharedAccess | undefined> {
    const [access] = await db
      .select()
      .from(sharedAccess)
      .where(eq(sharedAccess.invitationToken, token));
    return access;
  }

  async acceptSharedInvitation(email: string, userId: string): Promise<SharedAccess | undefined> {
    const [access] = await db
      .update(sharedAccess)
      .set({
        sharedWithUserId: userId,
        status: 'active',
        acceptedAt: new Date(),
      })
      .where(
        and(
          eq(sharedAccess.sharedWithEmail, email),
          eq(sharedAccess.status, 'pending')
        )
      )
      .returning();
    return access;
  }

  async acceptSharedInvitationByToken(token: string, userId: string): Promise<SharedAccess | undefined> {
    const [access] = await db
      .update(sharedAccess)
      .set({
        sharedWithUserId: userId,
        status: 'active',
        acceptedAt: new Date(),
      })
      .where(
        and(
          eq(sharedAccess.invitationToken, token),
          eq(sharedAccess.status, 'pending')
        )
      )
      .returning();
    return access;
  }

  async revokeSharedAccess(ownerId: string): Promise<boolean> {
    const result = await db
      .update(sharedAccess)
      .set({ status: 'revoked' })
      .where(eq(sharedAccess.ownerId, ownerId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async resendInvitation(invitationId: string, ownerId: string): Promise<SharedAccess | undefined> {
    // Generate new token and expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [access] = await db
      .update(sharedAccess)
      .set({
        invitationToken: newToken,
        tokenExpiresAt,
        invitedAt: new Date(), // Update invitation date
        status: 'pending', // Reset to pending if it was expired
      })
      .where(
        and(
          eq(sharedAccess.id, invitationId),
          eq(sharedAccess.ownerId, ownerId)
        )
      )
      .returning();
    return access;
  }

  async getAccessibleAccounts(userId: string): Promise<{
    ownedAccount: User | undefined;
    sharedAccounts: (SharedAccess & { owner: User })[];
  }> {
    // Get user's own account
    const ownedAccount = await this.getUser(userId);

    // Get accounts shared with this user
    const sharedAccessRecords = await db
      .select()
      .from(sharedAccess)
      .innerJoin(users, eq(sharedAccess.ownerId, users.id))
      .where(
        and(
          eq(sharedAccess.sharedWithUserId, userId),
          eq(sharedAccess.status, 'active')
        )
      );

    const sharedAccounts = sharedAccessRecords.map(record => ({
      ...record.shared_access,
      owner: record.users,
    }));

    return {
      ownedAccount,
      sharedAccounts,
    };
  }

  /**
   * Get partner user IDs for document sharing
   * Returns all active partner IDs (Master returns Slave IDs, Slave returns Master ID)
   */
  async getPartnerUserIds(userId: string): Promise<string[]> {
    const partnerIds: string[] = [];

    // Case 1: User is Master - get Slave IDs
    const asOwner = await db
      .select({ partnerId: sharedAccess.sharedWithUserId })
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.ownerId, userId),
          eq(sharedAccess.status, 'active'),
          isNotNull(sharedAccess.sharedWithUserId)
        )
      );

    asOwner.forEach(record => {
      if (record.partnerId) partnerIds.push(record.partnerId);
    });

    // Case 2: User is Slave - get Master ID
    const asShared = await db
      .select({ partnerId: sharedAccess.ownerId })
      .from(sharedAccess)
      .where(
        and(
          eq(sharedAccess.sharedWithUserId, userId),
          eq(sharedAccess.status, 'active')
        )
      );

    asShared.forEach(record => {
      if (record.partnerId) partnerIds.push(record.partnerId);
    });

    return partnerIds;
  }

  // Folders implementations
  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [newFolder] = await db
      .insert(folders)
      .values(folder)
      .returning();
    return newFolder;
  }

  async getUserFolders(userId: string): Promise<Folder[]> {
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(asc(folders.createdAt));
    return userFolders;
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));
    return folder;
  }

  async updateFolder(id: string, userId: string, data: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set(data)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, userId)
        )
      )
      .returning();
    return folder;
  }

  async deleteFolder(id: string, userId: string): Promise<boolean> {
    // First, move all documents from this folder to no folder (null)
    await db
      .update(documents)
      .set({ folderId: null })
      .where(eq(documents.folderId, id));

    // Then delete the folder
    const result = await db
      .delete(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, userId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createDefaultFolders(userId: string): Promise<void> {
    // Create default folders for new users
    await db.insert(folders).values([
      {
        userId,
        name: "Alle Dokumente",
        isShared: true,
      },
      {
        userId,
        name: "Privat",
        isShared: false,
      }
    ]);
  }

  // Trial notifications implementations
  async createTrialNotification(data: InsertTrialNotification): Promise<TrialNotification> {
    const [notification] = await db
      .insert(trialNotifications)
      .values(data)
      .returning();
    return notification;
  }

  async getTrialNotification(userId: string, notificationType: string): Promise<TrialNotification | undefined> {
    const [notification] = await db
      .select()
      .from(trialNotifications)
      .where(
        and(
          eq(trialNotifications.userId, userId),
          eq(trialNotifications.notificationType, notificationType)
        )
      );
    return notification;
  }

  async getUsersNeedingTrialNotifications(): Promise<User[]> {
    const now = new Date();
    const allTrialUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.subscriptionPlan, 'trial'),
          isNotNull(users.trialEndsAt)
        )
      );

    return allTrialUsers;
  }

  // Email whitelist implementations
  async getEmailWhitelist(userId: string): Promise<EmailWhitelist[]> {
    const entries = await db
      .select()
      .from(emailWhitelist)
      .where(eq(emailWhitelist.userId, userId))
      .orderBy(asc(emailWhitelist.createdAt));
    return entries;
  }

  async getEmailWhitelistEntry(userId: string, email: string): Promise<EmailWhitelist | undefined> {
    const [entry] = await db
      .select()
      .from(emailWhitelist)
      .where(
        and(
          eq(emailWhitelist.userId, userId),
          eq(emailWhitelist.allowedEmail, email)
        )
      );
    return entry;
  }

  async addEmailToWhitelist(userId: string, email: string): Promise<EmailWhitelist> {
    const [entry] = await db
      .insert(emailWhitelist)
      .values({
        userId,
        allowedEmail: email,
      })
      .returning();
    return entry;
  }

  async removeEmailFromWhitelist(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(emailWhitelist)
      .where(
        and(
          eq(emailWhitelist.id, id),
          eq(emailWhitelist.userId, userId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isEmailWhitelisted(userId: string, email: string): Promise<boolean> {
    const entry = await this.getEmailWhitelistEntry(userId, email);
    return !!entry;
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers;
  }

  /**
   * Increment upload counter for user (after successful upload)
   */
  async incrementUploadCounter(userId: string, incrementBy: number = 1): Promise<User | undefined> {
    // First check if we need to reset the counter (new month)
    await this.checkAndResetUploadCounter(userId);

    const [updated] = await db
      .update(users)
      .set({
        uploadedThisMonth: sql`${users.uploadedThisMonth} + ${incrementBy}`,
      })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  /**
   * Reset upload counter to 0 and update reset timestamp
   */
  async resetUploadCounter(userId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        uploadedThisMonth: 0,
        uploadCounterResetAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  /**
   * Check if upload counter needs to be reset (new month) and reset if needed
   * Returns the user with potentially reset counter
   */
  async checkAndResetUploadCounter(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const now = new Date();
    const lastReset = user.uploadCounterResetAt || user.createdAt || now;

    // Check if we're in a new month
    const needsReset =
      now.getFullYear() > lastReset.getFullYear() ||
      (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());

    if (needsReset) {
      console.log(`[UploadCounter] Resetting counter for user ${userId} (last reset: ${lastReset})`);
      return await this.resetUploadCounter(userId);
    }

    return user;
  }

  async deleteUserCompletely(userId: string): Promise<boolean> {
    try {
      // Delete all user's data in order (foreign key dependencies)
      
      // 1. Delete documents
      await db.delete(documents).where(eq(documents.userId, userId));
      
      // 2. Delete email whitelist
      await db.delete(emailWhitelist).where(eq(emailWhitelist.userId, userId));
      
      // 3. Delete folders
      await db.delete(folders).where(eq(folders.userId, userId));
      
      // 4. Delete tags
      await db.delete(tags).where(eq(tags.userId, userId));
      
      // 5. Delete trial notifications
      await db.delete(trialNotifications).where(eq(trialNotifications.userId, userId));
      
      // 6. Delete shared access (both as owner and as shared user)
      await db.delete(sharedAccess).where(
        or(
          eq(sharedAccess.ownerId, userId),
          eq(sharedAccess.sharedWithUserId, userId)
        )
      );
      
      // 7. Finally delete the user
      const result = await db.delete(users).where(eq(users.id, userId));
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('[DeleteUserCompletely] Error:', error);
      return false;
    }
  }
}

export const storage = new DbStorage();
