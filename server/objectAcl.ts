// ACL (Access Control List) implementation for S3 object storage
// Migrated from Google Cloud Storage to IONOS S3

import { s3Client, S3Object } from "./objectStorage";
import { HeadObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const ACL_POLICY_METADATA_KEY = "x-amz-meta-aclpolicy";

export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  throw new Error(`Unknown access group type: ${group.type}`);
}

export async function setObjectAclPolicy(
  s3Object: S3Object,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  // Check if object exists
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: s3Object.bucket,
      Key: s3Object.key,
    });
    await s3Client.send(headCommand);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      throw new Error(`Object not found: ${s3Object.key}`);
    }
    throw error;
  }

  // Get current object data to preserve it during metadata update
  const getCommand = new GetObjectCommand({
    Bucket: s3Object.bucket,
    Key: s3Object.key,
  });
  const currentObject = await s3Client.send(getCommand);

  // Update metadata using PutObject with existing body
  const putCommand = new PutObjectCommand({
    Bucket: s3Object.bucket,
    Key: s3Object.key,
    Body: currentObject.Body,
    ContentType: currentObject.ContentType,
    Metadata: {
      aclpolicy: JSON.stringify(aclPolicy),
    },
  });

  await s3Client.send(putCommand);
}

export async function getObjectAclPolicy(
  s3Object: S3Object,
): Promise<ObjectAclPolicy | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: s3Object.bucket,
      Key: s3Object.key,
    });
    
    const response = await s3Client.send(command);
    const aclPolicy = response.Metadata?.aclpolicy;
    
    if (!aclPolicy) {
      return null;
    }
    
    return JSON.parse(aclPolicy);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: S3Object;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
