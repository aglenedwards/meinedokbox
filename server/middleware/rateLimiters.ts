import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login attempts
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Zu viele Login-Versuche. Bitte versuchen Sie es in 15 Minuten erneut.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
});

/**
 * Rate limiter for registration
 * 3 registrations per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Zu viele Registrierungsversuche. Bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for email verification
 * 10 verification attempts per hour per IP
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Zu viele Verifizierungsversuche. Bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for resending verification emails
 * 5 resend requests per hour per IP
 */
export const resendEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Zu viele Anfragen zum erneuten Senden. Bitte warten Sie eine Stunde.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for invitations
 * 20 invitations per hour per authenticated user
 */
export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Zu viele Einladungen versendet. Bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for document uploads
 * 50 uploads per hour per authenticated user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Zu viele Upload-Versuche. Bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for contact form submissions
 * 3 submissions per hour per IP
 */
export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Zu viele Kontaktanfragen. Bitte versuchen Sie es in einer Stunde erneut.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/health' || req.path.startsWith('/assets');
  },
});
