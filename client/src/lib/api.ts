import type { Document, DocumentWithFolder, PaginatedDocuments as PaginatedDocsType, User, Tag } from "@shared/schema";
import { apiRequest } from "./queryClient";

export interface StorageStats {
  usedBytes: number;
  usedMB: number;
  usedGB: number;
  totalGB: number;
  percentageUsed: number;
  documentCount: number;
}

export interface DuplicateInfo {
  id: string;
  title: string;
  uploadedAt: Date;
  category: string;
}

export interface UploadResult {
  message: string;
  documents: Document[];
  errors?: Array<{ filename: string; error: string }>;
  duplicates?: Array<{ filename: string; duplicate: DuplicateInfo }>;
  isDuplicate?: boolean;
  duplicate?: DuplicateInfo;
}

/**
 * Upload one or more document files and process them with AI
 * Each file is processed as a separate document with individual AI analysis
 * @param files - Single file or array of files to upload
 * @param mergeIntoOne - If true, merge multiple files into a single document (default: false)
 * @param forceDuplicates - If true, upload files even if duplicates are detected (default: false)
 */
export async function uploadDocument(
  files: File | File[], 
  mergeIntoOne: boolean = false,
  forceDuplicates: boolean = false
): Promise<UploadResult> {
  const formData = new FormData();
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    formData.append("files", file);
  });
  
  // Add merge flag if provided
  if (mergeIntoOne && fileArray.length > 1) {
    formData.append("mergeIntoOne", "true");
  }
  
  // Add force duplicates flag if provided
  if (forceDuplicates) {
    formData.append("forceDuplicates", "true");
  }

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    
    // If it's a duplicate error (409), return the data instead of throwing
    if (response.status === 409 && errorData) {
      return errorData;
    }
    
    const message = errorData?.message || response.statusText;
    throw new Error(message);
  }

  return await response.json();
}

export type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "category-asc";

// Use the PaginatedDocuments type from shared/schema (includes folderName and folderIcon)
export type PaginatedDocuments = PaginatedDocsType;

/**
 * Get paginated documents for the current user with optional search, category filters, and sorting
 */
export async function getDocuments(
  searchQuery?: string,
  categories?: string[],
  sortBy?: SortOption,
  limit?: number,
  cursor?: string
): Promise<PaginatedDocuments> {
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

  if (limit) {
    params.append("limit", limit.toString());
  }

  if (cursor) {
    params.append("cursor", cursor);
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

  const data = await response.json();
  console.log('🔍 Full API Response:', data);
  console.log('🔍 First document keys:', data.documents[0] ? Object.keys(data.documents[0]) : 'no documents');
  console.log('🔍 First document folderName:', data.documents[0]?.folderName);
  console.log('🔍 First document folderIcon:', data.documents[0]?.folderIcon);
  return data;
}

/**
 * Update document category
 */
export async function updateDocumentCategory(id: string, category: string): Promise<Document> {
  const response = await apiRequest("PATCH", `/api/documents/${id}`, { category });
  return await response.json();
}

/**
 * Toggle document sharing (share with partner or keep private)
 */
export async function updateDocumentSharing(id: string, isShared: boolean): Promise<Document> {
  const response = await apiRequest("PATCH", `/api/documents/${id}/sharing`, { isShared });
  return await response.json();
}

/**
 * Update document metadata (title, documentDate, amount, sender)
 */
export async function updateDocument(
  id: string, 
  data: {
    title?: string;
    documentDate?: string | null;
    amount?: number | null;
    sender?: string | null;
  }
): Promise<Document> {
  const response = await apiRequest("PATCH", `/api/documents/${id}`, data);
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
 * Permanently delete all documents from trash (bulk delete)
 */
export async function permanentlyDeleteAllDocuments(): Promise<{ count: number; message: string }> {
  const response = await apiRequest("DELETE", "/api/trash/all");
  return await response.json();
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

// Phase 2: Tags API

/**
 * Get all tags for the current user
 */
export async function getTags(): Promise<Tag[]> {
  const response = await fetch("/api/tags", {
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

/**
 * Create a new tag
 */
export async function createTag(data: { name: string; color?: string }): Promise<Tag> {
  const response = await apiRequest("POST", "/api/tags", data);
  return await response.json();
}

/**
 * Update a tag
 */
export async function updateTag(id: string, data: { name?: string; color?: string }): Promise<Tag> {
  const response = await apiRequest("PATCH", `/api/tags/${id}`, data);
  return await response.json();
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/tags/${id}`);
}

/**
 * Get tags for a specific document
 */
export async function getDocumentTags(documentId: string): Promise<Tag[]> {
  const response = await fetch(`/api/documents/${documentId}/tags`, {
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

/**
 * Add a tag to a document
 */
export async function addTagToDocument(documentId: string, tagId: string): Promise<void> {
  await apiRequest("POST", `/api/documents/${documentId}/tags/${tagId}`);
}

/**
 * Remove a tag from a document
 */
export async function removeTagFromDocument(documentId: string, tagId: string): Promise<void> {
  await apiRequest("DELETE", `/api/documents/${documentId}/tags/${tagId}`);
}

// Phase 2: Export functionality

/**
 * Export all documents as a ZIP file
 */
export function exportDocumentsAsZip(): void {
  // Use a temporary link element to trigger download with proper credentials
  const link = document.createElement('a');
  link.href = "/api/documents/export/zip";
  link.download = `meinedokbox_export_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Subscription management

export interface SubscriptionStatus {
  plan: "free" | "trial" | "solo" | "family" | "family-plus";
  displayName: string;
  // NEW: Hybrid limit system
  maxUploadsPerMonth: number;
  uploadsThisMonth: number;
  maxStorageGB: number;
  storageUsedGB: number;
  // User count (for family plans)
  currentUsers?: number;
  maxUsers?: number;
  // Legacy fields (backward compatibility)
  maxDocuments: number;
  currentDocuments: number;
  // Features
  canUseEmailInbound: boolean;
  canUpload: boolean;
  isUploadDisabled: boolean;
  // Trial status
  trialEndsAt?: Date;
  daysRemaining?: number | null;
  gracePeriod?: boolean;
  isReadOnly?: boolean;
  graceDaysRemaining?: number;
  subscriptionEndsAt?: Date;
  // Stripe subscription status
  hasActiveSubscription?: boolean;
}

/**
 * Get subscription status for current user
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const response = await fetch("/api/subscription/status", {
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return await response.json();
}

// Email/Password Authentication

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  acceptPrivacy: boolean;
  // Marketing attribution (optional)
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user with email and password
 */
export async function register(data: RegisterData): Promise<{ user: User; message: string }> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return await res.json();
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<{ message: string }> {
  const res = await apiRequest("POST", "/api/auth/login", data);
  return await res.json();
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ message: string }> {
  const res = await apiRequest("POST", "/api/auth/logout");
  return await res.json();
}

