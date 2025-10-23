import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { RequestHandler } from "express";

const SALT_ROUNDS = 10;

export async function setupLocalAuth() {
  passport.use('local', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.toLowerCase());
        
        if (!user) {
          return done(null, false, { message: 'Email oder Passwort falsch' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Bitte melden Sie sich mit Replit Auth an' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValid) {
          return done(null, false, { message: 'Email oder Passwort falsch' });
        }

        // Check if email is verified (DSGVO compliance - double opt-in)
        if (!user.isVerified) {
          return done(null, false, { 
            message: 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Prüfen Sie Ihr Postfach.',
            notVerified: true 
          });
        }

        // Create session user object
        const sessionUser = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image_url: user.profileImageUrl,
          },
          isLocal: true, // Flag to distinguish from OIDC users
        };

        return done(null, sessionUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Middleware that works with both Local and OIDC auth
 */
export const isAuthenticatedLocal: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For local auth users, no token refresh needed
  if (user.isLocal) {
    return next();
  }

  // For OIDC users, check token expiration
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired for OIDC user - should refresh (handled by replitAuth middleware)
  return res.status(401).json({ message: "Session expired" });
};
