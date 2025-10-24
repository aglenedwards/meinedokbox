// IONOS S3 storage utilities for file management
// Migrated from Google Cloud Storage to IONOS S3

import { ObjectStorageService } from "../objectStorage";
import { setObjectAclPolicy, ObjectPermission } from "../objectAcl";
import sharp from "sharp";
import { randomUUID } from "crypto";

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
  
  // Generate unique object key
  const objectId = randomUUID();
  const key = `.private/uploads/${objectId}`;
  
  // Determine correct content type
  const contentType = getContentType(fileName);
  console.log('Uploading file to S3:', fileName, 'Key:', key, 'Content-Type:', contentType);
  
  // Upload file directly to S3
  await objectStorageService.uploadBuffer(file, key, contentType);
  
  // Construct normalized path
  const filePath = `/objects/uploads/${objectId}`;
  
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
