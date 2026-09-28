import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes IV for AES-GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from QR_ENCRYPTION_KEY using SHA-256.
 * Guarantees exactly 256 bits regardless of input string length.
 */
function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(env.QR_ENCRYPTION_SECRET).digest();
}

/**
 * 🔐 Generates a cryptographically secure random token (e.g. for student/session qrToken).
 * Length: 32 bytes -> 64 hex characters.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * 🔐 Encrypts plain text (like a QR payload or token) with AES-256-GCM.
 * Output format: `iv:authTag:ciphertext` in hex.
 */
export function encryptAES(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * 🔓 Decrypts ciphertext formatted as `iv:authTag:ciphertext` using AES-256-GCM.
 * Validates auth tag to prevent tampering (Authenticated Encryption).
 */
export function decryptAES(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('صيغة التشفير غير صالحة (Invalid encrypted format)');
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
