import assert from 'assert';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { encryptAES, decryptAES, generateSecureToken } from '../utils/crypto.js';
import { loginSchema } from '../validations/auth.validation.js';
import { createPaymentSchema } from '../validations/finance.validation.js';

console.log('🛡️ Running Backend Automated Security & Logic Verification...\n');

async function runTests() {
  let passed = 0;

  // ─── Test 1: Password Hashing (bcrypt with 12 rounds) ─────────
  console.log('Test 1: bcrypt password hashing and verification...');
  const plain = 'SecretPassword123!';
  const hash = await hashPassword(plain);
  assert(hash !== plain, 'Password must be hashed');
  assert(await comparePassword(plain, hash), 'Valid password must match hash');
  assert(!(await comparePassword('WrongPassword', hash)), 'Invalid password must not match');
  console.log('   ✅ Password hashing & verification passed');
  passed++;

  // ─── Test 2: JWT Access & Refresh Token Separation ────────────
  console.log('Test 2: JWT Access & Refresh Token separation & anti-confusion...');
  const userId = '507f1f77bcf86cd799439011';
  const accessToken = generateAccessToken(userId, 'admin');
  const refreshToken = generateRefreshToken(userId);

  const decodedAccess = verifyAccessToken(accessToken);
  assert.strictEqual(decodedAccess.userId, userId);
  assert.strictEqual(decodedAccess.role, 'admin');
  assert.strictEqual(decodedAccess.type, 'access');

  const decodedRefresh = verifyRefreshToken(refreshToken);
  assert.strictEqual(decodedRefresh.userId, userId);
  assert.strictEqual(decodedRefresh.type, 'refresh');

  // Token Confusion Test: Using refresh token as access token MUST fail
  let confusedAccessFailed = false;
  try {
    verifyAccessToken(refreshToken);
  } catch {
    confusedAccessFailed = true;
  }
  assert(confusedAccessFailed, 'Refresh token must NOT be accepted as access token');

  // Token Confusion Test: Using access token as refresh token MUST fail
  let confusedRefreshFailed = false;
  try {
    verifyRefreshToken(accessToken);
  } catch {
    confusedRefreshFailed = true;
  }
  assert(confusedRefreshFailed, 'Access token must NOT be accepted as refresh token');
  console.log('   ✅ JWT token separation & anti-confusion passed');
  passed++;

  // ─── Test 3: AES-256-GCM Authenticated Encryption & Tamper Proof ──
  console.log('Test 3: AES-256-GCM encryption and tamper detection...');
  const payload = JSON.stringify({ type: 'student', token: generateSecureToken(32), t: Date.now() });
  const encrypted = encryptAES(payload);
  const decrypted = decryptAES(encrypted);
  assert.strictEqual(decrypted, payload, 'Decrypted text must match original payload');

  // Tamper Test: altering ciphertext must throw authentication error
  const parts = encrypted.split(':');
  parts[2] = (parts[2].slice(0, -2) + (parts[2].slice(-2) === 'aa' ? 'bb' : 'aa'));
  const tampered = parts.join(':');
  let tamperDetected = false;
  try {
    decryptAES(tampered);
  } catch {
    tamperDetected = true;
  }
  assert(tamperDetected, 'Tampered ciphertext must be rejected by AES-256-GCM auth tag');
  console.log('   ✅ AES-256-GCM encryption & tamper detection passed');
  passed++;

  // ─── Test 4: Zod Input Validation & Financial Guardrails ──────
  console.log('Test 4: Zod input validation and negative financial checks...');
  const validLogin = loginSchema.safeParse({ identifier: '01012345678', password: 'Password123' });
  assert(validLogin.success, 'Valid login should succeed');

  const invalidPayment = createPaymentSchema.safeParse({
    invoiceId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    amount: -50, // Negative amount
    method: 'cash',
  });
  assert(!invalidPayment.success, 'Negative payment amount must be rejected');

  const zeroPayment = createPaymentSchema.safeParse({
    invoiceId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    amount: 0, // Zero amount
    method: 'cash',
  });
  assert(!zeroPayment.success, 'Zero payment amount must be rejected');
  console.log('   ✅ Financial validation guards passed');
  passed++;

  console.log(`\n🎉 All ${passed} Security & Logic Tests Passed Successfully!\n`);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
