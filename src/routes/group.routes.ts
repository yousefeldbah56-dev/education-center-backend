import { Router } from 'express';
import {
  createSubject,
  getSubjects,
  createGroup,
  getGroups,
  getGroupById,
  addStudentToGroup,
  removeStudentFromGroup,
} from '../controllers/group.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createSubjectSchema,
  createGroupSchema,
  assignStudentSchema,
} from '../validations/group.validation.js';

const router = Router();

router.use(authMiddleware);

// ─── Subjects ──────────────────────────────────────────────────
router.post(
  '/subjects',
  authorize('super_admin', 'admin'),
  validate(createSubjectSchema),
  createSubject
);

router.get(
  '/subjects',
  authorize('super_admin', 'admin', 'teacher'),
  getSubjects
);

// ─── Groups ────────────────────────────────────────────────────
router.post(
  '/',
  authorize('super_admin', 'admin'),
  validate(createGroupSchema),
  createGroup
);

router.get(
  '/',
  authorize('super_admin', 'admin', 'teacher'),
  getGroups
);

router.get(
  '/:id',
  authorize('super_admin', 'admin', 'teacher'),
  getGroupById
);

router.post(
  '/:id/students',
  authorize('super_admin', 'admin'),
  validate(assignStudentSchema),
  addStudentToGroup
);

router.delete(
  '/:id/students/:studentId',
  authorize('super_admin', 'admin'),
  removeStudentFromGroup
);

export default router;
