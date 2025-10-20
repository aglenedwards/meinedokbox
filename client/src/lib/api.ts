import type { Document, User } from "@shared/schema";
import { apiRequest } from "./queryClient";

export interface StorageStats {
  usedBytes: number;
  usedMB: number;
  usedGB: number;
  totalGB: number;
  percentageUsed: number;
  documentCount: number;
}

/**
 * Upload one or more document files and process them with AI
 * If multiple files are provided, they will be combined into a single multi-page PDF
 */
export async function uploadDocument(files: File | File[]): Promise<Document> {
  const formData = new FormData();
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "category-asc";

/**
 * Get all documents for the current user with optional search, category filters, and sorting
 */
export async function getDocuments(
  searchQuery?: string,
  categories?: string[],
  sortBy?: SortOption
): Promise<Document[]> {
  const params = new URLSearchParams();
  
  if (searchQuery) {
    params.append("search", searchQuery);
  }
  
  if (categories && categories.length > 0 && !categories.includes("Alle")) {
    // Backend expects comma-separated categories
    params.append("categories", categories.join(","));
  }

  if (sortBy) {
    params.append("sort", sortBy);
  }

  const queryString = params.toString();
  const url = `/api/documents${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

/**
 * Update document category
 */
export async function updateDocumentCategory(id: string, category: string): Promise<Document> {
  const response = await apiRequest("PATCH", `/api/documents/${id}`, { category });
  return await response.json();
}

/**
 * Delete a document by ID (soft delete - moves to trash)
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/documents/${id}`);
}

/**
 * Bulk delete multiple documents (soft delete - moves to trash)
 */
export async function bulkDeleteDocuments(ids: string[]): Promise<{ count: number }> {
  const response = await apiRequest("POST", "/api/documents/bulk-delete", { ids });
  return await response.json();
}

/**
 * Get trashed documents
 */
export async function getTrashedDocuments(): Promise<Document[]> {
  const response = await fetch("/api/trash", {
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

/**
 * Restore a document from trash
 */
export async function restoreDocument(id: string): Promise<Document> {
  const response = await apiRequest("POST", `/api/documents/${id}/restore`);
  return await response.json();
}

/**
 * Permanently delete a document from trash
 */
export async function permanentlyDeleteDocument(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/trash/${id}`);
}

/**
 * Get storage statistics for the current user
 */
export async function getStorageStats(): Promise<StorageStats> {
  const response = await fetch("/api/storage/stats", {
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated (401)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      const text = (await response.text()) || response.statusText;
      throw new Error(`${response.status}: ${text}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes("401")) {
      return null;
    }
    throw error;
  }
}
