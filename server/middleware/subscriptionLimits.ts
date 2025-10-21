import type { RequestHandler } from "express";
import { storage } from "../storage";
import { PLAN_LIMITS } from "../../shared/schema";

/**
 * Middleware to check if user has reached document limit for their subscription plan
 */
export const checkDocumentLimit: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trial has expired and downgrade to free
    const now = new Date();
    if (user.subscriptionPlan === "trial" && user.trialEndsAt && now > user.trialEndsAt) {
      // Auto-downgrade to free (will be handled in next request)
      console.log(`Trial expired for user ${userId}, will downgrade to free`);
      // For now, treat as free user
      user.subscriptionPlan = "free";
    }

    const plan = user.subscriptionPlan as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan];

    // If plan has unlimited documents (-1), allow
    if (limits.maxDocuments === -1) {
      return next();
    }

    // Count user's documents
    const documents = await storage.getDocumentsByUserId(userId);
    const documentCount = documents.length;

    if (documentCount >= limits.maxDocuments) {
      return res.status(403).json({
        message: "Dokumenten-Limit erreicht",
        limit: limits.maxDocuments,
        current: documentCount,
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

    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trial has expired
    const now = new Date();
    if (user.subscriptionPlan === "trial" && user.trialEndsAt && now > user.trialEndsAt) {
      user.subscriptionPlan = "free";
    }

    const plan = user.subscriptionPlan as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan];

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
 * Helper to check and auto-downgrade trial users if trial expired
 * Should be called on user login or app initialization
 */
export async function checkAndDowngradeTrial(userId: string): Promise<void> {
  try {
    const user = await storage.getUser(userId);

    if (!user) {
      return;
    }

    // Check if trial has expired
    const now = new Date();
    if (user.subscriptionPlan === "trial" && user.trialEndsAt && now > user.trialEndsAt) {
      console.log(`Auto-downgrading user ${userId} from trial to free`);
      
      // Downgrade to free plan
      await storage.updateUserSubscription(userId, {
        subscriptionPlan: "free",
        trialEndsAt: user.trialEndsAt, // Keep original trial end date for records
      });
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
