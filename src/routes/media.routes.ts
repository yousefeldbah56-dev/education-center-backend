import { Router } from 'express';
import {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  createPdf,
  getPdfs,
  getPdfById,
  updatePdf,
} from '../controllers/media.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createVideoSchema,
  updateVideoSchema,
  createPdfSchema,
  updatePdfSchema,
} from '../validations/media.validation.js';

const router = Router();

router.use(authMiddleware);

// ─── Videos ────────────────────────────────────────────────────
router.post(
  '/videos',
  authorize('super_admin', 'admin', 'teacher'),
  validate(createVideoSchema),
  createVideo
);

router.get('/videos', getVideos);
router.get('/videos/:id', getVideoById);

router.put(
  '/videos/:id',
  authorize('super_admin', 'admin', 'teacher'),
  validate(updateVideoSchema),
  updateVideo
);

// ─── PDFs ──────────────────────────────────────────────────────
router.post(
  '/pdfs',
  authorize('super_admin', 'admin', 'teacher'),
  validate(createPdfSchema),
  createPdf
);

router.get('/pdfs', getPdfs);
router.get('/pdfs/:id', getPdfById);

router.put(
  '/pdfs/:id',
  authorize('super_admin', 'admin', 'teacher'),
  validate(updatePdfSchema),
  updatePdf
);

export default router;
