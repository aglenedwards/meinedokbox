// Object storage utilities for file management
// Reference: javascript_object_storage blueprint

import { ObjectStorageService, objectStorageClient } from "../objectStorage";
import { setObjectAclPolicy, ObjectPermission } from "../objectAcl";
import sharp from "sharp";

// Determine content type based on file extension
function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const contentTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<{ filePath: string; thumbnailPath: string | null }> {
  const objectStorageService = new ObjectStorageService();
  
  // Get upload URL for the main file
  const uploadURL = await objectStorageService.getObjectEntityUploadURL();
  
  // Determine correct content type
  const contentType = getContentType(fileName);
  console.log('Uploading file:', fileName, 'Content-Type:', contentType);
  
  // Upload file to object storage using presigned URL
  await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });
  
  // Normalize the path
  const filePath = objectStorageService.normalizeObjectEntityPath(uploadURL);
  
  // Set ACL policy so the owner can access the file
  try {
    const fileObject = await objectStorageService.getObjectEntityFile(filePath);
    await setObjectAclPolicy(fileObject, {
      owner: userId,
      visibility: "private"
    });
    console.log('ACL policy set for:', filePath, 'owner:', userId);
  } catch (error) {
    console.error('Failed to set ACL policy:', error);
    // Continue anyway - the file is uploaded
  }
  
  // No longer generating thumbnails - cards now use category icons
  return { filePath, thumbnailPath: null };
}
