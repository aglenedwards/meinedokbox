import { type User, type UpsertUser, type Document, type InsertDocument, type Tag, type InsertTag, type DocumentTag, type InsertDocumentTag, type SharedAccess, type InsertSharedAccess, type Folder, type InsertFolder } from "@shared/schema";
import { db } from "./db";
import { users, documents, tags, documentTags, sharedAccess, folders } from "@shared/schema";
import { eq, and, or, like, desc, asc, isNull, isNotNull, inArray, sql } from "drizzle-orm";
import { generateInboundEmail } from "./lib/emailInbound";

export interface StorageStats {
  usedBytes: number;
  usedMB: number;
  usedGB: number;
  totalGB: number;
  percentageUsed: number;
  documentCount: number;
}

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "category-asc";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(id: string, data: Partial<Pick<User, 'subscriptionPlan' | 'trialEndsAt' | 'subscriptionEndsAt'>>): Promise<User | undefined>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUserId(userId: string, sortBy?: SortOption, includeOnlySharedFolders?: boolean): Promise<Document[]>;
  searchDocuments(userId: string, query?: string, categories?: string[], sortBy?: SortOption, includeOnlySharedFolders?: boolean): Promise<Document[]>;
  updateDocumentCategory(id: string, userId: string, category: string): Promise<Document | undefined>;
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
  getSharedAccessByEmail(email: string): Promise<SharedAccess | undefined>;
  acceptSharedInvitation(email: string, userId: string): Promise<SharedAccess | undefined>;
  revokeSharedAccess(ownerId: string): Promise<boolean>;
  getAccessibleAccounts(userId: string): Promise<{ ownedAccount: User | undefined; sharedAccounts: (SharedAccess & { owner: User })[] }>;
  
  // Folders management
  createFolder(folder: InsertFolder): Promise<Folder>;
  getUserFolders(userId: string): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  updateFolder(id: string, userId: string, data: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string, userId: string): Promise<boolean>;
  createDefaultFolders(userId: string): Promise<void>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUser(userData.id!);
    
    // For new users: Set up 14-day trial
    const isNewUser = !existingUser;
    const trialDurationMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    
    // Generate inbound email only for new users
    const dataToInsert = {
      ...userData,
      inboundEmail: existingUser?.inboundEmail || generateInboundEmail(userData.id!),
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
    // If we need to filter by shared folders only
    if (includeOnlySharedFolders) {
      return db
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
          uploadedAt: documents.uploadedAt,
          deletedAt: documents.deletedAt,
          extractedDate: documents.extractedDate,
          amount: documents.amount,
          sender: documents.sender,
        })
        .from(documents)
        .leftJoin(folders, eq(documents.folderId, folders.id))
        .where(
          and(
            eq(documents.userId, userId),
            isNull(documents.deletedAt),
            or(
              isNull(documents.folderId), // Documents with no folder are visible
              eq(folders.isShared, true) // Or documents in shared folders
            )
          )
        )
        .orderBy(this.getSortOrder(sortBy));
    }

    // Normal query without folder filtering
    return db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          isNull(documents.deletedAt)
        )
      )
      .orderBy(this.getSortOrder(sortBy));
  }

  async searchDocuments(userId: string, query?: string, categories?: string[], sortBy?: SortOption, includeOnlySharedFolders?: boolean): Promise<Document[]> {
    // Build base where clause
    let whereClause = and(
      eq(documents.userId, userId),
      isNull(documents.deletedAt)
    ) as any;

    // Add folder filtering for shared users
    if (includeOnlySharedFolders) {
      whereClause = and(
        whereClause,
        or(
          isNull(documents.folderId), // Documents with no folder
          sql`EXISTS (SELECT 1 FROM ${folders} WHERE ${folders.id} = ${documents.folderId} AND ${folders.isShared} = true)` // Documents in shared folders
        )
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

    return db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(this.getSortOrder(sortBy));
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
    // Hard delete: actually remove from database
    const result = await db.delete(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.userId, userId),
        isNotNull(documents.deletedAt)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUserStorageStats(userId: string): Promise<StorageStats> {
    const { ObjectStorageService } = await import("./objectStorage");
    const objectStorage = new ObjectStorageService();
    
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
          const objectFile = await objectStorage.getObjectEntityFile(pageUrl);
          const [metadata] = await objectFile.getMetadata();
          totalBytes += parseInt(metadata.size as string) || 0;
        } catch (error) {
          console.error(`Failed to get stats for ${pageUrl}:`, error);
          // Continue with other files if one fails
        }
      }
      
      // Also count thumbnails if they exist
      if (doc.thumbnailUrl) {
        try {
          const objectFile = await objectStorage.getObjectEntityFile(doc.thumbnailUrl);
          const [metadata] = await objectFile.getMetadata();
          totalBytes += parseInt(metadata.size as string) || 0;
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

  async revokeSharedAccess(ownerId: string): Promise<boolean> {
    const result = await db
      .update(sharedAccess)
      .set({ status: 'revoked' })
      .where(eq(sharedAccess.ownerId, ownerId));
    return result.rowCount ? result.rowCount > 0 : false;
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
        icon: "📂",
      },
      {
        userId,
        name: "Privat",
        isShared: false,
        icon: "🔒",
      }
    ]);
  }
}

export const storage = new DbStorage();
