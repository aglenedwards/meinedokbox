import { type User, type UpsertUser, type Document, type InsertDocument } from "@shared/schema";
import { db } from "./db";
import { users, documents } from "@shared/schema";
import { eq, and, or, like, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUserId(userId: string): Promise<Document[]>;
  searchDocuments(userId: string, query?: string, category?: string): Promise<Document[]>;
  deleteDocument(id: string, userId: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
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

  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.uploadedAt));
  }

  async searchDocuments(userId: string, query?: string, category?: string): Promise<Document[]> {
    let whereClause = eq(documents.userId, userId);

    if (category) {
      whereClause = and(whereClause, eq(documents.category, category)) as any;
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

    return db.select().from(documents).where(whereClause).orderBy(desc(documents.uploadedAt));
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.userId, userId)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DbStorage();
