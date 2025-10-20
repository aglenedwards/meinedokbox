// Object storage utilities for file management
// Reference: javascript_object_storage blueprint

import { ObjectStorageService } from "../objectStorage";
import sharp from "sharp";

export async function uploadFile(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<{ filePath: string; thumbnailPath: string | null }> {
  const objectStorageService = new ObjectStorageService();
  
  // Get upload URL for the main file
  const uploadURL = await objectStorageService.getObjectEntityUploadURL();
  
  // Upload file to object storage using presigned URL
  await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
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
