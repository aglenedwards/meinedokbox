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

// Check if file is a compressible image format
function isCompressibleImage(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
}

// Compress image to WebP format with quality and size limits
async function compressImage(
  buffer: Buffer,
  fileName: string,
  maxDimension: number = 2000,
  quality: number = 85
): Promise<{ buffer: Buffer; contentType: string }> {
  const originalSize = buffer.length;
  
  // Get image metadata to check dimensions
  const metadata = await sharp(buffer).metadata();
  const needsResize = (metadata.width && metadata.width > maxDimension) || 
                      (metadata.height && metadata.height > maxDimension);
  
  let sharpInstance = sharp(buffer);
  
  // Resize if larger than max dimension
  if (needsResize) {
    sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Convert to WebP with quality setting
  const compressedBuffer = await sharpInstance
    .webp({ quality })
    .toBuffer();
  
  const compressionRatio = ((1 - compressedBuffer.length / originalSize) * 100).toFixed(1);
  console.log(`  Image compression: ${originalSize} → ${compressedBuffer.length} bytes (${compressionRatio}% reduction)`);
  
  return {
    buffer: compressedBuffer,
    contentType: 'image/webp'
  };
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  userId: string
): Promise<{ filePath: string; thumbnailPath: string | null }> {
  const objectStorageService = new ObjectStorageService();
  
  // Generate unique object key
  const objectId = randomUUID();
  
  let uploadBuffer = file;
  let contentType = getContentType(fileName);
  let finalKey = `.private/uploads/${objectId}`;
  
  // Compress images to WebP format for storage efficiency
  if (isCompressibleImage(fileName)) {
    try {
      console.log(`Compressing image: ${fileName}`);
      const compressed = await compressImage(file, fileName);
      uploadBuffer = compressed.buffer;
      contentType = compressed.contentType;
      // Keep the same key - WebP is the storage format
    } catch (error) {
      console.error('Image compression failed, uploading original:', error);
      // Fall back to original file if compression fails
    }
  }
  
  console.log('Uploading file to S3:', fileName, 'Key:', finalKey, 'Content-Type:', contentType);
  
  // Upload file directly to S3
  await objectStorageService.uploadBuffer(uploadBuffer, finalKey, contentType);
  
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
