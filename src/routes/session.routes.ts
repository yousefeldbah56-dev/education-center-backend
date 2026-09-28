import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  getSessionRotatingQR,
  scanStudentQR,
  studentScanSessionQR,
  recordTeacherAttendance,
  getSessionStats,
} from '../controllers/session.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createSessionSchema,
  scanStudentQRSchema,
  studentScanSessionQRSchema,
  teacherScanQRSchema,
} from '../validations/session.validation.js';

const router = Router();

router.use(authMiddleware);

/**
 * @route   POST /api/v1/sessions
 * @desc    Create session and auto-generate pending attendance
 * @access  Private (super_admin, admin)
 */
router.post(
  '/',
  authorize('super_admin', 'admin'),
  validate(createSessionSchema),
  createSession
);

/**
 * @route   GET /api/v1/sessions
 * @desc    List sessions with filters
 * @access  Private (super_admin, admin, teacher)
 */
router.get(
  '/',
  authorize('super_admin', 'admin', 'teacher'),
  getSessions
);

/**
 * @route   GET /api/v1/sessions/:id
 * @desc    Get session details & student attendance roster
 * @access  Private (super_admin, admin, teacher)
 */
router.get('/:id', getSessionById);

/**
 * @route   GET /api/v1/sessions/:id/qr
 * @desc    Get dynamic rotating live QR code for screen display
 * @access  Private (super_admin, admin, teacher)
 */
router.get(
  '/:id/qr',
  authorize('super_admin', 'admin', 'teacher'),
  getSessionRotatingQR
);

/**
 * @route   GET /api/v1/sessions/:id/stats
 * @desc    Get real-time session attendance statistics
 * @access  Private (super_admin, admin, teacher)
 */
router.get('/:id/stats', getSessionStats);

/**
 * @route   POST /api/v1/sessions/scan/student
 * @desc    Admin/Teacher scans Student Card QR
 * @access  Private (super_admin, admin, teacher)
 */
router.post(
  '/scan/student',
  authorize('super_admin', 'admin', 'teacher'),
  validate(scanStudentQRSchema),
  scanStudentQR
);

/**
 * @route   POST /api/v1/sessions/scan/session
 * @desc    Student scans Live Rotating Session QR
 * @access  Private (student)
 */
router.post(
  '/scan/session',
  authorize('student'),
  validate(studentScanSessionQRSchema),
  studentScanSessionQR
);

/**
 * @route   POST /api/v1/sessions/scan/teacher
 * @desc    Admin scans Teacher QR for daily attendance
 * @access  Private (super_admin, admin)
 */
router.post(
  '/scan/teacher',
  authorize('super_admin', 'admin'),
  validate(teacherScanQRSchema),
  recordTeacherAttendance
);

export default router;
