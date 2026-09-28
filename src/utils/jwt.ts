import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/User.model.js';

// ─── Token Payload Interfaces ──────────────────────────────────

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

// ─── Generate Tokens ───────────────────────────────────────────

/**
 * Generate a short-lived JWT Access Token.
 * Contains userId + role for RBAC checks.
 */
export function generateAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = { userId, role, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Generate a long-lived JWT Refresh Token.
 * Contains only userId — role is NOT embedded here to prevent stale role usage.
 */
export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

// ─── Verify Tokens ─────────────────────────────────────────────

/**
 * Verify and decode an Access Token.
 * 🛡️ Validates the `type` field to prevent refresh tokens being used as access tokens.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

  if (decoded.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }

  return decoded;
}

/**
 * Verify and decode a Refresh Token.
 * 🛡️ Validates the `type` field to prevent access tokens being used as refresh tokens.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }

  return decoded;
}
