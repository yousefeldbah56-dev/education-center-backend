import { Router } from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherQR,
  updateTeacher,
} from '../controllers/teacher.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTeacherSchema,
  updateTeacherSchema,
} from '../validations/teacher.validation.js';

const router = Router();

router.use(authMiddleware);

/**
 * @route   POST /api/v1/teachers
 * @desc    Create a new teacher
 * @access  Private (super_admin, admin)
 */
router.post(
  '/',
  authorize('super_admin', 'admin'),
  validate(createTeacherSchema),
  createTeacher
);

/**
 * @route   GET /api/v1/teachers
 * @desc    List all teachers
 * @access  Private (super_admin, admin)
 */
router.get('/', authorize('super_admin', 'admin'), getTeachers);

/**
 * @route   GET /api/v1/teachers/:id
 * @desc    Get teacher profile
 * @access  Private
 */
router.get('/:id', getTeacherById);

/**
 * @route   GET /api/v1/teachers/:id/qr
 * @desc    Get encrypted teacher QR code payload
 * @access  Private
 */
router.get('/:id/qr', getTeacherQR);

/**
 * @route   PUT /api/v1/teachers/:id
 * @desc    Update teacher profile
 * @access  Private (super_admin, admin)
 */
router.put(
  '/:id',
  authorize('super_admin', 'admin'),
  validate(updateTeacherSchema),
  updateTeacher
);

export default router;
