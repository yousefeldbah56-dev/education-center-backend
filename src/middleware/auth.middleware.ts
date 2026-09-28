import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js';
import type { UserRole } from '../models/User.model.js';

// ─── Extend Express Request ───────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

// ─── Auth Middleware ───────────────────────────────────────────

/**
 * Protect routes by verifying the JWT Access Token.
 * 🛡️ Extracts token from Authorization header (Bearer scheme).
 * 🛡️ Validates token type to prevent token confusion attacks.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access denied. Malformed token.' });
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired. Please refresh your token.' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }
    res.status(401).json({ message: 'Authentication failed.' });
  }
}

// ─── RBAC Middleware ───────────────────────────────────────────

/**
 * Restrict access to specific roles.
 * 🛡️ Must be used AFTER authMiddleware.
 *
 * Usage: `router.get('/admin-only', authMiddleware, authorize('super_admin', 'admin'), handler)`
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: 'Forbidden. You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
}
