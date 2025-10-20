// Object storage utilities for file management
// Reference: javascript_object_storage blueprint

import { ObjectStorageService } from "../objectStorage";
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
  
  // Generate thumbnail for images
  let thumbnailPath: string | null = null;
  try {
    if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
      const thumbnail = await sharp(file)
        .resize(400, 300, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      const thumbnailUploadURL = await objectStorageService.getObjectEntityUploadURL();
      await fetch(thumbnailUploadURL, {
        method: "PUT",
        body: thumbnail,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
      
      thumbnailPath = objectStorageService.normalizeObjectEntityPath(thumbnailUploadURL);
    }
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
  }
  
  return { filePath, thumbnailPath };
}
