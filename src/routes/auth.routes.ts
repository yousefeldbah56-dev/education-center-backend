import { Router } from 'express';
import {
  login,
  refreshToken,
  changePassword,
  getMe,
  logout,
  registerDeviceToken,
  removeDeviceToken,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { loginRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  deviceTokenSchema,
} from '../validations/auth.validation.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get tokens
 * @access  Public (Rate limited)
 */
router.post('/login', loginRateLimiter, validate(loginSchema), login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Renew access token using refresh token
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated or forced first login)
 * @access  Private
 */
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
router.get('/me', authMiddleware, getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout and clear refresh token cookie
 * @access  Public / Private
 */
router.post('/logout', logout);

/**
 * @route   POST /api/v1/auth/device-token
 * @desc    Register mobile FCM device token for notifications
 * @access  Private
 */
router.post(
  '/device-token',
  authMiddleware,
  validate(deviceTokenSchema),
  registerDeviceToken
);

/**
 * @route   DELETE /api/v1/auth/device-token
 * @desc    Unregister mobile FCM device token
 * @access  Private
 */
router.delete(
  '/device-token',
  authMiddleware,
  validate(deviceTokenSchema),
  removeDeviceToken
);

export default router;
