import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 12; // 🛡️ Strong enough for production, not too slow for dev

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcryptjs.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(plainPassword, hashedPassword);
}
