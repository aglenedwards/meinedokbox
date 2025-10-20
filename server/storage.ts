import { type User, type UpsertUser, type Document, type InsertDocument } from "@shared/schema";
import { db } from "./db";
import { users, documents } from "@shared/schema";
import { eq, and, or, like, desc, asc, isNull, isNotNull, inArray, sql } from "drizzle-orm";

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
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUserId(userId: string, sortBy?: SortOption): Promise<Document[]>;
  searchDocuments(userId: string, query?: string, categories?: string[], sortBy?: SortOption): Promise<Document[]>;
  updateDocumentCategory(id: string, userId: string, category: string): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<boolean>;
  bulkDeleteDocuments(ids: string[], userId: string): Promise<number>;
  getTrashedDocuments(userId: string): Promise<Document[]>;
  restoreDocument(id: string, userId: string): Promise<Document | undefined>;
  permanentlyDeleteDocument(id: string, userId: string): Promise<boolean>;
  getUserStorageStats(userId: string): Promise<StorageStats>;
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
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
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

  async getDocumentsByUserId(userId: string, sortBy?: SortOption): Promise<Document[]> {
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

  async searchDocuments(userId: string, query?: string, categories?: string[], sortBy?: SortOption): Promise<Document[]> {
    let whereClause = and(
      eq(documents.userId, userId),
      isNull(documents.deletedAt)
    ) as any;

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
}

export const storage = new DbStorage();
