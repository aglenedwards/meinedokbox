import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, optionalAuth } from "./replitAuth";
import { setupLocalAuth, hashPassword, isAuthenticatedLocal } from "./localAuth";
import { isAdmin } from "./middleware/adminAuth";
import passport from "passport";
import { z } from "zod";
import { analyzeDocument, analyzeDocumentFromText } from "./lib/openai";
import { extractTextFromPdf } from "./lib/pdfParser";
import { uploadFile } from "./lib/storage";
import { convertPdfToImages } from "./lib/pdfToImage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertDocumentSchema, updateDocumentSchema, DOCUMENT_CATEGORIES, PLAN_LIMITS } from "@shared/schema";
import { combineImagesToPDF, type PageBuffer } from "./lib/pdfGenerator";
import { parseMailgunWebhook, isSupportedAttachment, isValidDocumentAttachment, isEmailWhitelisted, verifyMailgunWebhook, extractEmailAddress } from "./lib/emailInbound";
import { sendSharedAccessInvitation, sendVerificationEmail, sendPasswordResetEmail, sendContactFormEmail, sendAdminNewUserNotification, sendAdminNewSubscriptionNotification } from "./lib/sendEmail";
import { emailQueue } from "./lib/emailQueue";
import bcrypt from 'bcrypt';
import { checkDocumentLimit, checkEmailFeature, checkAndDowngradeTrial, getEffectiveUserId, isSharedUser } from "./middleware/subscriptionLimits";
import { 
  loginLimiter, 
  registerLimiter, 
  emailVerificationLimiter, 
  resendEmailLimiter, 
  inviteLimiter, 
  uploadLimiter,
  contactFormLimiter
} from "./middleware/rateLimiters";
import { db } from "./db";
import { users, emailLogs, sharedAccess, STRIPE_PRICE_IDS } from "@shared/schema";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

// Dynamic Stripe Price IDs - reads from environment variables with fallback to schema defaults
function getStripePriceIds() {
  return {
    solo: {
      monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY || STRIPE_PRICE_IDS.solo.monthly,
      yearly: process.env.STRIPE_PRICE_SOLO_YEARLY || STRIPE_PRICE_IDS.solo.yearly,
    },
    family: {
      monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY || STRIPE_PRICE_IDS.family.monthly,
      yearly: process.env.STRIPE_PRICE_FAMILY_YEARLY || STRIPE_PRICE_IDS.family.yearly,
    },
    "family-plus": {
      monthly: process.env.STRIPE_PRICE_FAMILY_PLUS_MONTHLY || STRIPE_PRICE_IDS["family-plus"].monthly,
      yearly: process.env.STRIPE_PRICE_FAMILY_PLUS_YEARLY || STRIPE_PRICE_IDS["family-plus"].yearly,
    },
  };
}

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = [
      'image/jpeg',      // .jpg, .jpeg
      'image/png',       // .png
      'image/webp',      // .webp
      'image/gif',       // .gif
      'application/pdf'  // .pdf
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Ungültiger Dateityp. Bitte laden Sie nur Bilder (JPEG, PNG, WEBP, GIF) oder PDF-Dateien hoch.'));
    }
  },
});

/**
 * Merges multiple files (PDFs and/or images) into a single PDF
 * @param files - Array of files to merge
 * @returns Buffer containing the merged PDF
 */
async function mergeFilesToPdf(files: Express.Multer.File[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    if (file.mimetype === 'application/pdf') {
      // Merge PDF pages
      const pdfDoc = await PDFDocument.load(file.buffer);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    } else if (file.mimetype.startsWith('image/')) {
      // Convert image to PDF page
      const pageBuffer: PageBuffer = {
        buffer: file.buffer,
        mimeType: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp',
      };
      
      // Use combineImagesToPDF to convert this single image to a PDF
      const singleImagePdf = await combineImagesToPDF([pageBuffer]);
      const imagePdfDoc = await PDFDocument.load(singleImagePdf);
      const pages = await mergedPdf.copyPages(imagePdfDoc, imagePdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
  }
  
  return Buffer.from(await mergedPdf.save());
}

/**
 * Calculates SHA-256 hash of a file buffer for duplicate detection
 * @param buffer - File buffer to hash
 * @returns SHA-256 hash as hex string
 */
function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  await setupLocalAuth();

  // Serve PWA files with correct MIME types (fix production deployment)
  app.get('/service-worker.js', (_req, res) => {
    const filePath = path.resolve(import.meta.dirname, '..', 'public', 'service-worker.js');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Service-Worker-Allowed', '/');
      res.sendFile(filePath);
    } else {
      res.status(404).send('Service Worker not found');
    }
  });

  app.get('/manifest.json', (_req, res) => {
    const filePath = path.resolve(import.meta.dirname, '..', 'public', 'manifest.json');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.sendFile(filePath);
    } else {
      res.status(404).send('Manifest not found');
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check and auto-downgrade trial users if needed
      await checkAndDowngradeTrial(userId);
      
      const user = await storage.getUser(userId);
      
      // Auto-accept shared access invitation if pending
      if (user && user.email) {
        const pendingInvitation = await storage.getSharedAccessByEmail(user.email.toLowerCase());
        if (pendingInvitation) {
          console.log(`Auto-accepting shared access invitation for user ${userId}`);
          await storage.acceptSharedInvitation(user.email.toLowerCase(), userId);
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Regenerate inbound email address for user
  app.post('/api/auth/regenerate-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's name for generating email
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { generateInboundEmail } = await import('./lib/emailInbound');
      const newEmail = await generateInboundEmail(user.firstName, user.lastName);
      
      // Update user in database
      await db.update(users)
        .set({ inboundEmail: newEmail })
        .where(eq(users.id, userId));
      
      console.log(`[Regenerate Email] Generated new email for user ${userId}: ${newEmail}`);
      
      res.json({ inboundEmail: newEmail });
    } catch (error) {
      console.error("Error regenerating email:", error);
      res.status(500).json({ message: "Failed to regenerate email" });
    }
  });

  // Mark welcome modal as seen
  app.post('/api/user/welcome-modal-seen', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await db.update(users)
        .set({ hasSeenWelcomeModal: true })
        .where(eq(users.id, userId));
      
      console.log(`[WelcomeModal] Marked as seen for user ${userId}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking welcome modal as seen:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Mark onboarding tour as seen
  app.post('/api/user/onboarding-seen', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await db.update(users)
        .set({ hasSeenOnboarding: true })
        .where(eq(users.id, userId));
      
      console.log(`[OnboardingTour] Marked as seen for user ${userId}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking onboarding tour as seen:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Email/Password Authentication Routes
  
  // Register with email and password (DSGVO-compliant with double opt-in)
  app.post('/api/auth/register', registerLimiter, async (req, res) => {
    try {
      // Strong password validation: min 8 chars, 1 uppercase, 1 number, 1 special char
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      
      const registerSchema = z.object({
        email: z.string().email("Ungültige E-Mail-Adresse"),
        password: z.string()
          .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
          .regex(passwordRegex, "Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten"),
        passwordConfirm: z.string(),
        firstName: z.string().min(1, "Vorname ist erforderlich"),
        lastName: z.string().min(1, "Nachname ist erforderlich"),
        acceptPrivacy: z.boolean().refine(val => val === true, {
          message: "Sie müssen den Datenschutzbestimmungen zustimmen"
        }),
      }).refine(data => data.password === data.passwordConfirm, {
        message: "Passwörter stimmen nicht überein",
        path: ["passwordConfirm"],
      });

      const { email, password, firstName, lastName } = registerSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase();

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "E-Mail-Adresse bereits registriert" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate verification token (24 hour expiry)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Generate unique user ID
      const userId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Generate unique inbound email address for document forwarding (firstname.lastname@in.meinedokbox.de)
      const { generateInboundEmail } = await import('./lib/emailInbound');
      const inboundEmail = await generateInboundEmail(firstName, lastName);

      // Create user (NOT verified yet)
      await db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        firstName,
        lastName,
        passwordHash,
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
        subscriptionPlan: "trial",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
        inboundEmail, // Add unique email address for forwarding documents
      });

      // Add user's own email to whitelist (allows forwarding from their own address)
      await storage.addEmailToWhitelist(userId, normalizedEmail);
      console.log(`[Register] Added ${normalizedEmail} to whitelist for user ${userId}`);

      // Queue verification email (async, with auto-retry)
      await emailQueue.enqueueVerificationEmail(normalizedEmail, firstName, verificationToken);
      console.log(`[Register] Verification email queued for ${normalizedEmail}`);

      // Send admin notification about new registration (async, non-blocking)
      sendAdminNewUserNotification(normalizedEmail, `${firstName} ${lastName}`, userId)
        .catch(err => console.error('[Register] Failed to send admin notification:', err));
      console.log(`[Register] Admin notification sent for ${normalizedEmail}`);

      res.json({ 
        message: "Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse.",
        emailQueued: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  // Verify email address (Double Opt-in)
  app.get('/api/auth/verify-email', emailVerificationLimiter, async (req, res) => {
    try {
      const { token } = req.query;

      console.log(`[Verify Email] Request received with token: ${token?.toString().substring(0, 10)}...`);

      if (!token || typeof token !== 'string') {
        console.log('[Verify Email] Invalid token format');
        return res.status(400).json({ message: "Ungültiger Verifizierungslink" });
      }

      // Find user with this verification token
      const [user] = await db.select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        console.log(`[Verify Email] No user found with token: ${token.substring(0, 10)}...`);
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Verifizierungslink" });
      }

      console.log(`[Verify Email] Found user: ${user.email}, isVerified: ${user.isVerified}, tokenExpiry: ${user.verificationTokenExpiry}`);

      // Check if token is expired
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        console.log(`[Verify Email] Token expired for ${user.email}`);
        return res.status(400).json({ message: "Verifizierungslink ist abgelaufen. Bitte registrieren Sie sich erneut." });
      }

      // Check if already verified
      if (user.isVerified) {
        console.log(`[Verify Email] User ${user.email} already verified`);
        return res.json({ message: "E-Mail-Adresse wurde bereits bestätigt", alreadyVerified: true });
      }

      // Verify user and clear token
      const updateResult = await db.update(users)
        .set({
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      console.log(`[Verify Email] ✅ User ${user.email} verified successfully (rowCount: ${updateResult.rowCount})`);

      res.json({ message: "E-Mail-Adresse erfolgreich bestätigt. Sie können sich jetzt anmelden." });
    } catch (error) {
      console.error("[Verify Email] ❌ Error during email verification:", error);
      res.status(500).json({ 
        message: "Verifizierung fehlgeschlagen",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Login with email and password
  app.post('/api/auth/login', loginLimiter, (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login fehlgeschlagen" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Email oder Passwort falsch",
          notVerified: info?.notVerified || false
        });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session error:", loginErr);
          return res.status(500).json({ message: "Login fehlgeschlagen" });
        }
        
        // CRITICAL: Force session save before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Login fehlgeschlagen" });
          }
          
          console.log(`[Login Success] Session saved for user: ${user.claims.sub}`);
          res.json({ message: "Login erfolgreich" });
        });
      });
    })(req, res, next);
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', resendEmailLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "E-Mail-Adresse erforderlich" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Find user
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user) {
        // Don't reveal if email exists (security)
        return res.json({ message: "Falls ein Account mit dieser E-Mail existiert, wurde eine neue Bestätigungs-E-Mail gesendet." });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Dieser Account ist bereits verifiziert. Sie können sich einloggen." });
      }

      // Generate new verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await db.update(users)
        .set({
          verificationToken,
          verificationTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // Queue new verification email (async, with auto-retry)
      await emailQueue.enqueueVerificationEmail(normalizedEmail, user.firstName, verificationToken);
      console.log(`[ResendVerification] Verification email queued for ${normalizedEmail}`);

      console.log(`[ResendVerification] New verification email sent to ${normalizedEmail}`);
      
      res.json({ message: "Eine neue Bestätigungs-E-Mail wurde gesendet. Bitte prüfen Sie Ihr Postfach (auch Spam-Ordner)." });
    } catch (error) {
      console.error('[ResendVerification] Error:', error);
      res.status(500).json({ message: "Fehler beim Senden der Bestätigungs-E-Mail" });
    }
  });

  // Password Reset Routes
  
  // Request password reset (send email with reset link)
  app.post('/api/auth/forgot-password', loginLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "E-Mail-Adresse erforderlich" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Find user
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      // Don't reveal if email exists (security best practice)
      if (!user) {
        return res.json({ message: "Falls ein Account mit dieser E-Mail existiert, wurde eine Passwort-Reset-E-Mail gesendet." });
      }

      // Generate reset token (1 hour expiry)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await db.update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetTokenExpiry: resetTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(normalizedEmail, user.firstName, resetToken);
      
      if (!emailSent) {
        console.error(`[ForgotPassword] Failed to send email to ${normalizedEmail}`);
        // Still return success to not reveal if user exists
      } else {
        console.log(`[ForgotPassword] Password reset email sent to ${normalizedEmail}`);
      }
      
      res.json({ message: "Falls ein Account mit dieser E-Mail existiert, wurde eine Passwort-Reset-E-Mail gesendet." });
    } catch (error) {
      console.error('[ForgotPassword] Error:', error);
      res.status(500).json({ message: "Fehler beim Senden der Passwort-Reset-E-Mail" });
    }
  });

  // Validate password reset token
  app.get('/api/auth/validate-reset-token', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Ungültiger Reset-Link", valid: false });
      }

      // Find user with this reset token
      const [user] = await db.select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Reset-Link", valid: false });
      }

      // Check if token is expired
      if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an.", valid: false });
      }

      res.json({ message: "Token ist gültig", valid: true, email: user.email });
    } catch (error) {
      console.error('[ValidateResetToken] Error:', error);
      res.status(500).json({ message: "Fehler bei der Token-Validierung", valid: false });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', loginLimiter, async (req, res) => {
    try {
      // Strong password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      
      const resetSchema = z.object({
        token: z.string().min(1, "Token ist erforderlich"),
        password: z.string()
          .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
          .regex(passwordRegex, "Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten"),
        passwordConfirm: z.string(),
      }).refine(data => data.password === data.passwordConfirm, {
        message: "Passwörter stimmen nicht überein",
        path: ["passwordConfirm"],
      });

      const { token, password } = resetSchema.parse(req.body);

      // Find user with this reset token
      const [user] = await db.select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Reset-Link" });
      }

      // Check if token is expired
      if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an." });
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update user with new password and clear reset token
      await db.update(users)
        .set({
          passwordHash,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      console.log(`[ResetPassword] ✅ Password reset successful for ${user.email}`);

      res.json({ message: "Passwort erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('[ResetPassword] Error:', error);
      res.status(500).json({ message: "Fehler beim Zurücksetzen des Passworts" });
    }
  });

  // Logout (works for both local and OIDC auth)
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout fehlgeschlagen" });
      }
      res.json({ message: "Logout erfolgreich" });
    });
  });

  // Subscription management routes
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const { PLAN_LIMITS } = await import('@shared/schema');
      const { getTrialStatus, getEffectiveUser, getEffectiveUserId } = await import('./middleware/subscriptionLimits');
      
      // Get effective user (Master if this user is a Slave)
      const effectiveUser = await getEffectiveUser(userId);
      
      if (!effectiveUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const plan = effectiveUser.subscriptionPlan as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[plan];

      // Calculate trial status with grace period (using Master's dates if Slave)
      let daysRemaining = null;
      let gracePeriod = false;
      let isReadOnly = false;
      let graceDaysRemaining = 0;
      
      if (effectiveUser.subscriptionPlan === 'trial' && effectiveUser.trialEndsAt) {
        const trialStatus = getTrialStatus(effectiveUser.trialEndsAt);
        daysRemaining = trialStatus.daysRemaining;
        gracePeriod = trialStatus.status === 'grace_period';
        isReadOnly = trialStatus.status === 'expired';
        graceDaysRemaining = trialStatus.graceDaysRemaining;
      }

      // === NEW HYBRID LIMIT SYSTEM ===
      // Calculate combined stats for Master + all Slaves

      // Get all partner IDs (Master gets Slaves, Slave gets Master)
      const partnerIds = await storage.getPartnerUserIds(effectiveUser.id);
      const allUserIds = [effectiveUser.id, ...partnerIds];

      // Auto-reset upload counters if new month
      await Promise.all(allUserIds.map(id => storage.checkAndResetUploadCounter(id)));

      // 1. Sum up monthly uploads (Master + Slaves)
      let uploadsThisMonth = 0;
      for (const id of allUserIds) {
        const user = await storage.getUser(id);
        if (user) {
          uploadsThisMonth += user.uploadedThisMonth || 0;
        }
      }

      // 2. Sum up total storage (Master + Slaves)
      let storageUsedBytes = 0;
      for (const id of allUserIds) {
        const stats = await storage.getUserStorageStats(id);
        storageUsedBytes += stats.usedBytes;
      }
      const storageUsedGB = parseFloat((storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2));

      // 3. Count documents (for backward compatibility)
      const documents = await storage.getDocumentsByUserId(userId);
      const documentCount = documents.length;

      // isUploadDisabled combines all upload restrictions
      const isUploadDisabled = !limits.canUpload || gracePeriod || isReadOnly;

      // Count current users (Master + accepted Slaves)
      const currentUsers = allUserIds.length; // Includes Master + all partner users
      const maxUsers = limits.maxUsers;

      res.json({
        plan: effectiveUser.subscriptionPlan,
        displayName: limits.displayName,
        // NEW: Hybrid limit system
        maxUploadsPerMonth: limits.maxUploadsPerMonth,
        uploadsThisMonth,
        maxStorageGB: limits.maxStorageGB,
        storageUsedGB,
        // User count (for family plans)
        currentUsers,
        maxUsers,
        // Legacy fields (for backward compatibility)
        maxDocuments: -1, // Deprecated, now using monthly uploads + storage
        currentDocuments: documentCount,
        // Plan features
        canUseEmailInbound: limits.canUseEmailInbound,
        canUpload: limits.canUpload,
        isUploadDisabled,
        // Trial status
        trialEndsAt: effectiveUser.trialEndsAt,
        daysRemaining,
        gracePeriod,
        isReadOnly,
        graceDaysRemaining,
        subscriptionEndsAt: effectiveUser.subscriptionEndsAt,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // Upgrade/change subscription plan with billing address
  app.post('/api/subscription/upgrade', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const upgradeSchema = z.object({
        plan: z.enum(["solo", "family", "family-plus"]),
        period: z.enum(["monthly", "yearly"]),
        billingCompany: z.string().optional(),
        billingStreet: z.string().min(1, "Straße ist erforderlich"),
        billingPostalCode: z.string().min(1, "PLZ ist erforderlich"),
        billingCity: z.string().min(1, "Stadt ist erforderlich"),
        billingCountry: z.string().default("Deutschland"),
      });

      const data = upgradeSchema.parse(req.body);

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { PLAN_LIMITS } = await import('@shared/schema');
      const newPlanLimits = PLAN_LIMITS[data.plan];
      const currentPlanLimits = PLAN_LIMITS[user.subscriptionPlan as keyof typeof PLAN_LIMITS];

      // Downgrade logic: If reducing maxUsers, revoke excess shared users
      if (newPlanLimits.maxUsers < currentPlanLimits.maxUsers) {
        const { sharedAccess } = await import('@shared/schema');
        const activeInvites = await db
          .select()
          .from(sharedAccess)
          .where(eq(sharedAccess.ownerId, userId));

        const activeCount = activeInvites.filter(
          inv => inv.status === 'active' || inv.status === 'pending'
        ).length;

        // Calculate how many users will be allowed: maxUsers - 1 (owner takes 1 slot)
        const allowedInvites = newPlanLimits.maxUsers - 1;

        if (activeCount > allowedInvites) {
          // Revoke excess invitations (keep newest, revoke oldest)
          const toRevoke = activeInvites
            .filter(inv => inv.status === 'active' || inv.status === 'pending')
            .sort((a, b) => new Date(a.invitedAt || 0).getTime() - new Date(b.invitedAt || 0).getTime())
            .slice(0, activeCount - allowedInvites);

          for (const invite of toRevoke) {
            await storage.revokeSharedAccess(invite.id);
            console.log(`[Downgrade] Revoked shared access ${invite.id} for ${invite.sharedWithEmail}`);
          }

          console.log(`[Downgrade] Revoked ${toRevoke.length} invitations due to plan downgrade`);
        }
      }

      // Update user subscription plan with billing address
      await db.update(users)
        .set({
          subscriptionPlan: data.plan,
          subscriptionEndsAt: null, // Paid plans are active until cancelled
          billingCompany: data.billingCompany || null,
          billingStreet: data.billingStreet,
          billingPostalCode: data.billingPostalCode,
          billingCity: data.billingCity,
          billingCountry: data.billingCountry,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`[Upgrade] User ${userId} upgraded to ${data.plan} (${data.period})`);

      // TODO: Generate and send invoice via email

      res.json({ 
        message: `Erfolgreich auf ${newPlanLimits.displayName} upgradet!`,
        plan: data.plan,
        period: data.period,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: "Upgrade fehlgeschlagen" });
    }
  });

  // Shared Access API routes (Premium feature)
  
  // Invite second person (Premium only)
  app.post('/api/shared-access/invite', isAuthenticated, inviteLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "E-Mail-Adresse erforderlich" });
      }

      const normalizedEmail = email.toLowerCase();

      // Get user and effective subscription plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // Get effective plan (Master's plan if this user is a Slave)
      const { getEffectiveUser } = await import('./middleware/subscriptionLimits');
      const effectiveUser = await getEffectiveUser(userId);
      
      if (!effectiveUser) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      // Check if effective plan allows invitations
      const effectivePlan = effectiveUser.subscriptionPlan;
      if (effectivePlan !== 'family' && effectivePlan !== 'family-plus' && effectivePlan !== 'trial') {
        return res.status(403).json({ message: "Diese Funktion ist nur für Family- und Trial-Nutzer verfügbar" });
      }

      // Get subscription plan limits (using effective plan)
      const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
      
      // Get all existing invitations
      const allInvitations = await storage.getAllSharedAccessByOwner(userId);
      
      // Check if invitation for this email already exists
      const existingInvitation = allInvitations.find(inv => inv.sharedWithEmail === normalizedEmail);
      
      if (existingInvitation) {
        // If revoked, reactivate the invitation
        if (existingInvitation.status === 'revoked') {
          console.log(`[Invite] Reactivating revoked invitation for ${normalizedEmail}`);
          
          // Generate new token (7-day expiry)
          const invitationToken = crypto.randomBytes(32).toString('hex');
          const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
          // Update invitation: revoked → pending, new token
          await db.update(sharedAccess)
            .set({
              status: 'pending',
              invitationToken,
              tokenExpiresAt,
              invitedAt: new Date(),
            })
            .where(eq(sharedAccess.id, existingInvitation.id));
          
          // Send new invitation email
          const ownerName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email || "Ein Nutzer";
          
          console.log(`[Invite] Queueing reactivation email to ${normalizedEmail} with token ${invitationToken}`);
          await emailQueue.enqueueInvitationEmail(normalizedEmail, ownerName, invitationToken);
          console.log("[Invite] ✅ Reactivation email queued successfully");
          
          // Get updated invitation
          const updatedInvitation = await db.select()
            .from(sharedAccess)
            .where(eq(sharedAccess.id, existingInvitation.id))
            .limit(1);
          
          return res.json({
            message: "Einladung reaktiviert und erneut gesendet",
            sharedAccess: updatedInvitation[0],
            emailQueued: true,
            reactivated: true,
          });
        }
        
        // If pending or active, return error
        if (existingInvitation.status === 'pending') {
          return res.status(400).json({ message: "Diese Person wurde bereits eingeladen" });
        }
        if (existingInvitation.status === 'active') {
          return res.status(400).json({ message: "Diese Person hat bereits Zugriff" });
        }
      }

      // Check if max users limit reached (count only pending and active invitations)
      const activeInvitations = allInvitations.filter(inv => 
        inv.status === 'pending' || inv.status === 'active'
      );
      
      if (activeInvitations.length >= planLimits.maxUsers - 1) {
        return res.status(400).json({ 
          message: `Ihr ${planLimits.displayName} Plan erlaubt maximal ${planLimits.maxUsers} Nutzer. Sie haben bereits ${activeInvitations.length} Einladung(en).`
        });
      }

      // Generate invitation token (7-day expiry)
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create new invitation
      const sharedAccessData = await storage.createSharedAccess({
        ownerId: userId,
        sharedWithEmail: normalizedEmail,
        invitationToken,
        tokenExpiresAt,
        status: 'pending',
      });

      // Send email invitation via Mailgun with token link
      const ownerName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.email || "Ein Nutzer";
      
      console.log(`[Invite] Queueing invitation email to ${normalizedEmail} from ${ownerName} with token ${invitationToken}`);
      await emailQueue.enqueueInvitationEmail(normalizedEmail, ownerName, invitationToken);
      console.log("[Invite] ✅ Invitation email queued successfully");

      res.json({
        message: "Einladung gesendet",
        sharedAccess: sharedAccessData,
        emailQueued: true,
        reactivated: false,
      });
    } catch (error) {
      console.error("Error creating shared access:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Einladung" });
    }
  });

  // Get shared access status
  app.get('/api/shared-access', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedAccess = await storage.getSharedAccessByOwner(userId);
      res.json(sharedAccess || null);
    } catch (error) {
      console.error("Error fetching shared access:", error);
      res.status(500).json({ message: "Fehler beim Laden des Zugriffsstatus" });
    }
  });

  // Get all invitations with status (for master to see pending/active/expired)
  app.get('/api/shared-access/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allAccess = await storage.getAllSharedAccessByOwner(userId);
      
      // Mark expired tokens
      const now = new Date();
      const accessWithStatus = allAccess.map(access => {
        const isExpired = access.tokenExpiresAt && access.tokenExpiresAt < now && access.status === 'pending';
        return {
          ...access,
          status: isExpired ? 'expired' : access.status,
        };
      });
      
      res.json(accessWithStatus);
    } catch (error) {
      console.error("Error fetching all shared access:", error);
      res.status(500).json({ message: "Fehler beim Laden der Einladungen" });
    }
  });

  // Resend invitation (generates new token and sends new email)
  app.post('/api/shared-access/resend/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Resend invitation (generates new token)
      const updatedAccess = await storage.resendInvitation(id, userId);
      
      if (!updatedAccess) {
        return res.status(404).json({ message: "Einladung nicht gefunden" });
      }
      
      // Get owner info for email
      const user = await storage.getUser(userId);
      const ownerName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user?.email || "Ein Nutzer";
      
      // Queue new invitation email (async, with auto-retry)
      console.log(`[Resend Invite] Queueing new invitation to ${updatedAccess.sharedWithEmail}`);
      await emailQueue.enqueueInvitationEmail(
        updatedAccess.sharedWithEmail, 
        ownerName,
        updatedAccess.invitationToken!
      );
      console.log("[Resend Invite] ✅ Invitation email queued successfully");
      
      res.json({
        message: "Einladung erneut gesendet",
        sharedAccess: updatedAccess,
        emailQueued: true,
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Fehler beim erneuten Senden der Einladung" });
    }
  });

  // Revoke shared access
  app.delete('/api/shared-access', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const revoked = await storage.revokeSharedAccess(userId);
      
      if (!revoked) {
        return res.status(404).json({ message: "Kein aktiver Zugriff gefunden" });
      }

      res.json({ message: "Zugriff widerrufen" });
    } catch (error) {
      console.error("Error revoking shared access:", error);
      res.status(500).json({ message: "Fehler beim Widerrufen des Zugriffs" });
    }
  });

  // Delete revoked slave completely (only if no documents)
  app.delete('/api/shared-access/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Get the invitation
      const invitation = await db.select()
        .from(sharedAccess)
        .where(eq(sharedAccess.id, id))
        .limit(1);
      
      if (!invitation || invitation.length === 0) {
        return res.status(404).json({ message: "Einladung nicht gefunden" });
      }
      
      const access = invitation[0];
      
      // Verify ownership
      if (access.ownerId !== userId) {
        return res.status(403).json({ message: "Keine Berechtigung" });
      }
      
      // Only allow deletion of revoked slaves
      if (access.status !== 'revoked') {
        return res.status(400).json({ 
          message: `Nur widerrufene Einladungen können gelöscht werden. Status: ${access.status}` 
        });
      }
      
      // Check if slave has userId (was registered)
      if (access.sharedWithUserId) {
        // Check if slave has any documents
        const slaveDocuments = await storage.getDocumentsByUserId(access.sharedWithUserId);
        
        if (slaveDocuments.length > 0) {
          return res.status(400).json({ 
            message: `Dieser Nutzer hat ${slaveDocuments.length} Dokument(e) und kann nicht gelöscht werden.` 
          });
        }
        
        // Delete user account
        await db.delete(users)
          .where(eq(users.id, access.sharedWithUserId));
        
        console.log(`[Delete Slave] Deleted user account ${access.sharedWithUserId} (${access.sharedWithEmail})`);
      }
      
      // Delete shared_access entry
      await db.delete(sharedAccess)
        .where(eq(sharedAccess.id, id));
      
      console.log(`[Delete Slave] Deleted invitation ${id} for ${access.sharedWithEmail}`);
      
      res.json({ 
        message: "Einladung und Nutzer erfolgreich gelöscht",
        deletedUserId: access.sharedWithUserId || null
      });
    } catch (error) {
      console.error("Error deleting shared access:", error);
      res.status(500).json({ message: "Fehler beim Löschen der Einladung" });
    }
  });

  // Accept shared access invitation (when invited user logs in)
  app.post('/api/shared-access/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "Benutzer-E-Mail nicht gefunden" });
      }

      // Check if there's a pending invitation for this email
      const invitation = await storage.getSharedAccessByEmail(user.email.toLowerCase());
      
      if (!invitation) {
        return res.status(404).json({ message: "Keine ausstehende Einladung gefunden" });
      }

      // Accept the invitation
      const accepted = await storage.acceptSharedInvitation(user.email.toLowerCase(), userId);
      
      res.json({
        message: "Einladung akzeptiert",
        sharedAccess: accepted,
      });
    } catch (error) {
      console.error("Error accepting shared access:", error);
      res.status(500).json({ message: "Fehler beim Akzeptieren der Einladung" });
    }
  });

  // Email Whitelist API routes (Security feature for inbound email)
  
  // Get whitelist for user
  app.get('/api/email-whitelist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      
      const whitelistEntries = await storage.getEmailWhitelist(effectiveUserId);
      res.json(whitelistEntries);
    } catch (error) {
      console.error("Error fetching email whitelist:", error);
      res.status(500).json({ message: "Fehler beim Laden der Whitelist" });
    }
  });
  
  // Add email to whitelist
  app.post('/api/email-whitelist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "E-Mail-Adresse erforderlich" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Ungültige E-Mail-Adresse" });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if already in whitelist
      const existing = await storage.getEmailWhitelistEntry(effectiveUserId, normalizedEmail);
      if (existing) {
        return res.status(400).json({ message: "E-Mail-Adresse bereits in der Whitelist" });
      }
      
      const entry = await storage.addEmailToWhitelist(effectiveUserId, normalizedEmail);
      res.json(entry);
    } catch (error) {
      console.error("Error adding to whitelist:", error);
      res.status(500).json({ message: "Fehler beim Hinzufügen zur Whitelist" });
    }
  });
  
  // Remove email from whitelist
  app.delete('/api/email-whitelist/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      const { id } = req.params;
      
      const deleted = await storage.removeEmailFromWhitelist(id, effectiveUserId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Eintrag nicht gefunden" });
      }
      
      res.json({ message: "E-Mail-Adresse entfernt" });
    } catch (error) {
      console.error("Error removing from whitelist:", error);
      res.status(500).json({ message: "Fehler beim Entfernen aus der Whitelist" });
    }
  });

  // Public Invitation API routes (Token-based registration)
  
  // Validate invitation token (public endpoint)
  app.get('/api/invite/validate', async (req: any, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, message: "Token erforderlich" });
      }
      
      const invitation = await storage.getSharedAccessByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ valid: false, message: "Einladung nicht gefunden" });
      }
      
      // Check expiry
      const now = new Date();
      if (invitation.tokenExpiresAt && invitation.tokenExpiresAt < now) {
        return res.json({ valid: false, expired: true, message: "Einladung abgelaufen" });
      }
      
      // Check if already accepted
      if (invitation.status === 'accepted' || invitation.sharedWithUserId) {
        return res.json({ valid: false, alreadyAccepted: true, message: "Einladung bereits verwendet" });
      }
      
      res.json({
        valid: true,
        email: invitation.sharedWithEmail,
        message: "Gültige Einladung"
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({ valid: false, message: "Fehler bei der Validierung" });
    }
  });
  
  // Register with invitation token (public endpoint)
  app.post('/api/invite/register', async (req: any, res) => {
    try {
      const { token, firstName, lastName, password } = req.body;
      
      if (!token || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "Alle Felder sind erforderlich" });
      }
      
      // Validate token and get invitation
      const invitation = await storage.getSharedAccessByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Einladung nicht gefunden" });
      }
      
      // Check expiry
      const now = new Date();
      if (invitation.tokenExpiresAt && invitation.tokenExpiresAt < now) {
        return res.status(400).json({ message: "Einladung abgelaufen" });
      }
      
      // Check if already accepted
      if (invitation.status === 'accepted' || invitation.sharedWithUserId) {
        return res.status(400).json({ message: "Einladung bereits verwendet" });
      }
      
      const invitedEmail = invitation.sharedWithEmail;
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(invitedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Benutzer mit dieser E-Mail existiert bereits" });
      }
      
      // Validate password (strong password requirements)
      if (password.length < 8) {
        return res.status(400).json({ message: "Passwort muss mindestens 8 Zeichen lang sein" });
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        return res.status(400).json({ 
          message: "Passwort muss Groß-, Kleinbuchstaben, Zahlen und Sonderzeichen enthalten" 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Validate master exists
      const masterUser = await storage.getUser(invitation.ownerId);
      if (!masterUser) {
        return res.status(500).json({ message: "Master-Account nicht gefunden" });
      }
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create Slave user
      // NOTE: Slave gets 'free' plan in database, but will inherit Master's plan dynamically
      // via getEffectiveUser() function for all subscription checks
      const newUser = await storage.upsertUser({
        id: `local_${crypto.randomBytes(16).toString('hex')}`,
        email: invitedEmail,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        subscriptionPlan: 'free', // Slave default plan (actual plan comes from Master via getEffectiveUser)
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
      });
      
      // Link invitation to new user
      await storage.acceptSharedInvitationByToken(token, newUser.id);
      
      // Queue email verification (async, with auto-retry)
      await emailQueue.enqueueVerificationEmail(invitedEmail, firstName, verificationToken);
      
      // Send admin notification about new registration (async, non-blocking)
      sendAdminNewUserNotification(invitedEmail, `${firstName} ${lastName}`, newUser.id)
        .catch(err => console.error('[Invite Register] Failed to send admin notification:', err));
      
      console.log(`[Invite Register] Created new user ${newUser.id} for invited email ${invitedEmail}, verification email queued`);
      
      res.json({
        message: "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.",
        emailQueued: true,
        userId: newUser.id,
      });
    } catch (error) {
      console.error("Error registering with invitation:", error);
      res.status(500).json({ message: "Fehler bei der Registrierung" });
    }
  });

  // Contact Form API route
  app.post('/api/contact', contactFormLimiter, async (req, res) => {
    try {
      const contactSchema = z.object({
        name: z.string().min(2, "Name zu kurz"),
        email: z.string().email("Ungültige E-Mail-Adresse"),
        subject: z.string().min(3, "Betreff zu kurz"),
        message: z.string().min(10, "Nachricht zu kurz"),
        privacy: z.boolean().refine(val => val === true, {
          message: "Datenschutzerklärung muss akzeptiert werden"
        }),
      });

      const { name, email, subject, message } = contactSchema.parse(req.body);

      console.log(`[Contact Form] Received message from ${name} (${email})`);
      
      // Send email to service address
      const emailSent = await sendContactFormEmail(name, email, subject, message);

      if (!emailSent) {
        console.error("[Contact Form] Failed to send email");
        return res.status(500).json({ 
          message: "Die Nachricht konnte nicht versendet werden. Bitte versuchen Sie es später erneut." 
        });
      }

      console.log(`[Contact Form] ✅ Email sent successfully from ${name}`);
      res.json({ 
        message: "Nachricht erfolgreich gesendet!",
        success: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Fehler beim Senden der Nachricht" });
    }
  });

  // Folders API routes
  
  // Get all folders for user
  app.get('/api/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      const folders = await storage.getUserFolders(effectiveUserId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Fehler beim Laden der Ordner" });
    }
  });

  // Create new folder
  app.post('/api/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      const { name, isShared, icon } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Ordnername erforderlich" });
      }

      const folder = await storage.createFolder({
        userId: effectiveUserId,
        name,
        isShared: isShared !== undefined ? isShared : true,
        icon: icon || "📂",
      });

      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Ordners" });
    }
  });

  // Update folder
  app.patch('/api/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      const { id } = req.params;
      const { name, isShared, icon } = req.body;

      const folder = await storage.updateFolder(id, effectiveUserId, {
        name,
        isShared,
        icon,
      });

      if (!folder) {
        return res.status(404).json({ message: "Ordner nicht gefunden" });
      }

      res.json(folder);
    } catch (error) {
      console.error("Error updating folder:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Ordners" });
    }
  });

  // Delete folder
  app.delete('/api/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      const { id } = req.params;

      const deleted = await storage.deleteFolder(id, effectiveUserId);

      if (!deleted) {
        return res.status(404).json({ message: "Ordner nicht gefunden" });
      }

      res.json({ message: "Ordner gelöscht" });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Ordners" });
    }
  });

  // Local Auth versions of Folder endpoints
  app.get('/api/folders', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const folders = await storage.getUserFolders(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Fehler beim Laden der Ordner" });
    }
  });

  app.post('/api/folders', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const { name, isShared, icon } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Ordnername erforderlich" });
      }

      const folder = await storage.createFolder({
        userId,
        name,
        isShared: isShared !== undefined ? isShared : true,
        icon: icon || "📂",
      });

      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Ordners" });
    }
  });

  app.delete('/api/folders/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const { id } = req.params;

      const deleted = await storage.deleteFolder(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Ordner nicht gefunden" });
      }

      res.json({ message: "Ordner gelöscht" });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Ordners" });
    }
  });

  // Get documents in a specific folder
  app.get('/api/folders/:folderId/documents', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const { folderId } = req.params;

      const documents = await storage.getDocumentsByFolder(folderId, userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching folder documents:", error);
      res.status(500).json({ message: "Fehler beim Laden der Dokumente" });
    }
  });

  // Document upload endpoint - supports single or multiple files (max 10)
  app.post('/api/documents/upload', isAuthenticated, uploadLimiter, checkDocumentLimit, upload.array('files', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      const folderId = req.body.folderId || null; // Optional folder assignment
      const mergeIntoOne = req.body.mergeIntoOne === 'true'; // Parse boolean from form data
      const forceDuplicates = req.body.forceDuplicates === 'true'; // Allow uploading duplicates

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Keine Dateien ausgewählt" });
      }

      if (files.length > 10) {
        return res.status(400).json({ message: "Maximal 10 Dateien gleichzeitig möglich" });
      }

      // Handle merge into one document
      if (mergeIntoOne && files.length > 1) {
        console.log(`Merging ${files.length} file(s) into one document${folderId ? ` into folder ${folderId}` : ''}`);
        
        try {
          // Check if all files are images (not PDFs)
          const allFilesAreImages = files.every(f => 
            f.mimetype === 'image/jpeg' || 
            f.mimetype === 'image/png' || 
            f.mimetype === 'image/webp'
          );
          
          let analysisResult;
          let mergedPdfBuffer: Buffer;
          
          if (allFilesAreImages) {
            // OPTIMIZED PATH: For camera/image files, analyze directly then merge
            console.log('  All files are images - analyzing directly without intermediate PDF conversion');
            
            // Compress images before sending to Vision API (large images cause timeouts)
            console.log('  Compressing images for Vision API...');
            const imagesForAnalysis = await Promise.all(
              files.map(async (file) => {
                const compressedBuffer = await sharp(file.buffer)
                  .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                  .jpeg({ quality: 85 })
                  .toBuffer();
                
                console.log(`    Compressed ${file.originalname}: ${file.buffer.length} → ${compressedBuffer.length} bytes`);
                
                return {
                  base64: compressedBuffer.toString('base64'),
                  mimeType: 'image/jpeg',
                };
              })
            );
            
            // Analyze all images directly with Vision API
            console.log(`  Analyzing ${files.length} image(s) with Vision API...`);
            analysisResult = await analyzeDocument(imagesForAnalysis);
            
            // Now merge the images into a PDF
            console.log('  Creating merged PDF from images...');
            mergedPdfBuffer = await mergeFilesToPdf(files);
          } else {
            // ORIGINAL PATH: For PDFs or mixed content, merge first then analyze
            console.log('  Files contain PDFs - merging first then analyzing');
            
            // Merge all files into a single PDF
            mergedPdfBuffer = await mergeFilesToPdf(files);
            
            // Analyze the merged PDF
            const extractedText = await extractTextFromPdf(mergedPdfBuffer);
            console.log(`  Extracted ${extractedText.length} characters from merged PDF`);
            
            if (extractedText.length < 250) {
              console.log('  Merged PDF has insufficient text, converting to images for Vision API OCR');
              const pdfImages = await convertPdfToImages(mergedPdfBuffer);
              const imagesForAnalysis = pdfImages.map(img => ({
                base64: img.base64,
                mimeType: img.mimeType,
              }));
              analysisResult = await analyzeDocument(imagesForAnalysis);
            } else {
              analysisResult = await analyzeDocumentFromText(extractedText);
            }
          }
          
          // Calculate hash for duplicate detection
          const fileHash = calculateFileHash(mergedPdfBuffer);
          
          // Check for duplicates if not forcing upload
          if (!forceDuplicates) {
            const duplicate = await storage.findDuplicateDocument(userId, fileHash);
            if (duplicate) {
              console.log(`  ! Duplicate detected: ${duplicate.title} (uploaded ${duplicate.uploadedAt})`);
              return res.status(409).json({
                isDuplicate: true,
                duplicate: {
                  id: duplicate.id,
                  title: duplicate.title,
                  uploadedAt: duplicate.uploadedAt,
                  category: duplicate.category,
                },
                message: "Dieses Dokument wurde bereits hochgeladen"
              });
            }
          }
          
          // Create a merged file object
          const mergedFilename = `merged_${Date.now()}.pdf`;
          const mergedFile: Express.Multer.File = {
            ...files[0], // Copy metadata from first file
            buffer: mergedPdfBuffer,
            originalname: mergedFilename,
            mimetype: 'application/pdf',
            size: mergedPdfBuffer.length,
          };
          
          // Upload merged document
          const document = await processSingleFileUpload(userId, mergedFile, analysisResult, folderId, fileHash);
          
          // Increment upload counter by 1 (merged document counts as 1)
          await storage.incrementUploadCounter(userId, 1);
          
          console.log(`  ✓ Successfully uploaded merged document: ${analysisResult.title}`);
          
          return res.json({
            message: "Dokument erfolgreich zusammengeführt und hochgeladen",
            documents: [document]
          });
        } catch (error) {
          console.error("Error merging documents:", error);
          return res.status(500).json({
            message: "Fehler beim Zusammenführen der Dokumente",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Process each file as a separate document (original behavior)
      console.log(`Processing ${files.length} file(s) as separate documents${folderId ? ` into folder ${folderId}` : ''}`);

      const uploadedDocuments = [];
      const errors = [];
      const duplicates = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`  [${i + 1}/${files.length}] Processing: ${file.originalname}`);
          
          // Calculate hash for duplicate detection
          const fileHash = calculateFileHash(file.buffer);
          
          // Check for duplicates if not forcing upload
          if (!forceDuplicates) {
            const duplicate = await storage.findDuplicateDocument(userId, fileHash);
            if (duplicate) {
              console.log(`    ! Duplicate detected: ${duplicate.title} (uploaded ${duplicate.uploadedAt})`);
              duplicates.push({
                filename: file.originalname,
                duplicate: {
                  id: duplicate.id,
                  title: duplicate.title,
                  uploadedAt: duplicate.uploadedAt,
                  category: duplicate.category,
                }
              });
              continue; // Skip this file
            }
          }
          
          const isPdf = file.mimetype === 'application/pdf';
          let analysisResult;

          if (isPdf) {
            // Handle PDF: Extract text and analyze
            const extractedText = await extractTextFromPdf(file.buffer);
            console.log(`    Extracted ${extractedText.length} characters from PDF`);
            
            // If PDF text extraction yielded too little text (< 250 chars), 
            // it's likely a scanned/image-based document - convert to images and use Vision API
            // Vision API is much better at OCR than simple text extraction
            if (extractedText.length < 250) {
              console.log('    PDF has insufficient text, converting to images for Vision API OCR');
              const pdfImages = await convertPdfToImages(file.buffer);
              const imagesForAnalysis = pdfImages.map(img => ({
                base64: img.base64,
                mimeType: img.mimeType,
              }));
              analysisResult = await analyzeDocument(imagesForAnalysis);
            } else {
              analysisResult = await analyzeDocumentFromText(extractedText);
            }
          } else {
            // Handle single image: Use Vision API
            const imageForAnalysis = [{
              base64: file.buffer.toString('base64'),
              mimeType: file.mimetype,
            }];
            analysisResult = await analyzeDocument(imageForAnalysis);
          }
          
          // Auto-rotate image if AI detected upside down orientation
          if (analysisResult.needsRotation && !isPdf && file.mimetype.startsWith('image/')) {
            console.log('    ⟳ AI detected upside down document - auto-rotating 180°');
            try {
              const rotatedBuffer = await sharp(file.buffer)
                .rotate(180)
                .toBuffer();
              file.buffer = rotatedBuffer;
              console.log('    ✓ Rotated successfully');
            } catch (error) {
              console.error('    ✗ Failed to rotate:', error);
            }
          }
          
          // Upload file and create document
          const document = await processSingleFileUpload(userId, file, analysisResult, folderId, fileHash);
          uploadedDocuments.push(document);
          
          console.log(`    ✓ Successfully uploaded: ${analysisResult.title}`);
        } catch (error) {
          console.error(`    ✗ Failed to process ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Increment upload counter by number of successful uploads
      if (uploadedDocuments.length > 0) {
        await storage.incrementUploadCounter(userId, uploadedDocuments.length);
      }
      
      // Return results with duplicate information
      if (uploadedDocuments.length === 0 && duplicates.length === 0) {
        return res.status(400).json({ 
          message: "Alle Uploads sind fehlgeschlagen",
          errors 
        });
      }
      
      // If only duplicates were found (no successful uploads)
      if (uploadedDocuments.length === 0 && duplicates.length > 0) {
        return res.status(409).json({
          isDuplicate: true,
          duplicates,
          message: duplicates.length === 1 
            ? "Dieses Dokument wurde bereits hochgeladen" 
            : `${duplicates.length} Dokumente wurden bereits hochgeladen`
        });
      }
      
      // Mixed results: some uploaded, some duplicates, some errors
      if (duplicates.length > 0 || errors.length > 0) {
        return res.status(207).json({ // 207 Multi-Status
          message: `${uploadedDocuments.length} von ${files.length} Dokumenten erfolgreich hochgeladen`,
          documents: uploadedDocuments,
          duplicates: duplicates.length > 0 ? duplicates : undefined,
          errors: errors.length > 0 ? errors : undefined
        });
      }
      
      // All successful
      res.json({ 
        message: `${uploadedDocuments.length} Dokument(e) erfolgreich hochgeladen`,
        documents: uploadedDocuments 
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ 
        message: "Failed to upload documents",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  async function processSingleFileUpload(
    userId: string,
    file: Express.Multer.File,
    analysisResult: any,
    folderId: string | null,
    fileHash: string
  ) {
    const objectStorageService = new ObjectStorageService();

    // Upload file and thumbnail
    const { filePath, thumbnailPath } = await uploadFile(
      file.buffer,
      file.originalname,
      userId
    );

    // Set ACL policy on uploaded file (private, owner = userId)
    await objectStorageService.trySetObjectEntityAclPolicy(filePath, {
      owner: userId,
      visibility: "private",
    });

    // Set ACL policy on thumbnail if exists
    if (thumbnailPath) {
      await objectStorageService.trySetObjectEntityAclPolicy(thumbnailPath, {
        owner: userId,
        visibility: "private",
      });
    }

    // Smart payment status detection based on systemTags and category
    const tags = analysisResult.systemTags ?? [];
    const categoryWhitelist = [
      'Gesundheit & Arzt',
      'Wohnen & Immobilien',
      'Verträge & Abos',
      'Steuern & Buchhaltung',
      'Auto & Mobilität',
      'Schule & Ausbildung',
      'Familie & Kinder'
    ];
    
    let paymentStatus: 'paid' | 'unpaid' | 'not_applicable' = 'not_applicable';
    
    // Priority 1: Mahnung → always unpaid (highest priority)
    if (tags.includes('mahnung')) {
      paymentStatus = 'unpaid';
    }
    // Priority 2: Explicitly marked as paid
    else if (tags.includes('rechnung_bezahlt')) {
      paymentStatus = 'paid';
    }
    // Priority 3: Invoice tag → check if category is relevant
    else if (tags.includes('rechnung')) {
      if (categoryWhitelist.includes(analysisResult.category || '')) {
        paymentStatus = 'unpaid';
      } else {
        // Invoice in non-whitelisted category (e.g., "Einkäufe") → usually already paid
        paymentStatus = 'not_applicable';
      }
    }
    // Priority 4: Has amount but no invoice tag → check category
    else if (analysisResult.amount && analysisResult.amount > 0) {
      if (categoryWhitelist.includes(analysisResult.category || '')) {
        paymentStatus = 'unpaid';
      }
    }
    
    console.log(`[Payment Detection] Doc: "${analysisResult.title}", Category: "${analysisResult.category}", Tags: [${tags.join(', ')}], Status: ${paymentStatus}`);
    
    // Create document record in database
    const documentData = {
      userId,
      folderId,
      title: analysisResult.title,
      category: analysisResult.category,
      extractedText: (analysisResult.extractedText || '').replace(/\x00/g, ''),
      pageUrls: [filePath], // Single file = single page
      thumbnailUrl: thumbnailPath,
      mimeType: file.mimetype,
      confidence: analysisResult.confidence,
      isShared: false, // Default: private documents
      fileHash, // Store file hash for duplicate detection
      // Phase 2: Smart metadata
      extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
      amount: analysisResult.amount ?? null,
      sender: analysisResult.sender ?? null,
      // Phase 3: Smart folders & scenarios
      year: analysisResult.year ?? null,
      documentDate: analysisResult.documentDate ? new Date(analysisResult.documentDate) : null,
      systemTags: analysisResult.systemTags ?? [],
      // Payment tracking
      paymentStatus,
    };

    // Validate with Zod schema
    const validatedData = insertDocumentSchema.parse(documentData);
    const document = await storage.createDocument(validatedData);

    return document;
  }

  async function processMultiPageUpload(
    userId: string,
    files: Express.Multer.File[],
    analysisResult: any,
    folderId: string | null,
    res: any
  ) {
    const objectStorageService = new ObjectStorageService();
    const pageUrls: string[] = [];
    let thumbnailPath: string | null = null;

    // Upload each page separately
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { filePath, thumbnailPath: pageThumbnail } = await uploadFile(
        file.buffer,
        file.originalname,
        userId
      );

      // Set ACL policy on uploaded file (private, owner = userId)
      await objectStorageService.trySetObjectEntityAclPolicy(filePath, {
        owner: userId,
        visibility: "private",
      });

      pageUrls.push(filePath);

      // Use the first page's thumbnail as the document thumbnail
      if (i === 0 && pageThumbnail) {
        thumbnailPath = pageThumbnail;
        await objectStorageService.trySetObjectEntityAclPolicy(thumbnailPath, {
          owner: userId,
          visibility: "private",
        });
      }
    }

    // Smart payment status detection based on systemTags and category
    const tags = analysisResult.systemTags ?? [];
    const categoryWhitelist = [
      'Gesundheit & Arzt',
      'Wohnen & Immobilien',
      'Verträge & Abos',
      'Steuern & Buchhaltung',
      'Auto & Mobilität',
      'Schule & Ausbildung',
      'Familie & Kinder'
    ];
    
    let paymentStatus: 'paid' | 'unpaid' | 'not_applicable' = 'not_applicable';
    
    // Priority 1: Mahnung → always unpaid (highest priority)
    if (tags.includes('mahnung')) {
      paymentStatus = 'unpaid';
    }
    // Priority 2: Explicitly marked as paid
    else if (tags.includes('rechnung_bezahlt')) {
      paymentStatus = 'paid';
    }
    // Priority 3: Invoice tag → check if category is relevant
    else if (tags.includes('rechnung')) {
      if (categoryWhitelist.includes(analysisResult.category || '')) {
        paymentStatus = 'unpaid';
      } else {
        // Invoice in non-whitelisted category (e.g., "Einkäufe") → usually already paid
        paymentStatus = 'not_applicable';
      }
    }
    // Priority 4: Has amount but no invoice tag → check category
    else if (analysisResult.amount && analysisResult.amount > 0) {
      if (categoryWhitelist.includes(analysisResult.category || '')) {
        paymentStatus = 'unpaid';
      }
    }
    
    console.log(`[Payment Detection] Doc: "${analysisResult.title}", Category: "${analysisResult.category}", Tags: [${tags.join(', ')}], Status: ${paymentStatus}`);
    
    // Create document record in database
    const documentData = {
      userId,
      folderId, // Add folder assignment
      title: analysisResult.title,
      category: analysisResult.category,
      extractedText: (analysisResult.extractedText || '').replace(/\x00/g, ''),
      pageUrls,
      thumbnailUrl: thumbnailPath,
      mimeType: files[0].mimetype, // Store original MIME type
      confidence: analysisResult.confidence,
      isShared: false, // Default: private documents (user must manually share)
      // Phase 2: Smart metadata
      extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
      amount: analysisResult.amount ?? null,
      sender: analysisResult.sender ?? null,
      // Phase 3: Smart folders & scenarios
      year: analysisResult.year ?? null,
      documentDate: analysisResult.documentDate ? new Date(analysisResult.documentDate) : null,
      systemTags: analysisResult.systemTags ?? [],
      // Payment tracking
      paymentStatus,
    };

    // Validate with Zod schema
    const validatedData = insertDocumentSchema.parse(documentData);
    const document = await storage.createDocument(validatedData);

    // Increment upload counter (monthly limit tracking)
    await storage.incrementUploadCounter(userId, 1);

    res.json(document);
  }

  // Get storage statistics for authenticated user
  app.get('/api/storage/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Get effective user ID (supports shared access)
      const effectiveUserId = await getEffectiveUserId(userId);
      const stats = await storage.getUserStorageStats(effectiveUserId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      res.status(500).json({ message: "Failed to fetch storage stats" });
    }
  });

  // Get all documents for authenticated user with optional search/filter/sort/pagination
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { search, categories, sort, limit, cursor } = req.query;

      // IMPORTANT: Use userId directly, NOT effectiveUserId
      // Each user (Master/Slave) has their own document space
      // searchDocuments() internally handles showing shared partner documents
      
      // Parse categories from query string (comma-separated)
      const categoryArray = categories 
        ? (categories as string).split(',').filter(c => c.trim())
        : undefined;

      // Parse limit (default 50, max 100)
      const pageLimit = limit ? Math.min(parseInt(limit as string, 10), 100) : 50;

      const result = await storage.searchDocuments(
        userId, // Use real userId, not effectiveUserId
        search as string | undefined,
        categoryArray,
        sort as any,
        false, // includeOnlySharedFolders deprecated - now handled internally
        pageLimit,
        cursor as string | undefined
      );

      // Disable caching to ensure fresh data after privacy toggle
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Debug: Log what we're actually sending
      console.log('📤 Sending to frontend:', JSON.stringify(result.documents[0], null, 2));
      res.json(result);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get all unpaid invoices for authenticated user
  // NOTE: This route MUST be before /api/documents/:id to avoid "unpaid-invoices" being treated as an ID
  app.get('/api/documents/unpaid-invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unpaidInvoices = await storage.getUnpaidInvoices(userId);
      
      // Calculate total amount
      const totalAmount = unpaidInvoices.reduce((sum, doc) => sum + (doc.amount || 0), 0);
      
      res.json({
        invoices: unpaidInvoices,
        count: unpaidInvoices.length,
        totalAmount
      });
    } catch (error) {
      console.error("Error fetching unpaid invoices:", error);
      res.status(500).json({ message: "Failed to fetch unpaid invoices" });
    }
  });

  // Get single document
  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify user owns the document OR has access as partner (if shared)
      const partnerIds = await storage.getPartnerUserIds(userId);
      const hasAccess = document.userId === userId || 
                       (partnerIds.includes(document.userId) && document.isShared);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // View document in browser (inline display for iframe)
  app.get('/api/documents/:id/view', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify user owns the document OR has access as partner (if shared)
      const partnerIds = await storage.getPartnerUserIds(userId);
      const hasAccess = document.userId === userId || 
                       (partnerIds.includes(document.userId) && document.isShared);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Get the file URL (either from fileUrl or first pageUrl)
      const fileToServe = document.fileUrl || 
                         (document.pageUrls && document.pageUrls.length > 0 ? document.pageUrls[0] : null);
      
      if (!fileToServe) {
        return res.status(400).json({ message: "No file found" });
      }

      const objectFile = await objectStorageService.getObjectEntityFile(fileToServe);
      const buffer = await objectStorageService.getObjectBuffer(objectFile);
      
      const contentType = document.mimeType || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      
      // Add frame security headers for PDFs
      if (document.mimeType === 'application/pdf') {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
      }
      
      res.send(buffer);
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: "Failed to view document" });
    }
  });

  // Download document as PDF (combines all pages)
  app.get('/api/documents/:id/download-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify user owns the document OR has access as partner (if shared)
      const partnerIds = await storage.getPartnerUserIds(userId);
      const hasAccess = document.userId === userId || 
                       (partnerIds.includes(document.userId) && document.isShared);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectStorageService = new ObjectStorageService();
      const pageUrls = document.pageUrls && document.pageUrls.length > 0 
        ? document.pageUrls 
        : document.fileUrl 
          ? [document.fileUrl] 
          : [];

      if (pageUrls.length === 0) {
        return res.status(400).json({ message: "No pages found" });
      }

      // Check if document is already a PDF (via mimeType in DB or fileUrl)
      const isPdf = document.mimeType === 'application/pdf' || 
                    document.fileUrl?.toLowerCase().endsWith('.pdf');

      let pdfBuffer: Buffer;
      const fileName = `${document.title}.pdf`;

      if (isPdf && pageUrls.length === 1) {
        // Document is already a PDF - stream it directly
        const objectFile = await objectStorageService.getObjectEntityFile(pageUrls[0]);
        pdfBuffer = await objectStorageService.getObjectBuffer(objectFile);
      } else {
        // Document is images - convert to PDF
        const pages: PageBuffer[] = [];
        for (const pageUrl of pageUrls) {
          const objectFile = await objectStorageService.getObjectEntityFile(pageUrl);
          const buffer = await objectStorageService.getObjectBuffer(objectFile);
          
          // Determine MIME type from file extension or object metadata
          const extension = pageUrl.split('.').pop()?.toLowerCase();
          let mimeType = 'image/jpeg';
          if (extension === 'png') mimeType = 'image/png';
          else if (extension === 'webp') mimeType = 'image/webp';

          pages.push({ buffer, mimeType });
        }

        // Combine images to PDF
        pdfBuffer = await combineImagesToPDF(pages);
      }

      // Send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Get download URL (presigned URL with 1 hour expiry)
  app.get('/api/documents/:id/download-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify user owns the document OR has access as partner (if shared)
      const partnerIds = await storage.getPartnerUserIds(userId);
      const hasAccess = document.userId === userId || 
                       (partnerIds.includes(document.userId) && document.isShared);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Get the primary file URL (fileUrl or first page)
      const fileToDownload = document.fileUrl || 
                            (document.pageUrls && document.pageUrls.length > 0 ? document.pageUrls[0] : null);
      
      if (!fileToDownload) {
        return res.status(400).json({ message: "No file found" });
      }

      // Generate presigned URL with 1 hour expiry
      const downloadUrl = await objectStorageService.generatePresignedDownloadUrl(
        fileToDownload,
        3600 // 1 hour
      );

      res.json({ 
        url: downloadUrl,
        filename: `${document.title}.${document.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`,
        expiresIn: 3600
      });
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ message: "Failed to generate download URL" });
    }
  });

  // Get share URL (presigned URL with 7 days expiry)
  app.get('/api/documents/:id/share-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify user owns the document OR has access as partner (if shared)
      const partnerIds = await storage.getPartnerUserIds(userId);
      const hasAccess = document.userId === userId || 
                       (partnerIds.includes(document.userId) && document.isShared);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Get the primary file URL (fileUrl or first page)
      const fileToShare = document.fileUrl || 
                         (document.pageUrls && document.pageUrls.length > 0 ? document.pageUrls[0] : null);
      
      if (!fileToShare) {
        return res.status(400).json({ message: "No file found" });
      }

      // Generate presigned URL with 7 days expiry
      const shareUrl = await objectStorageService.generatePresignedDownloadUrl(
        fileToShare,
        604800 // 7 days (7 * 24 * 60 * 60)
      );

      res.json({ 
        url: shareUrl,
        filename: `${document.title}.${document.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`,
        expiresIn: 604800
      });
    } catch (error) {
      console.error("Error generating share URL:", error);
      res.status(500).json({ message: "Failed to generate share URL" });
    }
  });

  // Update document (category or metadata fields)
  app.patch('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { category, title, documentDate, amount, sender, systemTags } = req.body;

      // If category is being updated (backwards compatibility)
      if (category !== undefined) {
        const validCategories = [...DOCUMENT_CATEGORIES];
        if (!validCategories.includes(category)) {
          return res.status(400).json({ 
            message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
          });
        }
        const updated = await storage.updateDocumentCategory(id, userId, category);
        if (!updated) {
          return res.status(404).json({ message: "Document not found or access denied" });
        }
        return res.json(updated);
      }

      // Otherwise, update metadata fields (title, documentDate, amount, sender, systemTags)
      const updateData = { title, documentDate, amount, sender, systemTags };
      
      // Validate with Zod schema
      const result = updateDocumentSchema.safeParse(updateData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: result.error.errors 
        });
      }

      const updated = await storage.updateDocument(id, userId, result.data);

      if (!updated) {
        return res.status(404).json({ message: "Document not found or access denied" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Toggle document sharing
  app.patch('/api/documents/:id/sharing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { isShared } = req.body;

      if (typeof isShared !== 'boolean') {
        return res.status(400).json({ message: "isShared must be a boolean" });
      }

      // Verify document exists and user owns it (or has access to it as partner)
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user owns this document OR has access as partner
      const partnerIds = await storage.getPartnerUserIds(userId);
      const hasAccess = document.userId === userId || partnerIds.includes(document.userId);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Only owner can toggle sharing (partners can't change sharing status)
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Only document owner can toggle sharing" });
      }

      // Update sharing status
      const updated = await storage.updateDocumentSharing(id, userId, isShared);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update sharing" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating document sharing:", error);
      res.status(500).json({ message: "Failed to update sharing" });
    }
  });

  // Assign document to folder
  app.patch('/api/documents/:id/folder', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const { id } = req.params;
      const { folderId } = req.body;

      // folderId can be null to remove from folder
      if (folderId !== null && typeof folderId !== 'string') {
        return res.status(400).json({ message: "folderId must be a string or null" });
      }

      const updated = await storage.updateDocumentFolder(id, userId, folderId);

      if (!updated) {
        return res.status(404).json({ message: "Document not found or access denied" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating document folder:", error);
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  // Delete document (soft delete - moves to trash)
  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify document exists and user owns it
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Only document owner can delete (not partners, even if shared)
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Only document owner can delete" });
      }

      // Soft delete document (moves to trash)
      const deleted = await storage.deleteDocument(id, userId);

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete document" });
      }

      res.json({ message: "Document moved to trash" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Bulk delete documents (soft delete - moves to trash)
  app.post('/api/documents/bulk-delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No document IDs provided" });
      }

      const deletedCount = await storage.bulkDeleteDocuments(ids, userId);

      res.json({ 
        message: `${deletedCount} document(s) moved to trash`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Error bulk deleting documents:", error);
      res.status(500).json({ message: "Failed to delete documents" });
    }
  });

  // Get trashed documents
  app.get('/api/trash', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trashedDocuments = await storage.getTrashedDocuments(userId);
      res.json(trashedDocuments);
    } catch (error) {
      console.error("Error fetching trashed documents:", error);
      res.status(500).json({ message: "Failed to fetch trashed documents" });
    }
  });

  // Restore document from trash
  app.post('/api/documents/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const restored = await storage.restoreDocument(id, userId);

      if (!restored) {
        return res.status(404).json({ message: "Document not found in trash or access denied" });
      }

      res.json(restored);
    } catch (error) {
      console.error("Error restoring document:", error);
      res.status(500).json({ message: "Failed to restore document" });
    }
  });

  // Permanently delete ALL documents from trash (bulk delete)
  // IMPORTANT: This must come BEFORE /api/trash/:id to avoid matching "all" as an ID
  app.delete('/api/trash/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const deletedCount = await storage.permanentlyDeleteAllTrashedDocuments(userId);

      res.json({ 
        message: `${deletedCount} document(s) permanently deleted`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Error permanently deleting all trashed documents:", error);
      res.status(500).json({ message: "Failed to permanently delete documents" });
    }
  });

  // Permanently delete document from trash
  app.delete('/api/trash/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const deleted = await storage.permanentlyDeleteDocument(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Document not found in trash or access denied" });
      }

      res.json({ message: "Document permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting document:", error);
      res.status(500).json({ message: "Failed to permanently delete document" });
    }
  });

  // Payment tracking: Mark invoice as paid/unpaid
  app.patch('/api/documents/:id/payment-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['paid', 'unpaid', 'not_applicable'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // Verify document exists and user owns it
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Only document owner can update payment status
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Only document owner can update payment status" });
      }

      const updated = await storage.updateDocumentPaymentStatus(id, userId, status);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update payment status" });
      }

      // Send notification to partners if document is shared and status changed to "paid"
      if (status === 'paid' && document.isShared) {
        try {
          // Get current user info
          const currentUser = await storage.getUser(userId);
          const currentUserName = currentUser?.firstName || currentUser?.email || 'Ein Nutzer';
          
          // Get all partner user IDs (bidirectional)
          const partnerIds = await storage.getPartnerUserIds(userId);
          
          if (partnerIds.length > 0) {
            const { sendEmail, getInvoicePaidNotificationEmail } = await import('./emailService');
            
            for (const partnerId of partnerIds) {
              const partner = await storage.getUser(partnerId);
              if (partner?.email) {
                const partnerName = partner.firstName || '';
                const emailContent = getInvoicePaidNotificationEmail(
                  partnerName,
                  currentUserName,
                  document.title || 'Unbenannte Rechnung',
                  document.amount,
                  document.sender
                );
                
                await sendEmail({
                  to: partner.email,
                  subject: emailContent.subject,
                  html: emailContent.html,
                  text: emailContent.text,
                });
                
                console.log(`[PaymentStatus] Sent invoice-paid notification to partner: ${partner.email}`);
              }
            }
          }
        } catch (emailError) {
          // Don't fail the request if email sending fails
          console.error('[PaymentStatus] Failed to send partner notification:', emailError);
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Phase 2: Export functionality - download all documents as ZIP
  app.get('/api/documents/export/zip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocumentsByUserId(userId);

      if (documents.length === 0) {
        return res.status(404).json({ message: "No documents to export" });
      }

      const archiver = (await import('archiver')).default;
      const objectStorageService = new ObjectStorageService();

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="meinedokbox_export_${new Date().toISOString().split('T')[0]}.zip"`);

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      archive.pipe(res);

      // Add each document to the archive
      for (const doc of documents) {
        const pageUrls = doc.pageUrls && doc.pageUrls.length > 0 
          ? doc.pageUrls 
          : doc.fileUrl 
            ? [doc.fileUrl] 
            : [];

        for (let i = 0; i < pageUrls.length; i++) {
          try {
            const pageUrl = pageUrls[i];
            const objectFile = await objectStorageService.getObjectEntityFile(pageUrl);
            const fileBuffer = await objectStorageService.getObjectBuffer(objectFile);
            
            // Create safe filename with correct extension from MIME type
            const safeTitle = doc.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_');
            const mimeTypeToExt: Record<string, string> = {
              'application/pdf': 'pdf',
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
              'image/gif': 'gif',
            };
            const extension = doc.mimeType ? (mimeTypeToExt[doc.mimeType] || 'bin') : 'bin';
            const filename = pageUrls.length > 1 
              ? `${safeTitle}_page_${i + 1}.${extension}`
              : `${safeTitle}.${extension}`;
            
            archive.append(fileBuffer, { name: filename });
          } catch (error) {
            console.error(`Failed to add document ${doc.id} to archive:`, error);
          }
        }
      }

      await archive.finalize();
    } catch (error) {
      console.error("Error exporting documents:", error);
      res.status(500).json({ message: "Failed to export documents" });
    }
  });

  // Serve uploaded document files with ACL check
  app.get('/objects/:objectPath(*)', optionalAuth, async (req: any, res) => {
    try {
      const objectPath = `/objects/${req.params.objectPath}`;
      console.log('Serving object:', objectPath);
      const objectStorageService = new ObjectStorageService();

      // Get the object file
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      console.log('Object file found:', objectFile.name);

      // Get userId from session if authenticated
      const userId = req.user?.claims?.sub;
      console.log('User ID:', userId || 'unauthenticated');

      // Check ACL permissions
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      console.log('Can access:', canAccess);

      if (!canAccess) {
        console.log('Access denied for user:', userId);
        return res.status(403).json({ message: "Access denied" });
      }

      // Stream the file to the response
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        console.log('Object not found:', `/objects/${req.params.objectPath}`);
        return res.status(404).json({ message: "Object not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ message: "Failed to serve object" });
    }
  });

  // E-Mail Inbound Webhook (Public - no authentication)
  // Receives emails from Mailgun and processes attachments
  app.post('/api/webhook/email', upload.any(), async (req: any, res) => {
    try {
      // Verify Mailgun webhook signature
      const timestamp = req.body.timestamp || '';
      const token = req.body.token || '';
      const signature = req.body.signature || '';
      
      const isValid = verifyMailgunWebhook(timestamp, token, signature);
      
      if (!isValid) {
        console.error('[Email Webhook] Invalid signature - rejecting request');
        return res.status(403).json({ message: 'Invalid signature' });
      }
      
      const { from, subject, attachments } = parseMailgunWebhook(req.body, req.files);
      const rawRecipient = req.body.recipient || '';
      
      // Extract clean email addresses from formatted strings
      const cleanFrom = extractEmailAddress(from);
      const cleanRecipient = extractEmailAddress(rawRecipient);
      
      console.log('[Email Webhook] Processing email from:', cleanFrom, 'to:', cleanRecipient, 'attachments:', attachments.length);
      
      // Find user by inbound email address (case-insensitive)
      const [user] = await db.select().from(users).where(eq(users.inboundEmail, cleanRecipient)).limit(1);
      
      if (!user) {
        console.log('[Email Webhook] Unknown recipient:', cleanRecipient);
        return res.status(200).json({ message: 'Unknown recipient' });
      }
      
      // Import email service functions
      const { sendEmail, getDocumentProcessingFeedbackEmail, ProcessedDocument, DocumentProcessingResult } = await import('./emailService');
      
      // Check whitelist (security feature)
      const isWhitelisted = await storage.isEmailWhitelisted(user.id, cleanFrom);
      if (!isWhitelisted) {
        console.log('[Email Webhook] Sender not whitelisted:', cleanFrom, 'for user:', user.id);
        await db.insert(emailLogs).values({
          userId: user.id,
          fromAddress: cleanFrom,
          subject: subject || '',
          attachmentCount: attachments.length,
          processedCount: 0,
          status: 'error',
          errorMessage: 'Absender nicht in Whitelist - E-Mail blockiert'
        });
        
        // Send feedback email to sender
        try {
          const feedbackResult: DocumentProcessingResult = {
            senderEmail: cleanFrom,
            totalAttachments: attachments.length,
            processedCount: 0,
            documents: attachments.map(att => ({
              filename: att.filename,
              success: false,
              errorMessage: 'Absender nicht in Whitelist - bitte kontaktieren Sie den Dokumenten-Empfänger'
            }))
          };
          
          const feedbackEmail = getDocumentProcessingFeedbackEmail(feedbackResult);
          await sendEmail({
            to: cleanFrom,
            subject: feedbackEmail.subject,
            html: feedbackEmail.html,
            text: feedbackEmail.text
          });
          console.log('[Email Webhook] Sent whitelist error feedback to:', cleanFrom);
        } catch (emailError) {
          console.error('[Email Webhook] Failed to send feedback email:', emailError);
        }
        
        return res.status(200).json({ message: 'Sender not whitelisted' });
      }
      
      // Check account limits and status
      const limits = await storage.getUserLimits(user.id);
      let accountWarning: string | undefined;
      
      if (!limits.canUpload) {
        accountWarning = 'Ihr Monatslimit ist erreicht. Bitte upgraden Sie Ihren Plan.';
      } else if (limits.isReadOnly) {
        accountWarning = 'Ihr Account ist im Read-Only-Modus. Keine neuen Uploads möglich.';
      } else if (limits.isGracePeriod) {
        accountWarning = `Ihr Account ist in der Kulanzphase (noch ${limits.graceDaysRemaining} Tage).`;
      }
      
      // Create email log
      const [emailLog] = await db.insert(emailLogs).values({
        userId: user.id,
        fromAddress: cleanFrom,
        subject: subject || '',
        attachmentCount: attachments.length,
        processedCount: 0,
        status: 'pending'
      }).returning();
      
      // Track all documents with detailed results
      const processedDocuments: Array<{ filename: string; success: boolean; title?: string; category?: string; amount?: string; errorMessage?: string }> = [];
      
      let processedCount = 0;
      const errors: string[] = [];
      
      // Process each attachment with detailed error handling
      for (const attachment of attachments) {
        try {
          // Check file size
          if (attachment.size > 10 * 1024 * 1024) {
            processedDocuments.push({
              filename: attachment.filename,
              success: false,
              errorMessage: 'Datei zu groß (max. 10 MB)'
            });
            console.log('[Email Webhook] File too large:', attachment.filename);
            continue;
          }
          
          // Check if supported document
          if (!isValidDocumentAttachment(attachment.contentType, attachment.filename, attachment.size)) {
            const isImage = attachment.contentType.startsWith('image/');
            const isPDF = attachment.contentType === 'application/pdf';
            
            let reason = 'Nicht unterstütztes Format (nur PDF, JPG, PNG, WEBP)';
            if (isImage && attachment.size < 100 * 1024) {
              reason = `Datei zu klein (${Math.round(attachment.size / 1024)} KB, min. 100 KB für Bilder)`;
            }
            
            processedDocuments.push({
              filename: attachment.filename,
              success: false,
              errorMessage: reason
            });
            console.log('[Email Webhook] Invalid document:', attachment.filename, '-', reason);
            continue;
          }
          
          // Check if upload is allowed
          if (!limits.canUpload || limits.isReadOnly) {
            processedDocuments.push({
              filename: attachment.filename,
              success: false,
              errorMessage: limits.isReadOnly ? 'Account im Read-Only-Modus' : 'Monatslimit erreicht'
            });
            console.log('[Email Webhook] Upload not allowed for:', attachment.filename);
            continue;
          }
          
          console.log('[Email Webhook] Processing attachment:', attachment.filename);
          
          // Convert Buffer to File-like object for existing pipeline
          const fileData: Express.Multer.File = {
            fieldname: 'file',
            originalname: attachment.filename,
            encoding: '7bit',
            mimetype: attachment.contentType,
            buffer: attachment.content,
            size: attachment.size
          } as Express.Multer.File;
          
          // Analyze document using existing pipeline
          let analysisResult;
          try {
            if (attachment.contentType === 'application/pdf') {
              const extractedText = await extractTextFromPdf(attachment.content);
              analysisResult = await analyzeDocumentFromText(extractedText);
            } else {
              // For images, create ImageWithMimeType array
              analysisResult = await analyzeDocument([{
                base64: attachment.content.toString('base64'),
                mimeType: attachment.contentType
              }]);
            }
          } catch (aiError) {
            processedDocuments.push({
              filename: attachment.filename,
              success: false,
              errorMessage: 'KI-Analyse fehlgeschlagen - bitte später erneut versuchen'
            });
            console.error('[Email Webhook] AI analysis failed:', attachment.filename, aiError);
            errors.push(`${attachment.filename}: AI-Analyse fehlgeschlagen`);
            continue;
          }
          
          // Auto-rotate image if AI detected upside down orientation
          let fileBuffer = attachment.content;
          if (analysisResult.needsRotation && attachment.contentType.startsWith('image/')) {
            console.log('⟳ AI detected upside down document - auto-rotating 180°');
            try {
              fileBuffer = await sharp(attachment.content)
                .rotate(180)
                .toBuffer();
              console.log('  ✓ Rotated email attachment');
            } catch (error) {
              console.error('  ✗ Failed to rotate email attachment:', error);
            }
          }
          
          // Store file in object storage
          try {
            const { filePath, thumbnailPath } = await uploadFile(
              fileBuffer,
              attachment.filename,
              user.id
            );
            
            // Save to database
            await storage.createDocument({
              userId: user.id,
              title: analysisResult.title,
              category: analysisResult.category,
              extractedText: (analysisResult.extractedText || '').replace(/\x00/g, ''),
              fileUrl: filePath,
              thumbnailUrl: thumbnailPath,
              mimeType: attachment.contentType, // Store MIME type
              confidence: analysisResult.confidence,
              extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
              amount: analysisResult.amount,
              sender: analysisResult.sender,
              // Phase 3: Smart folders & scenarios
              year: analysisResult.year ?? null,
              documentDate: analysisResult.documentDate ? new Date(analysisResult.documentDate) : null,
              systemTags: analysisResult.systemTags ?? [],
            });

            // Increment upload counter (monthly limit tracking)
            await storage.incrementUploadCounter(user.id, 1);
            
            processedCount++;
            
            // Add to successful documents
            processedDocuments.push({
              filename: attachment.filename,
              success: true,
              title: analysisResult.title,
              category: analysisResult.category,
              amount: analysisResult.amount
            });
            
            console.log('[Email Webhook] Successfully processed:', attachment.filename);
          } catch (storageError) {
            processedDocuments.push({
              filename: attachment.filename,
              success: false,
              errorMessage: 'Speicherung fehlgeschlagen - bitte kontaktieren Sie den Support'
            });
            console.error('[Email Webhook] Storage failed:', attachment.filename, storageError);
            errors.push(`${attachment.filename}: Speicherung fehlgeschlagen`);
          }
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
          console.error('[Email Webhook] Failed to process attachment:', attachment.filename, errorMsg);
          processedDocuments.push({
            filename: attachment.filename,
            success: false,
            errorMessage: 'Verarbeitung fehlgeschlagen'
          });
          errors.push(`${attachment.filename}: ${errorMsg}`);
        }
      }
      
      // Update email log
      await db.update(emailLogs)
        .set({
          processedCount,
          status: processedCount > 0 ? 'success' : 'error',
          errorMessage: errors.length > 0 ? errors.join('; ') : null
        })
        .where(eq(emailLogs.id, emailLog.id));
      
      console.log('[Email Webhook] Completed. Processed:', processedCount, 'of', attachments.length);
      
      // Send feedback email to sender
      try {
        const feedbackResult: DocumentProcessingResult = {
          senderEmail: cleanFrom,
          totalAttachments: attachments.length,
          processedCount,
          documents: processedDocuments,
          accountWarning
        };
        
        const feedbackEmail = getDocumentProcessingFeedbackEmail(feedbackResult);
        await sendEmail({
          to: cleanFrom,
          subject: feedbackEmail.subject,
          html: feedbackEmail.html,
          text: feedbackEmail.text
        });
        console.log('[Email Webhook] Sent feedback email to:', cleanFrom);
      } catch (emailError) {
        console.error('[Email Webhook] Failed to send feedback email:', emailError);
      }
      
      res.status(200).json({
        message: `Processed ${processedCount} of ${attachments.length} attachments`,
        processed: processedCount,
        total: attachments.length
      });
      
    } catch (error) {
      console.error('[Email Webhook] Error processing email:', error);
      res.status(500).json({ 
        message: 'Failed to process email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Testing routes for trial notification emails (Development only)
  app.post('/api/test/send-trial-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailType } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: 'User not found or no email address' });
      }

      const { sendEmail, getDay7Email, getGraceStartEmail, getGraceLastDayEmail, getReadOnlyStartEmail } = await import('./emailService');
      
      let emailData: { subject: string; html: string; text: string };
      
      const userName = user.firstName || 'dort';
      
      switch (emailType) {
        case 'day_14':
          emailData = getDay7Email(userName);
          break;
        case 'grace_start':
          emailData = getGraceStartEmail(userName);
          break;
        case 'grace_last_day':
          emailData = getGraceLastDayEmail(userName);
          break;
        case 'readonly_start':
          emailData = getReadOnlyStartEmail(userName);
          break;
        default:
          return res.status(400).json({ message: 'Invalid email type. Use: day_14, grace_start, grace_last_day, or readonly_start' });
      }

      await sendEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      console.log(`[Test Email] Sent ${emailType} email to ${user.email}`);
      
      res.json({ 
        message: `Test email sent successfully to ${user.email}`,
        emailType,
        subject: emailData.subject
      });
    } catch (error) {
      console.error('[Test Email] Error:', error);
      res.status(500).json({ 
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual trigger for trial notification check (Development only)
  app.post('/api/test/trigger-trial-check', isAuthenticated, async (_req: any, res) => {
    try {
      const { checkAndSendTrialNotifications } = await import('./trialNotificationCron');
      await checkAndSendTrialNotifications();
      
      res.json({ 
        message: 'Trial notification check triggered successfully'
      });
    } catch (error) {
      console.error('[Test Trigger] Error:', error);
      res.status(500).json({ 
        message: 'Failed to trigger trial notification check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================
  // ADMIN ROUTES (service@meinedokbox.de only)
  // ============================================
  
  // Admin login endpoint - verify admin password
  app.post('/api/admin/login', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userEmail = user.email || user.claims?.email;
      
      // Check if user is the admin email
      if (userEmail?.toLowerCase() !== 'service@meinedokbox.de') {
        return res.status(403).json({ message: 'Nur Administratoren können sich hier anmelden.' });
      }
      
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Passwort erforderlich' });
      }
      
      // Check against environment variable
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Ungültiges Admin-Passwort' });
      }
      
      // Set admin authentication flag in session
      req.session.isAdminAuthenticated = true;
      
      // Save session to ensure flag is persisted
      req.session.save((err: any) => {
        if (err) {
          console.error('[Admin Login] Session save error:', err);
          return res.status(500).json({ message: 'Fehler beim Speichern der Session' });
        }
        
        res.json({ success: true, message: 'Admin-Authentifizierung erfolgreich' });
      });
    } catch (error) {
      console.error('[Admin Login] Error:', error);
      res.status(500).json({ message: 'Fehler bei der Admin-Authentifizierung' });
    }
  });
  
  // Check admin authentication status
  app.get('/api/admin/check', isAuthenticated, async (req: any, res) => {
    const user = req.user;
    const userEmail = user.email || user.claims?.email;
    
    const isAdminEmail = userEmail?.toLowerCase() === 'service@meinedokbox.de';
    const isAdminAuthenticated = req.session.isAdminAuthenticated === true;
    
    res.json({ 
      isAdminEmail,
      isAdminAuthenticated,
      requiresLogin: isAdminEmail && !isAdminAuthenticated
    });
  });
  
  // Admin logout - clear admin authentication flag
  app.post('/api/admin/logout', isAuthenticated, async (req: any, res) => {
    req.session.isAdminAuthenticated = false;
    req.session.save((err: any) => {
      if (err) {
        console.error('[Admin Logout] Session save error:', err);
        return res.status(500).json({ message: 'Fehler beim Speichern der Session' });
      }
      res.json({ success: true });
    });
  });
  
  // Get all users (Admin only)
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (_req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Calculate document counts and storage stats for each user
      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          const docs = await storage.getDocumentsByUserId(user.id);
          const stats = await storage.getUserStorageStats(user.id);
          
          return {
            ...user,
            documentCount: docs.length,
            storageUsed: stats.usedMB,
          };
        })
      );
      
      res.json(usersWithStats);
    } catch (error) {
      console.error('[Admin] Get all users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Delete user completely (Admin only)
  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      const adminUserId = req.user.claims?.sub || req.user.id;
      if (id === adminUserId) {
        return res.status(400).json({ message: 'Sie können Ihren eigenen Account nicht löschen.' });
      }
      
      const success = await storage.deleteUserCompletely(id);
      
      if (!success) {
        return res.status(404).json({ message: 'User nicht gefunden' });
      }
      
      console.log(`[Admin] User ${id} completely deleted by admin`);
      res.json({ message: 'User erfolgreich gelöscht' });
    } catch (error) {
      console.error('[Admin] Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Update user subscription plan (Admin only)
  app.post('/api/admin/users/:id/plan', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { plan } = req.body;
      
      // Validate plan
      const validPlans = ['trial', 'free', 'solo', 'family', 'family-plus'];
      if (!plan || !validPlans.includes(plan)) {
        return res.status(400).json({ 
          message: 'Ungültiger Plan. Gültige Werte: trial, free, solo, family, family-plus' 
        });
      }
      
      // Calculate expiry dates based on plan
      let trialEndsAt: Date | null = null;
      let subscriptionEndsAt: Date | null = null;
      
      if (plan === 'trial') {
        // Trial lasts 7 days
        trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        subscriptionEndsAt = null;
      } else if (plan === 'free') {
        // Free plan has no expiry
        trialEndsAt = null;
        subscriptionEndsAt = null;
      } else {
        // Paid plans (solo, family, family-plus) - set to 1 year from now
        trialEndsAt = null;
        subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
      
      // Update subscription using the storage method
      const updatedUser = await storage.updateUserSubscription(id, plan, subscriptionEndsAt);
      
      // Also update trial end date and reset upload counter separately
      await db.update(users)
        .set({
          trialEndsAt,
          uploadedThisMonth: 0,
          uploadCounterResetAt: new Date(),
        })
        .where(eq(users.id, id));
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User nicht gefunden' });
      }
      
      console.log(`[Admin] User ${id} plan changed to ${plan} by admin`);
      res.json({ 
        message: `Plan erfolgreich geändert zu ${plan}`,
        user: updatedUser 
      });
    } catch (error) {
      console.error('[Admin] Update user plan error:', error);
      res.status(500).json({ message: 'Fehler beim Ändern des Plans' });
    }
  });

  // ===== Smart Folders API Routes (Phase 3: Intelligent document organization) =====
  
  // Get all smart folders for user
  app.get("/api/smart-folders", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      let folders = await storage.getUserSmartFolders(userId);
      
      // Auto-migration: Create default smart folders for existing users if they have none
      if (folders.length === 0) {
        console.log(`[Auto-Migration] Creating default smart folders for user ${userId}`);
        await storage.createDefaultSmartFolders(userId);
        folders = await storage.getUserSmartFolders(userId);
      }
      
      res.json(folders);
    } catch (error) {
      console.error('[GetSmartFolders] Error:', error);
      res.status(500).json({ message: "Fehler beim Laden der Smart-Ordner" });
    }
  });
  
  // Get documents by smart folder (with optional year filter)
  app.get("/api/smart-folders/:id/documents", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const { id } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const userId = await getEffectiveUserId(req.user.claims.sub);
      
      const documents = await storage.getDocumentsBySmartFolder(userId, id, year);
      res.json(documents);
    } catch (error) {
      console.error('[GetSmartFolderDocuments] Error:', error);
      res.status(500).json({ message: "Fehler beim Laden der Dokumente" });
    }
  });
  
  // Export smart folder documents as ZIP
  app.get("/api/smart-folders/:id/documents/export", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const { id } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const userId = await getEffectiveUserId(req.user.claims.sub);
      
      // Get the smart folder to get its name
      const smartFolders = await storage.getUserSmartFolders(userId);
      const folder = smartFolders.find(f => f.id === id);
      
      if (!folder) {
        return res.status(404).json({ message: "Smart-Ordner nicht gefunden" });
      }
      
      // Get documents for this smart folder
      const documents = await storage.getDocumentsBySmartFolder(userId, id, year);
      
      if (documents.length === 0) {
        return res.status(404).json({ message: "Keine Dokumente zum Exportieren" });
      }
      
      const archiver = (await import('archiver')).default;
      const objectStorageService = new ObjectStorageService();
      
      // Create safe folder name for the ZIP file
      const safeFolderName = folder.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_');
      const filename = year 
        ? `${safeFolderName}_${year}.zip`
        : `${safeFolderName}.zip`;
      
      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Create ZIP archive with same settings as working export
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      // Handle archive errors
      archive.on('error', (err) => {
        console.error('[SmartFolderExport] Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Fehler beim Erstellen des Archivs" });
        }
      });
      
      archive.pipe(res);
      
      // Add each document to the archive
      for (const doc of documents) {
        const pageUrls = doc.pageUrls && doc.pageUrls.length > 0 
          ? doc.pageUrls 
          : doc.fileUrl 
            ? [doc.fileUrl] 
            : [];
        
        for (let i = 0; i < pageUrls.length; i++) {
          try {
            const pageUrl = pageUrls[i];
            const objectFile = await objectStorageService.getObjectEntityFile(pageUrl);
            const fileBuffer = await objectStorageService.getObjectBuffer(objectFile);
            
            // Create safe filename with correct extension from MIME type
            const safeTitle = (doc.title || 'Dokument').replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_');
            const mimeTypeToExt: Record<string, string> = {
              'application/pdf': 'pdf',
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
              'image/gif': 'gif',
            };
            const extension = doc.mimeType ? (mimeTypeToExt[doc.mimeType] || 'bin') : 'bin';
            const docFilename = pageUrls.length > 1 
              ? `${safeTitle}_page_${i + 1}.${extension}`
              : `${safeTitle}.${extension}`;
            
            archive.append(fileBuffer, { name: docFilename });
          } catch (error) {
            console.error(`[SmartFolderExport] Failed to add document ${doc.id} to archive:`, error);
          }
        }
      }
      
      await archive.finalize();
      console.log(`[SmartFolderExport] Successfully exported ${documents.length} documents for folder: ${folder.name}`);
    } catch (error) {
      console.error('[SmartFolderExport] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Fehler beim Exportieren der Dokumente" });
      }
    }
  });
  
  // Create custom smart folder
  app.post("/api/smart-folders", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const { name, icon, filters, downloadEnabled, sortOrder } = req.body;
      
      const folder = await storage.createSmartFolder({
        userId,
        name,
        icon: icon || "📁",
        isSystem: false,
        filters: filters || {},
        downloadEnabled: downloadEnabled ?? true,
        sortOrder: sortOrder ?? 999,
      });
      
      res.json(folder);
    } catch (error) {
      console.error('[CreateSmartFolder] Error:', error);
      res.status(500).json({ message: "Fehler beim Erstellen des Smart-Ordners" });
    }
  });
  
  // Update smart folder
  app.patch("/api/smart-folders/:id", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = await getEffectiveUserId(req.user.claims.sub);
      const { name, icon, filters, downloadEnabled, sortOrder } = req.body;
      
      const updated = await storage.updateSmartFolder(id, userId, {
        name,
        icon,
        filters,
        downloadEnabled,
        sortOrder,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Smart-Ordner nicht gefunden" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('[UpdateSmartFolder] Error:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Smart-Ordners" });
    }
  });
  
  // Delete smart folder
  app.delete("/api/smart-folders/:id", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = await getEffectiveUserId(req.user.claims.sub);
      
      const folder = await storage.getSmartFolder(id);
      if (folder?.isSystem) {
        return res.status(400).json({ message: "System-Ordner können nicht gelöscht werden" });
      }
      
      const deleted = await storage.deleteSmartFolder(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Smart-Ordner nicht gefunden" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('[DeleteSmartFolder] Error:', error);
      res.status(500).json({ message: "Fehler beim Löschen des Smart-Ordners" });
    }
  });

  // ============================================================================
  // STRIPE PAYMENT ROUTES
  // ============================================================================

  // Create Stripe Checkout Session for subscription
  app.post("/api/stripe/create-checkout-session", isAuthenticatedLocal, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { plan, period }: { plan: "solo" | "family" | "family-plus"; period: "monthly" | "yearly" } = req.body;
    let priceId: string | undefined;

    try {
      if (!plan || !period) {
        return res.status(400).json({ message: "Plan und Zahlungsperiode erforderlich" });
      }

      // Get dynamic price IDs (from env vars or fallback to defaults)
      const stripePriceIds = getStripePriceIds();
      
      if (!stripePriceIds[plan]?.[period]) {
        return res.status(400).json({ message: "Ungültiger Plan oder Zahlungsperiode" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }

      priceId = stripePriceIds[plan][period];

      // Create or retrieve Stripe customer
      // Handle case where customer was created in test mode but we're now in live mode
      let customerId = user.stripeCustomerId;
      
      if (customerId) {
        // Verify the customer exists in current Stripe mode (test vs live)
        try {
          await stripe.customers.retrieve(customerId);
          console.log('[CreateCheckoutSession] Existing customer verified:', customerId);
        } catch (verifyError: any) {
          if (verifyError?.code === 'resource_missing') {
            // Customer doesn't exist in current mode - need to create new one
            console.log('[CreateCheckoutSession] Customer not found in current Stripe mode, creating new customer');
            customerId = null;
          } else {
            throw verifyError;
          }
        }
      }
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
        console.log('[CreateCheckoutSession] New customer created:', customerId);
      }

      // Create Checkout Session
      // Note: Prices already include 19% German VAT (inkl. MwSt.)
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card", "paypal"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.get("host")}/checkout/erfolg?plan=${plan}&period=${period}`,
        cancel_url: `${req.protocol}://${req.get("host")}/dashboard?checkout=cancel`,
        metadata: {
          userId: user.id,
          plan,
          period,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            plan,
            period,
          },
        },
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true, // Allow customers to enter VAT ID for B2B
        },
      };

      console.log('[CreateCheckoutSession] Creating session with config:', {
        customerId,
        plan,
        period,
        priceId,
        mode: sessionConfig.mode,
      });

      const session = await stripe.checkout.sessions.create(sessionConfig);
      
      console.log('[CreateCheckoutSession] Session created successfully:', {
        sessionId: session.id,
        url: session.url,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      // Enhanced error logging with full Stripe error details
      console.error('[CreateCheckoutSession] ========== STRIPE ERROR ==========');
      console.error('[CreateCheckoutSession] Full error object:', JSON.stringify(error, null, 2));
      console.error('[CreateCheckoutSession] Error message:', error?.message);
      console.error('[CreateCheckoutSession] Error type:', error?.type);
      console.error('[CreateCheckoutSession] Error code:', error?.code);
      console.error('[CreateCheckoutSession] Error stack:', error?.stack);
      console.error('[CreateCheckoutSession] Request details:', {
        plan,
        period,
        priceId,
        userId: req.user.claims.sub,
      });
      console.error('[CreateCheckoutSession] ================================');
      
      // Provide detailed error information for debugging
      const errorMessage = error?.message || "Unbekannter Fehler";
      const errorType = error?.type || "unknown";
      const errorCode = error?.code || "unknown";

      // Return more specific error to frontend
      let userMessage = "Fehler beim Erstellen der Checkout-Session";
      if (errorMessage.includes("tax")) {
        userMessage = "Stripe Tax ist nicht aktiviert. Bitte kontaktieren Sie den Support.";
      } else if (errorMessage.includes("price")) {
        userMessage = "Ungültige Preis-ID. Bitte kontaktieren Sie den Support.";
      } else if (errorMessage.includes("customer")) {
        userMessage = "Fehler beim Erstellen des Kundenkontos. Bitte versuchen Sie es erneut.";
      } else if (errorCode === "resource_missing") {
        userMessage = "Die angeforderte Ressource wurde nicht gefunden. Bitte kontaktieren Sie den Support.";
      }

      res.status(500).json({ 
        message: userMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  // Create Stripe Customer Portal Session (for managing subscriptions)
  app.post("/api/stripe/create-portal-session", isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "Kein Stripe-Kunde gefunden" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get("host")}/settings`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('[CreatePortalSession] Error:', error);
      res.status(500).json({ message: "Fehler beim Öffnen des Kundenportals" });
    }
  });

  // Stripe Webhook Handler
  // Note: Raw body middleware is registered in index.ts BEFORE express.json()
  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error('[StripeWebhook] Missing signature');
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;

    try {
      // In production, you should set STRIPE_WEBHOOK_SECRET from Stripe Dashboard
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // For testing without webhook secret
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error('[StripeWebhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[StripeWebhook] Event received: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan as "solo" | "family" | "family-plus";
          const period = session.metadata?.period as "monthly" | "yearly";
          
          if (userId && session.subscription) {
            const subscriptionId = session.subscription as string;
            await storage.updateUserStripeInfo(userId, {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: session.line_items?.data[0]?.price?.id,
            });
            
            // Update subscription plan
            if (plan) {
              await storage.updateUserSubscription(userId, plan, null);
            }
            
            // Send admin notification about new subscription (async, non-blocking)
            const user = await storage.getUserById(userId);
            if (user && plan && period) {
              const amount = session.amount_total || 0;
              sendAdminNewSubscriptionNotification(
                user.email,
                `${user.firstName} ${user.lastName}`,
                plan,
                period,
                amount
              ).catch(err => console.error('[StripeWebhook] Failed to send admin notification:', err));
              console.log(`[StripeWebhook] Admin notification sent for subscription: ${user.email} - ${plan} (${period})`);
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          const plan = subscription.metadata?.plan as "solo" | "family" | "family-plus";

          if (userId) {
            // Check subscription status
            if (subscription.status === "active" && plan) {
              await storage.updateUserSubscription(userId, plan, null);
            } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
              // Downgrade to free plan when subscription ends
              await storage.updateUserSubscription(userId, "free", null);
            }

            await storage.updateUserStripeInfo(userId, {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Downgrade to free plan
            await storage.updateUserSubscription(userId, "free", null);
            await storage.updateUserStripeInfo(userId, {
              stripeSubscriptionId: null,
              stripePriceId: null,
            });
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`[StripeWebhook] Payment succeeded for invoice ${invoice.id}`);
          // Payment successful - subscription will remain active
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`[StripeWebhook] Payment failed for invoice ${invoice.id}`);
          // Stripe will automatically retry failed payments
          // You could send a notification email to the user here
          break;
        }

        default:
          console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[StripeWebhook] Error processing event:', error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  // ===== User Notification Settings =====
  
  // Update user notification preferences
  app.patch("/api/user/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notifyNewFeatures } = req.body;
      
      if (typeof notifyNewFeatures !== 'boolean') {
        return res.status(400).json({ message: "notifyNewFeatures muss ein Boolean sein" });
      }
      
      const user = await storage.updateUserNotifications(userId, notifyNewFeatures);
      
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      console.log(`[UserSettings] Updated notifications for user ${userId}: notifyNewFeatures=${notifyNewFeatures}`);
      res.json({ success: true, notifyNewFeatures: user.notifyNewFeatures });
    } catch (error) {
      console.error('[UserSettings] Error updating notifications:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Einstellungen" });
    }
  });

  // ===== Feature Requests API (Community Board) =====
  
  // Get published feature requests (public)
  app.get("/api/feature-requests", async (_req, res) => {
    try {
      const requests = await storage.getPublishedFeatureRequests();
      res.json(requests);
    } catch (error) {
      console.error('[FeatureRequests] Error fetching:', error);
      res.status(500).json({ message: "Fehler beim Laden der Feature-Anfragen" });
    }
  });
  
  // Create new feature request (authenticated users)
  app.post("/api/feature-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: "Titel und Beschreibung sind erforderlich" });
      }
      
      const request = await storage.createFeatureRequest({
        userId,
        title,
        description,
        status: "pending",
        isPublished: false, // Requires admin approval
      });
      
      console.log(`[FeatureRequests] User ${userId} created request: ${request.id}`);
      res.json(request);
    } catch (error) {
      console.error('[FeatureRequests] Error creating:', error);
      res.status(500).json({ message: "Fehler beim Erstellen der Feature-Anfrage" });
    }
  });
  
  // Vote for a feature request (authenticated users)
  app.post("/api/feature-requests/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const vote = await storage.voteForFeatureRequest(id, userId);
      
      if (vote) {
        res.json({ success: true, vote });
      } else {
        res.status(404).json({ message: "Feature-Anfrage nicht gefunden" });
      }
    } catch (error) {
      console.error('[FeatureRequests] Error voting:', error);
      res.status(500).json({ message: "Fehler beim Abstimmen" });
    }
  });
  
  // Remove vote from a feature request (authenticated users)
  app.delete("/api/feature-requests/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const success = await storage.removeVoteFromFeatureRequest(id, userId);
      res.json({ success });
    } catch (error) {
      console.error('[FeatureRequests] Error removing vote:', error);
      res.status(500).json({ message: "Fehler beim Entfernen der Stimme" });
    }
  });
  
  // Get user's votes (authenticated users)
  app.get("/api/my-votes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const votes = await storage.getUserVotes(userId);
      res.json(votes);
    } catch (error) {
      console.error('[FeatureRequests] Error getting user votes:', error);
      res.status(500).json({ message: "Fehler beim Laden der Stimmen" });
    }
  });
  
  // Admin: Get all feature requests
  app.get("/api/admin/feature-requests", isAuthenticated, isAdmin, async (_req: any, res) => {
    try {
      const requests = await storage.getAllFeatureRequests();
      res.json(requests);
    } catch (error) {
      console.error('[Admin] Error fetching feature requests:', error);
      res.status(500).json({ message: "Fehler beim Laden der Feature-Anfragen" });
    }
  });
  
  // Admin: Update/approve feature request
  app.patch("/api/admin/feature-requests/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, description, status, isPublished, adminNote, baseVotes } = req.body;
      
      console.log(`[Admin] Updating feature request ${id} with:`, { title, description, status, isPublished, adminNote, baseVotes });
      
      // Check if this update is publishing the feature request for the first time
      const existingRequest = await storage.getFeatureRequestById(id);
      const isNewlyPublished = existingRequest && !existingRequest.isPublished && isPublished === true;
      
      const updated = await storage.updateFeatureRequest(id, {
        title,
        description,
        status,
        isPublished,
        adminNote,
        baseVotes,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Feature-Anfrage nicht gefunden" });
      }
      
      // Send notifications to users who opted in for new feature notifications
      if (isNewlyPublished) {
        try {
          const { sendEmail, getNewFeaturePublishedEmail } = await import('./emailService');
          const usersToNotify = await storage.getUsersWithFeatureNotifications();
          
          const featureTitle = updated.title;
          
          for (const user of usersToNotify) {
            // Don't notify the user who created the feature request
            if (user.id === updated.userId) continue;
            
            try {
              const emailContent = getNewFeaturePublishedEmail(user.firstName, featureTitle);
              await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              });
              console.log(`[FeatureNotification] Sent notification to: ${user.email}`);
            } catch (emailError) {
              console.error(`[FeatureNotification] Failed to notify ${user.email}:`, emailError);
            }
          }
          
          console.log(`[FeatureNotification] Notified ${usersToNotify.length} users about new feature: ${featureTitle}`);
        } catch (notificationError) {
          console.error('[FeatureNotification] Error sending notifications:', notificationError);
          // Don't fail the request if notification fails
        }
      }
      
      console.log(`[Admin] Updated feature request: ${id}`);
      res.json(updated);
    } catch (error) {
      console.error('[Admin] Error updating feature request:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Feature-Anfrage" });
    }
  });
  
  // Admin: Delete feature request
  app.delete("/api/admin/feature-requests/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteFeatureRequest(id);
      
      if (!success) {
        return res.status(404).json({ message: "Feature-Anfrage nicht gefunden" });
      }
      
      console.log(`[Admin] Deleted feature request: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error('[Admin] Error deleting feature request:', error);
      res.status(500).json({ message: "Fehler beim Löschen der Feature-Anfrage" });
    }
  });
  
  // ===== Video Tutorials API =====
  
  // Get published video tutorials (public)
  app.get("/api/video-tutorials", async (_req, res) => {
    try {
      const tutorials = await storage.getPublishedVideoTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error('[VideoTutorials] Error fetching:', error);
      res.status(500).json({ message: "Fehler beim Laden der Video-Tutorials" });
    }
  });
  
  // Admin: Get all video tutorials
  app.get("/api/admin/video-tutorials", isAuthenticated, isAdmin, async (_req: any, res) => {
    try {
      const tutorials = await storage.getAllVideoTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error('[Admin] Error fetching video tutorials:', error);
      res.status(500).json({ message: "Fehler beim Laden der Video-Tutorials" });
    }
  });
  
  // Admin: Create video tutorial
  app.post("/api/admin/video-tutorials", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { title, description, videoUrl, thumbnailUrl, category, sortOrder, isPublished } = req.body;
      
      if (!title || !videoUrl || !category) {
        return res.status(400).json({ message: "Titel, Video-URL und Kategorie sind erforderlich" });
      }
      
      const tutorial = await storage.createVideoTutorial({
        title,
        description,
        videoUrl,
        thumbnailUrl,
        category,
        sortOrder: sortOrder ?? 0,
        isPublished: isPublished ?? true,
      });
      
      console.log(`[Admin] Created video tutorial: ${tutorial.id}`);
      res.json(tutorial);
    } catch (error) {
      console.error('[Admin] Error creating video tutorial:', error);
      res.status(500).json({ message: "Fehler beim Erstellen des Video-Tutorials" });
    }
  });
  
  // Admin: Update video tutorial
  app.patch("/api/admin/video-tutorials/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, description, videoUrl, thumbnailUrl, category, sortOrder, isPublished } = req.body;
      
      const updated = await storage.updateVideoTutorial(id, {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        category,
        sortOrder,
        isPublished,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Video-Tutorial nicht gefunden" });
      }
      
      console.log(`[Admin] Updated video tutorial: ${id}`);
      res.json(updated);
    } catch (error) {
      console.error('[Admin] Error updating video tutorial:', error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Video-Tutorials" });
    }
  });
  
  // Admin: Delete video tutorial
  app.delete("/api/admin/video-tutorials/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteVideoTutorial(id);
      
      if (!success) {
        return res.status(404).json({ message: "Video-Tutorial nicht gefunden" });
      }
      
      console.log(`[Admin] Deleted video tutorial: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error('[Admin] Error deleting video tutorial:', error);
      res.status(500).json({ message: "Fehler beim Löschen des Video-Tutorials" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
