import type { Express } from "express";
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
import { insertDocumentSchema, DOCUMENT_CATEGORIES, PLAN_LIMITS } from "@shared/schema";
import { combineImagesToPDF, type PageBuffer } from "./lib/pdfGenerator";
import { parseMailgunWebhook, isSupportedAttachment, isEmailWhitelisted, verifyMailgunWebhook, extractEmailAddress } from "./lib/emailInbound";
import { sendSharedAccessInvitation, sendVerificationEmail } from "./lib/sendEmail";
import bcrypt from 'bcrypt';
import { checkDocumentLimit, checkEmailFeature, checkAndDowngradeTrial, getEffectiveUserId, isSharedUser } from "./middleware/subscriptionLimits";
import { db } from "./db";
import { users, emailLogs, sharedAccess } from "@shared/schema";
import { eq } from "drizzle-orm";

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

  // Email/Password Authentication Routes
  
  // Register with email and password (DSGVO-compliant with double opt-in)
  app.post('/api/auth/register', async (req, res) => {
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
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        inboundEmail, // Add unique email address for forwarding documents
      });

      // Add user's own email to whitelist (allows forwarding from their own address)
      await storage.addEmailToWhitelist(userId, normalizedEmail);
      console.log(`[Register] Added ${normalizedEmail} to whitelist for user ${userId}`);

      // Send verification email
      const { sendVerificationEmail } = await import('./lib/sendEmail');
      const emailSent = await sendVerificationEmail(normalizedEmail, firstName, verificationToken);

      if (!emailSent) {
        console.error(`[Register] Failed to send verification email to ${normalizedEmail}`);
        // Don't fail registration if email sending fails
      }

      res.json({ 
        message: "Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse.",
        emailSent 
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
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Ungültiger Verifizierungslink" });
      }

      // Find user with this verification token
      const [user] = await db.select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Verifizierungslink" });
      }

      // Check if token is expired
      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Verifizierungslink ist abgelaufen. Bitte registrieren Sie sich erneut." });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.json({ message: "E-Mail-Adresse wurde bereits bestätigt", alreadyVerified: true });
      }

      // Verify user and clear token
      await db.update(users)
        .set({
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      console.log(`[Verify Email] User ${user.email} verified successfully`);

      res.json({ message: "E-Mail-Adresse erfolgreich bestätigt. Sie können sich jetzt anmelden." });
    } catch (error) {
      console.error("Error during email verification:", error);
      res.status(500).json({ message: "Verifizierung fehlgeschlagen" });
    }
  });

  // Login with email and password
  app.post('/api/auth/login', (req, res, next) => {
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
  app.post('/api/auth/resend-verification', async (req, res) => {
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

      // Send new verification email
      const { sendVerificationEmail } = await import('./lib/sendEmail');
      const emailSent = await sendVerificationEmail(normalizedEmail, user.firstName, verificationToken);

      if (!emailSent) {
        console.error(`[ResendVerification] Failed to send email to ${normalizedEmail}`);
        return res.status(500).json({ message: "E-Mail konnte nicht gesendet werden" });
      }

      console.log(`[ResendVerification] New verification email sent to ${normalizedEmail}`);
      
      res.json({ message: "Eine neue Bestätigungs-E-Mail wurde gesendet. Bitte prüfen Sie Ihr Postfach (auch Spam-Ordner)." });
    } catch (error) {
      console.error('[ResendVerification] Error:', error);
      res.status(500).json({ message: "Fehler beim Senden der Bestätigungs-E-Mail" });
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
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { PLAN_LIMITS } = await import('@shared/schema');
      const { getTrialStatus } = await import('./middleware/subscriptionLimits');
      
      const plan = user.subscriptionPlan as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[plan];

      // Calculate trial status with grace period
      let daysRemaining = null;
      let gracePeriod = false;
      let isReadOnly = false;
      let graceDaysRemaining = 0;
      
      if (user.subscriptionPlan === 'trial' && user.trialEndsAt) {
        const trialStatus = getTrialStatus(user.trialEndsAt);
        daysRemaining = trialStatus.daysRemaining;
        gracePeriod = trialStatus.status === 'grace_period';
        isReadOnly = trialStatus.status === 'expired';
        graceDaysRemaining = trialStatus.graceDaysRemaining;
      }

      // Count current documents
      const documents = await storage.getDocumentsByUserId(userId);
      const documentCount = documents.length;

      // isUploadDisabled combines all upload restrictions
      const isUploadDisabled = !limits.canUpload || gracePeriod || isReadOnly;

      res.json({
        plan: user.subscriptionPlan,
        displayName: limits.displayName,
        maxDocuments: limits.maxDocuments,
        currentDocuments: documentCount,
        canUseEmailInbound: limits.canUseEmailInbound,
        canUpload: limits.canUpload,
        isUploadDisabled,
        trialEndsAt: user.trialEndsAt,
        daysRemaining,
        gracePeriod,
        isReadOnly,
        graceDaysRemaining,
        subscriptionEndsAt: user.subscriptionEndsAt,
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
  app.post('/api/shared-access/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "E-Mail-Adresse erforderlich" });
      }

      const normalizedEmail = email.toLowerCase();

      // Check if user is Premium or Trial
      const user = await storage.getUser(userId);
      if (!user || (user.subscriptionPlan !== 'premium' && user.subscriptionPlan !== 'trial')) {
        return res.status(403).json({ message: "Diese Funktion ist nur für Premium- und Trial-Nutzer verfügbar" });
      }

      // Get subscription plan limits
      const planLimits = PLAN_LIMITS[user.subscriptionPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
      
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
          
          console.log(`[Invite] Sending reactivation email to ${normalizedEmail} with token ${invitationToken}`);
          const emailSent = await sendSharedAccessInvitation(normalizedEmail, ownerName, invitationToken);
          
          if (!emailSent) {
            console.warn("[Invite] ⚠️ Failed to send reactivation email");
          } else {
            console.log("[Invite] ✅ Reactivation email sent successfully");
          }
          
          // Get updated invitation
          const updatedInvitation = await db.select()
            .from(sharedAccess)
            .where(eq(sharedAccess.id, existingInvitation.id))
            .limit(1);
          
          return res.json({
            message: "Einladung reaktiviert und erneut gesendet",
            sharedAccess: updatedInvitation[0],
            emailSent,
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
      
      console.log(`[Invite] Sending invitation email to ${normalizedEmail} from ${ownerName} with token ${invitationToken}`);
      const emailSent = await sendSharedAccessInvitation(normalizedEmail, ownerName, invitationToken);
      
      if (!emailSent) {
        console.warn("[Invite] ⚠️ Failed to send invitation email, but invitation was created");
      } else {
        console.log("[Invite] ✅ Invitation email sent successfully");
      }

      res.json({
        message: "Einladung gesendet",
        sharedAccess: sharedAccessData,
        emailSent,
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
      
      // Send new invitation email
      console.log(`[Resend Invite] Sending new invitation to ${updatedAccess.sharedWithEmail}`);
      const emailSent = await sendSharedAccessInvitation(
        updatedAccess.sharedWithEmail, 
        ownerName,
        updatedAccess.invitationToken!
      );
      
      if (!emailSent) {
        console.warn("[Resend Invite] ⚠️ Failed to send invitation email");
      }
      
      res.json({
        message: "Einladung erneut gesendet",
        sharedAccess: updatedAccess,
        emailSent,
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
        const slaveDocuments = await storage.getDocuments(access.sharedWithUserId);
        
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
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create user with invited email
      const newUser = await storage.upsertUser({
        id: `local_${crypto.randomBytes(16).toString('hex')}`,
        email: invitedEmail,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        subscriptionPlan: 'free', // Invited users start with free plan
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
      });
      
      // Link invitation to new user
      await storage.acceptSharedInvitationByToken(token, newUser.id);
      
      // Send email verification
      const verificationSent = await sendVerificationEmail(invitedEmail, firstName, verificationToken);
      
      console.log(`[Invite Register] Created new user ${newUser.id} for invited email ${invitedEmail}`);
      
      res.json({
        message: "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.",
        emailSent: verificationSent,
        userId: newUser.id,
      });
    } catch (error) {
      console.error("Error registering with invitation:", error);
      res.status(500).json({ message: "Fehler bei der Registrierung" });
    }
  });

  // Folders API routes
  
  // Get all folders for user
  app.get('/api/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const effectiveUserId = await getEffectiveUserId(userId);
      let folders = await storage.getUserFolders(effectiveUserId);
      
      // Auto-migration: Create default folders for existing users if they have none
      if (folders.length === 0) {
        console.log(`[Auto-Migration] Creating default folders for user ${effectiveUserId}`);
        await storage.createDefaultFolders(effectiveUserId);
        folders = await storage.getUserFolders(effectiveUserId);
      }
      
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

  // Document upload endpoint - supports single or multiple files
  app.post('/api/documents/upload', isAuthenticated, checkDocumentLimit, upload.array('files', 20), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      const folderId = req.body.folderId || null; // Optional folder assignment

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const firstFile = files[0];
      const isPdf = firstFile.mimetype === 'application/pdf';

      console.log(`Processing ${files.length} file(s) as ${isPdf ? 'PDF' : 'image'} document${folderId ? ` into folder ${folderId}` : ''}`);

      let analysisResult;

      if (isPdf) {
        // Handle PDF: Extract text and analyze
        if (files.length > 1) {
          return res.status(400).json({ 
            message: "Bitte laden Sie nur eine PDF-Datei gleichzeitig hoch."
          });
        }

        const extractedText = await extractTextFromPdf(firstFile.buffer);
        console.log(`Extracted ${extractedText.length} characters from PDF`);
        
        // If PDF text extraction yielded too little text (< 50 chars), 
        // it's likely a scanned document - convert to images and use Vision API
        if (extractedText.length < 50) {
          console.log('PDF has insufficient text, converting to images for Vision API OCR');
          const pdfImages = await convertPdfToImages(firstFile.buffer);
          const imagesForAnalysis = pdfImages.map(img => ({
            base64: img.base64,
            mimeType: img.mimeType,
          }));
          analysisResult = await analyzeDocument(imagesForAnalysis);
        } else {
          analysisResult = await analyzeDocumentFromText(extractedText);
        }
      } else {
        // Handle images: Use Vision API
        const imagesForAnalysis = files.map(file => ({
          base64: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        }));
        analysisResult = await analyzeDocument(imagesForAnalysis);
      }
      
      // Upload files (images as pages, PDF as single file)
      await processMultiPageUpload(userId, files, analysisResult, folderId, res);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Failed to upload document",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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

    // Create document record in database
    const documentData = {
      userId,
      folderId, // Add folder assignment
      title: analysisResult.title,
      category: analysisResult.category,
      extractedText: analysisResult.extractedText,
      pageUrls,
      thumbnailUrl: thumbnailPath,
      mimeType: files[0].mimetype, // Store original MIME type
      confidence: analysisResult.confidence,
      isShared: false, // Default: private documents (user must manually share)
      // Phase 2: Smart metadata
      extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
      amount: analysisResult.amount ?? null,
      sender: analysisResult.sender ?? null,
    };

    // Validate with Zod schema
    const validatedData = insertDocumentSchema.parse(documentData);
    const document = await storage.createDocument(validatedData);

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

  // Get all documents for authenticated user with optional search/filter/sort
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { search, categories, sort } = req.query;

      // Get effective user ID (supports shared access)
      const effectiveUserId = await getEffectiveUserId(userId);
      
      // Check if user is accessing shared documents (only show shared folders)
      const isShared = await isSharedUser(userId);

      // Parse categories from query string (comma-separated)
      const categoryArray = categories 
        ? (categories as string).split(',').filter(c => c.trim())
        : undefined;

      const documents = await storage.searchDocuments(
        effectiveUserId,
        search as string | undefined,
        categoryArray,
        sort as any,
        isShared // Only show shared folder documents if user is a shared user
      );

      // Disable caching to ensure fresh data after privacy toggle
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
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

      // Verify user owns the document
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
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

      if (document.userId !== userId) {
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

  // Update document category
  app.patch('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { category } = req.body;

      // Validate category
      const validCategories = [...DOCUMENT_CATEGORIES];
      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({ 
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
        });
      }

      // Update category
      const updated = await storage.updateDocumentCategory(id, userId, category);

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

      // Get effective user ID (supports shared access)
      const effectiveUserId = await getEffectiveUserId(userId);

      // Verify document exists and user owns it
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== effectiveUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update sharing status
      const updated = await storage.updateDocumentSharing(id, effectiveUserId, isShared);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update sharing" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating document sharing:", error);
      res.status(500).json({ message: "Failed to update sharing" });
    }
  });

  // Delete document (soft delete - moves to trash)
  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get effective user ID (supports shared access)
      const effectiveUserId = await getEffectiveUserId(userId);

      // Verify document exists and user owns it
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== effectiveUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Soft delete document (moves to trash)
      const deleted = await storage.deleteDocument(id, effectiveUserId);

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

  // Phase 2: Tags API routes
  
  // Get all tags for user
  app.get('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTags = await storage.getTags(userId);
      res.json(userTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Create new tag
  app.post('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      const tag = await storage.createTag({
        userId,
        name,
        color: color || "#3b82f6",
      });

      res.json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  // Update tag
  app.patch('/api/tags/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { name, color } = req.body;

      const updated = await storage.updateTag(id, userId, { name, color });

      if (!updated) {
        return res.status(404).json({ message: "Tag not found or access denied" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  // Delete tag
  app.delete('/api/tags/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const deleted = await storage.deleteTag(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Tag not found or access denied" });
      }

      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Add tag to document
  app.post('/api/documents/:documentId/tags/:tagId', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId, tagId } = req.params;
      const documentTag = await storage.addTagToDocument(documentId, tagId);
      res.json(documentTag);
    } catch (error) {
      console.error("Error adding tag to document:", error);
      res.status(500).json({ message: "Failed to add tag to document" });
    }
  });

  // Remove tag from document
  app.delete('/api/documents/:documentId/tags/:tagId', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId, tagId } = req.params;
      const removed = await storage.removeTagFromDocument(documentId, tagId);
      
      if (!removed) {
        return res.status(404).json({ message: "Tag association not found" });
      }

      res.json({ message: "Tag removed from document" });
    } catch (error) {
      console.error("Error removing tag from document:", error);
      res.status(500).json({ message: "Failed to remove tag from document" });
    }
  });

  // Get all tags for a document
  app.get('/api/documents/:documentId/tags', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const documentTags = await storage.getDocumentTags(documentId);
      res.json(documentTags);
    } catch (error) {
      console.error("Error fetching document tags:", error);
      res.status(500).json({ message: "Failed to fetch document tags" });
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
            const [fileBuffer] = await objectFile.download();
            
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
        return res.status(200).json({ message: 'Sender not whitelisted' });
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
      
      // Filter supported attachments
      const supportedAttachments = attachments.filter(att => 
        isSupportedAttachment(att.contentType, att.filename)
      );
      
      console.log('[Email Webhook] Processing', supportedAttachments.length, 'supported attachments');
      
      let processedCount = 0;
      const errors: string[] = [];
      
      // Process each attachment
      for (const attachment of supportedAttachments) {
        try {
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
          
          // Store file in object storage
          const { filePath, thumbnailPath } = await uploadFile(
            attachment.content,
            attachment.filename,
            user.id
          );
          
          // Save to database
          await storage.createDocument({
            userId: user.id,
            title: analysisResult.title,
            category: analysisResult.category,
            extractedText: analysisResult.extractedText,
            fileUrl: filePath,
            thumbnailUrl: thumbnailPath,
            mimeType: attachment.contentType, // Store MIME type
            confidence: analysisResult.confidence,
            extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
            amount: analysisResult.amount,
            sender: analysisResult.sender,
          });
          
          processedCount++;
          console.log('[Email Webhook] Successfully processed:', attachment.filename);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Email Webhook] Failed to process attachment:', attachment.filename, errorMsg);
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
      
      console.log('[Email Webhook] Completed. Processed:', processedCount, 'Errors:', errors.length);
      
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

      const { sendEmail, getDay14Email, getGraceStartEmail, getGraceLastDayEmail, getReadOnlyStartEmail } = await import('./emailService');
      
      let emailData: { subject: string; html: string; text: string };
      
      const userName = user.firstName || 'dort';
      
      switch (emailType) {
        case 'day_14':
          emailData = getDay14Email(userName);
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

  const httpServer = createServer(app);

  return httpServer;
}
