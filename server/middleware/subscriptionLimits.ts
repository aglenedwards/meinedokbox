import type { RequestHandler } from "express";
import { storage } from "../storage";
import { PLAN_LIMITS } from "../../shared/schema";

/**
 * Middleware to check upload limits for subscription plan
 * Checks BOTH monthly upload counter AND total storage
 * Master + Slaves share both limits
 */
export const checkDocumentLimit: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get effective user (Master if this user is a Slave)
    const effectiveUser = await getEffectiveUser(userId);

    if (!effectiveUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check trial status with grace period (using Master's trial dates if Slave)
    if (effectiveUser.subscriptionPlan === "trial" && effectiveUser.trialEndsAt) {
      const trialStatus = getTrialStatus(effectiveUser.trialEndsAt);
      
      // Block uploads during grace period (days 15-17)
      if (trialStatus.status === "grace_period") {
        return res.status(403).json({
          message: "Testphase abgelaufen - Upload deaktiviert",
          reason: "grace_period",
          graceDaysRemaining: trialStatus.graceDaysRemaining,
        });
      }
      
      // Block uploads in read-only mode (day 18+)
      if (trialStatus.status === "expired") {
        return res.status(403).json({
          message: "Nur-Lese-Modus - Bitte upgraden Sie Ihren Plan",
          reason: "read_only",
        });
      }
    }

    const plan = effectiveUser.subscriptionPlan as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan];

    // Check if plan allows uploads (free plan = read-only)
    if (!limits.canUpload) {
      return res.status(403).json({
        message: "Upload nicht verfügbar - Bitte upgraden Sie Ihren Plan",
        reason: "upload_not_allowed",
        plan: limits.displayName,
      });
    }

    // === NEW HYBRID LIMIT SYSTEM ===
    // Master + all Slaves share BOTH limits:
    // 1. Monthly upload counter
    // 2. Total storage space

    // Get all partner IDs (Master gets Slaves, Slave gets Master)
    const partnerIds = await storage.getPartnerUserIds(effectiveUser.id);
    const allUserIds = [effectiveUser.id, ...partnerIds];

    // Check 1: Monthly Upload Counter
    // Auto-reset counters if new month for all users
    await Promise.all(allUserIds.map(id => storage.checkAndResetUploadCounter(id)));

    // Sum up uploads this month across Master + Slaves
    let totalUploadsThisMonth = 0;
    for (const id of allUserIds) {
      const user = await storage.getUser(id);
      if (user) {
        totalUploadsThisMonth += user.uploadedThisMonth || 0;
      }
    }

    if (totalUploadsThisMonth >= limits.maxUploadsPerMonth) {
      return res.status(403).json({
        message: "Monatliches Upload-Limit erreicht",
        reason: "monthly_upload_limit",
        limit: limits.maxUploadsPerMonth,
        current: totalUploadsThisMonth,
        plan: limits.displayName,
      });
    }

    // Check 2: Total Storage Space
    // Sum up storage across Master + Slaves
    let totalStorageBytes = 0;
    for (const id of allUserIds) {
      const stats = await storage.getUserStorageStats(id);
      totalStorageBytes += stats.usedBytes;
    }

    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const maxStorageGB = limits.maxStorageGB;

    if (totalStorageGB >= maxStorageGB) {
      return res.status(403).json({
        message: "Speicher-Limit erreicht",
        reason: "storage_limit",
        limit: maxStorageGB,
        current: parseFloat(totalStorageGB.toFixed(2)),
        plan: limits.displayName,
      });
    }

    next();
  } catch (error) {
    console.error("Error checking document limit:", error);
    res.status(500).json({ message: "Failed to check document limit" });
  }
};

/**
 * Middleware to check if user can use email inbound feature
 */
export const checkEmailFeature: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get effective user (Master if this user is a Slave)
    const effectiveUser = await getEffectiveUser(userId);

    if (!effectiveUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get effective plan (handles trial expiry check)
    let plan = effectiveUser.subscriptionPlan;
    const now = new Date();
    if (plan === "trial" && effectiveUser.trialEndsAt && now > effectiveUser.trialEndsAt) {
      plan = "free";
    }

    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    if (!limits.canUseEmailInbound) {
      return res.status(403).json({
        message: "E-Mail-Feature nicht verfügbar in Ihrem Plan",
        plan: limits.displayName,
      });
    }

    next();
  } catch (error) {
    console.error("Error checking email feature:", error);
    res.status(500).json({ message: "Failed to check email feature" });
  }
};

/**
 * Calculate trial status with grace period support
 * Returns:
 * - "active": Trial still active (days 1-14)
 * - "grace_period": Trial ended, but grace period (days 15-17) 
 * - "expired": Grace period ended, read-only mode (day 18+)
 */
export function getTrialStatus(trialEndsAt: Date | null): {
  status: "active" | "grace_period" | "expired";
  daysRemaining: number;
  graceDaysRemaining: number;
} {
  if (!trialEndsAt) {
    return { status: "expired", daysRemaining: 0, graceDaysRemaining: 0 };
  }

  const now = new Date();
  const timeRemaining = trialEndsAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  // Grace period is 3 days after trial ends (days 15-17)
  const gracePeriodDays = 3;
  const gracePeriodEnds = new Date(trialEndsAt);
  gracePeriodEnds.setDate(gracePeriodEnds.getDate() + gracePeriodDays);
  
  const graceDaysRemaining = Math.ceil((gracePeriodEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining > 0) {
    return { status: "active", daysRemaining, graceDaysRemaining };
  } else if (graceDaysRemaining > 0) {
    return { status: "grace_period", daysRemaining: 0, graceDaysRemaining };
  } else {
    return { status: "expired", daysRemaining: 0, graceDaysRemaining: 0 };
  }
}

/**
 * Helper to check and auto-downgrade trial users if trial expired
 * Now with grace period support - only downgrades after grace period ends
 * Should be called on user login or app initialization
 */
export async function checkAndDowngradeTrial(userId: string): Promise<void> {
  try {
    const user = await storage.getUser(userId);

    if (!user) {
      return;
    }

    // Check if trial has expired AND grace period has ended
    if (user.subscriptionPlan === "trial" && user.trialEndsAt) {
      const trialStatus = getTrialStatus(user.trialEndsAt);
      
      if (trialStatus.status === "expired") {
        console.log(`Auto-downgrading user ${userId} from trial to free (grace period ended)`);
        
        // Downgrade to free plan
        await storage.updateUserSubscription(userId, {
          subscriptionPlan: "free",
          trialEndsAt: user.trialEndsAt, // Keep original trial end date for records
        });
      }
    }
  } catch (error) {
    console.error("Error checking trial status:", error);
  }
}

/**
 * Get effective user ID for document access.
 * If user has shared access to another account, returns the owner's ID.
 * Otherwise returns the user's own ID.
 * This allows shared users to access the owner's documents.
 */
export async function getEffectiveUserId(userId: string): Promise<string> {
  try {
    // Check if this user has access to a shared account
    const accessibleAccounts = await storage.getAccessibleAccounts(userId);
    
    // If user has shared access to another account, use owner's ID
    if (accessibleAccounts.sharedAccounts.length > 0) {
      // Return the first shared account owner's ID
      // (Currently limited to 1 shared account per user)
      return accessibleAccounts.sharedAccounts[0].ownerId;
    }
    
    // Otherwise use user's own ID
    return userId;
  } catch (error) {
    console.error("Error getting effective user ID:", error);
    // Fallback to user's own ID on error
    return userId;
  }
}

/**
 * Check if user is a shared user (accessing someone else's account)
 * Returns true if the user is viewing shared documents from another account
 */
export async function isSharedUser(userId: string): Promise<boolean> {
  try {
    const accessibleAccounts = await storage.getAccessibleAccounts(userId);
    return accessibleAccounts.sharedAccounts.length > 0;
  } catch (error) {
    console.error("Error checking if user is shared user:", error);
    return false;
  }
}

/**
 * Get effective user for subscription checks.
 * If user is a Slave (has shared access to another account), returns the Master user.
 * Otherwise returns the user's own data.
 * This ensures Slaves inherit subscription plan from Master in real-time.
 */
export async function getEffectiveUser(userId: string) {
  try {
    const user = await storage.getUser(userId);
    if (!user) return null;

    // Check if this user has shared access to another account (is a Slave)
    const accessibleAccounts = await storage.getAccessibleAccounts(userId);
    
    if (accessibleAccounts.sharedAccounts.length > 0) {
      // User is a Slave - return Master's user data
      const masterUserId = accessibleAccounts.sharedAccounts[0].ownerId;
      const masterUser = await storage.getUser(masterUserId);
      return masterUser;
    }
    
    // User is not a Slave - return their own data
    return user;
  } catch (error) {
    console.error("Error getting effective user:", error);
    return null;
  }
}

/**
 * Get effective subscription plan for a user.
 * If user is a Slave, returns Master's plan.
 * This ensures real-time plan synchronization without database updates.
 */
export async function getEffectiveSubscriptionPlan(userId: string): Promise<{
  subscriptionPlan: string;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
}> {
  const effectiveUser = await getEffectiveUser(userId);
  
  if (!effectiveUser) {
    return {
      subscriptionPlan: 'free',
      trialEndsAt: null,
      subscriptionEndsAt: null,
    };
  }

  return {
    subscriptionPlan: effectiveUser.subscriptionPlan,
    trialEndsAt: effectiveUser.trialEndsAt,
    subscriptionEndsAt: effectiveUser.subscriptionEndsAt,
  };
}
