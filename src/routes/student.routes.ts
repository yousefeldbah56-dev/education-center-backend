import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudentById,
  getStudentQR,
  updateStudent,
} from '../controllers/student.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createStudentSchema,
  updateStudentSchema,
} from '../validations/student.validation.js';

const router = Router();

// 🛡️ All student routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/students
 * @desc    Create a new student (SuperAdmin & Admin only)
 * @access  Private (super_admin, admin)
 */
router.post(
  '/',
  authorize('super_admin', 'admin'),
  validate(createStudentSchema),
  createStudent
);

/**
 * @route   GET /api/v1/students
 * @desc    List all students with pagination & filters
 * @access  Private (super_admin, admin, teacher)
 */
router.get(
  '/',
  authorize('super_admin', 'admin', 'teacher'),
  getStudents
);

/**
 * @route   GET /api/v1/students/:id
 * @desc    Get student profile by ID
 * @access  Private
 */
router.get('/:id', getStudentById);

/**
 * @route   GET /api/v1/students/:id/qr
 * @desc    Get encrypted student QR code payload
 * @access  Private
 */
router.get('/:id/qr', getStudentQR);

/**
 * @route   PUT /api/v1/students/:id
 * @desc    Update student profile (SuperAdmin & Admin only)
 * @access  Private (super_admin, admin)
 */
router.put(
  '/:id',
  authorize('super_admin', 'admin'),
  validate(updateStudentSchema),
  updateStudent
);

export default router;
