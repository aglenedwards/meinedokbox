// IONOS S3 Object Storage Service
// Migrated from Google Cloud Storage to IONOS S3 (Frankfurt, Germany) for GDPR compliance

import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// IONOS S3 Configuration
const S3_ENDPOINT = process.env.IONOS_S3_ENDPOINT || "https://s3.eu-central-4.ionoscloud.com";
const S3_BUCKET_NAME = process.env.IONOS_S3_BUCKET || "meinedokbox-production";
const S3_REGION = process.env.IONOS_S3_REGION || "eu-central-4";
const S3_ACCESS_KEY = process.env.IONOS_S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.IONOS_S3_SECRET_KEY;

if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
  throw new Error("IONOS S3 credentials not configured. Please set IONOS_S3_ACCESS_KEY and IONOS_S3_SECRET_KEY environment variables.");
}

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for IONOS S3
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// S3 Object wrapper to mimic Google Cloud Storage File interface
export interface S3Object {
  bucket: string;
  key: string;
  name: string;
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    // For S3, we use a simple "public/" prefix in the bucket
    return [`${S3_BUCKET_NAME}/public`];
  }

  getPrivateObjectDir(): string {
    // For S3, we use ".private/" prefix in the bucket
    return `${S3_BUCKET_NAME}/.private`;
  }

  async searchPublicObject(filePath: string): Promise<S3Object | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      
      try {
        // Check if object exists using HEAD request
        await s3Client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        }));
        
        return {
          bucket: bucketName,
          key: objectName,
          name: objectName,
        };
      } catch (error: any) {
        // Object doesn't exist, continue searching
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          continue;
        }
        throw error;
      }
    }
    return null;
  }

  async getObjectBuffer(s3Object: S3Object): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: s3Object.bucket,
        Key: s3Object.key,
      });
      
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error("No body in S3 response");
      }

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      console.error("Error downloading file buffer:", error);
      throw new Error("Failed to download file buffer");
    }
  }

  async downloadObject(s3Object: S3Object, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get object metadata
      const headCommand = new HeadObjectCommand({
        Bucket: s3Object.bucket,
        Key: s3Object.key,
      });
      const metadata = await s3Client.send(headCommand);
      
      const aclPolicy = await getObjectAclPolicy(s3Object);
      const isPublic = aclPolicy?.visibility === "public";
      
      console.log('Downloading object:', s3Object.key, 'Content-Type:', metadata.ContentType, 'Size:', metadata.ContentLength);
      
      res.set({
        "Content-Type": metadata.ContentType || "application/octet-stream",
        "Content-Length": metadata.ContentLength?.toString() || "0",
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
        "Accept-Ranges": "bytes",
      });

      // Stream the object
      const getCommand = new GetObjectCommand({
        Bucket: s3Object.bucket,
        Key: s3Object.key,
      });
      const response = await s3Client.send(getCommand);
      
      if (!response.Body) {
        throw new Error("No body in S3 response");
      }

      const stream = response.Body as Readable;
      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.on("end", () => {
        console.log("Stream completed for:", s3Object.key);
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<S3Object> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    
    // Check if object exists
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      }));
      
      return {
        bucket: bucketName,
        key: objectName,
        name: objectName,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new ObjectNotFoundError();
      }
      throw error;
    }
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // Update for S3 URLs instead of Google Cloud Storage
    if (!rawPath.startsWith(`${S3_ENDPOINT}/${S3_BUCKET_NAME}/`)) {
      return rawPath;
    }
  
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname.replace(`/${S3_BUCKET_NAME}`, '');
  
    let objectEntityDir = this.getPrivateObjectDir().replace(`${S3_BUCKET_NAME}`, '');
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
  
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: S3Object;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  // Helper: Upload buffer to S3
  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${S3_ENDPOINT}/${S3_BUCKET_NAME}/${key}`;
  }

  // Helper: Delete object from S3
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  // Helper: Generate presigned URL for object download
  async generatePresignedDownloadUrl(objectPath: string, expiresInSeconds: number): Promise<string> {
    const { bucketName, objectName } = parseObjectPath(objectPath);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}

export function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  
  // Remove leading /objects/ prefix if present (logical path prefix)
  // Example: /objects/uploads/xyz → uploads/xyz
  // Example: /objects/.private/uploads/xyz → .private/uploads/xyz
  let objectName = path.startsWith("/objects/") 
    ? path.substring("/objects/".length) 
    : path.substring(1);
  
  // Always use the configured S3 bucket
  const bucketName = S3_BUCKET_NAME;

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  // Generate presigned URL using AWS SDK
  let command;
  
  switch (method) {
    case "GET":
      command = new GetObjectCommand({ Bucket: bucketName, Key: objectName });
      break;
    case "PUT":
      command = new PutObjectCommand({ Bucket: bucketName, Key: objectName });
      break;
    case "DELETE":
      command = new DeleteObjectCommand({ Bucket: bucketName, Key: objectName });
      break;
    case "HEAD":
      command = new HeadObjectCommand({ Bucket: bucketName, Key: objectName });
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: ttlSec,
  });

  return signedUrl;
}
