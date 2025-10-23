import type { Request, Response, NextFunction } from "express";

const ADMIN_EMAIL = "service@meinedokbox.de";

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: "Nicht authentifiziert" });
  }

  // Get email from user object (works for both OIDC and Local Auth)
  const userEmail = user.email || user.claims?.email;
  
  if (userEmail?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ message: "Zugriff verweigert. Nur Administratoren haben Zugriff." });
  }

  // Check if admin password has been verified in session
  if (!req.session.isAdminAuthenticated) {
    return res.status(403).json({ 
      message: "Admin-Authentifizierung erforderlich",
      requiresAdminLogin: true 
    });
  }

  next();
}
