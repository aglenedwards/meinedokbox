import type { Document, User } from "@shared/schema";
import { apiRequest } from "./queryClient";

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

/**
 * Get all documents for the current user with optional search and category filters
 */
export async function getDocuments(
  searchQuery?: string,
  categories?: string[]
): Promise<Document[]> {
  const params = new URLSearchParams();
  
  if (searchQuery) {
    params.append("search", searchQuery);
  }
  
  if (categories && categories.length > 0 && !categories.includes("Alle")) {
    // Backend expects single category for now, use first selected
    params.append("category", categories[0]);
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
 * Delete a document by ID
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/documents/${id}`);
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
