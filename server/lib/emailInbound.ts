import crypto from 'crypto';

/**
 * Verifies Mailgun webhook signature to ensure request authenticity
 */
export function verifyMailgunWebhook(timestamp: string, token: string, signature: string): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  
  if (!signingKey) {
    console.warn('[Mailgun] No signing key configured - skipping verification');
    return true; // Allow in development without key
  }

  // Debug logging
  console.log('[Mailgun] Signature verification:');
  console.log('  - Timestamp:', timestamp);
  console.log('  - Token:', token?.substring(0, 10) + '...');
  console.log('  - Received signature:', signature);
  console.log('  - Signing key exists:', !!signingKey);

  // Mailgun signature format: HMAC-SHA256(timestamp + token)
  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(timestamp + token);
  const calculatedSignature = hmac.digest('hex');
  
  console.log('  - Calculated signature:', calculatedSignature);
  console.log('  - Signatures match:', calculatedSignature === signature);

  return calculatedSignature === signature;
}

/**
 * Generates a unique inbound email address for a user
 * Format: u_{short_user_id}_{random}@in.meinedokbox.de
 */
export function generateInboundEmail(userId: string): string {
  // Take first 8 chars of UUID and add random suffix for uniqueness
  const shortId = userId.replace(/-/g, '').substring(0, 8);
  const random = crypto.randomBytes(4).toString('hex');
  const domain = process.env.INBOUND_EMAIL_DOMAIN || 'in.meinedokbox.de';
  
  return `u_${shortId}_${random}@${domain}`;
}

/**
 * Extracts user ID from inbound email address
 */
export function getUserIdFromInboundEmail(email: string): string | null {
  const match = email.match(/^u_([a-f0-9]{8})_[a-f0-9]{8}@/);
  if (!match) return null;
  
  // This is a simplified version - in production, you'd need to look up the full UUID
  // from the database using the short ID
  return match[1];
}

/**
 * Extracts email address from formatted string
 * Examples:
 *   "John Doe <john@example.com>" -> "john@example.com"
 *   "<john@example.com>" -> "john@example.com"
 *   "john@example.com" -> "john@example.com"
 */
export function extractEmailAddress(formattedEmail: string): string {
  // Match email inside angle brackets: <email@domain.com>
  const bracketMatch = formattedEmail.match(/<([^>]+)>/);
  if (bracketMatch) {
    return bracketMatch[1].trim().toLowerCase();
  }
  
  // If no angle brackets, return the whole string (trimmed and lowercased)
  return formattedEmail.trim().toLowerCase();
}

/**
 * Validates if sender is in user's whitelist
 */
export function isEmailWhitelisted(fromAddress: string, whitelist: string[] | null): boolean {
  if (!whitelist || whitelist.length === 0) {
    return true; // No whitelist = accept all
  }
  
  const normalizedFrom = fromAddress.toLowerCase().trim();
  
  return whitelist.some(allowed => {
    const normalizedAllowed = allowed.toLowerCase().trim();
    
    // Exact match
    if (normalizedFrom === normalizedAllowed) {
      return true;
    }
    
    // Domain wildcard (e.g., *@vodafone.de)
    if (normalizedAllowed.startsWith('*@')) {
      const domain = normalizedAllowed.substring(2);
      return normalizedFrom.endsWith('@' + domain);
    }
    
    return false;
  });
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  size: number;
}

/**
 * Parses Mailgun webhook payload to extract attachments
 */
export function parseMailgunWebhook(body: any, files: any): {
  from: string;
  subject: string;
  attachments: EmailAttachment[];
} {
  const from = body.sender || body.from || '';
  const subject = body.subject || '';
  const attachments: EmailAttachment[] = [];

  // Mailgun sends attachments as multipart/form-data files
  if (files) {
    for (const [fieldName, fileData] of Object.entries(files)) {
      if (fieldName.startsWith('attachment-')) {
        const file = Array.isArray(fileData) ? fileData[0] : fileData;
        
        if (file && file.buffer) {
          attachments.push({
            filename: file.originalname || file.name || 'attachment',
            contentType: file.mimetype || 'application/octet-stream',
            content: file.buffer,
            size: file.size || file.buffer.length
          });
        }
      }
    }
  }

  return { from, subject, attachments };
}

/**
 * Checks if attachment is a supported document type
 */
export function isSupportedAttachment(contentType: string, filename: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];
  
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  
  if (supportedTypes.includes(contentType.toLowerCase())) {
    return true;
  }
  
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? supportedExtensions.includes(ext) : false;
}
