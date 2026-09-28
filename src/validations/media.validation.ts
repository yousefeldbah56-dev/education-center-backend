import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ─── Video Validations ─────────────────────────────────────────
export const createVideoSchema = z.object({
  title: z.string().trim().min(2, 'عنوان الفيديو مطلوب'),
  subjectId: z.string().regex(objectIdRegex, 'معرف المادة غير صالح'),
  grade: z.string().trim().min(1, 'المرحلة الدراسية مطلوبة'),
  url: z.string().trim().min(5, 'رابط الفيديو غير صالح'),
  duration: z.number().min(0, 'المدة بالثواني لا يمكن أن تكون سالبة').optional(),
  isFreePreview: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;

export const updateVideoSchema = z.object({
  title: z.string().trim().min(2, 'عنوان الفيديو مطلوب').optional(),
  url: z.string().trim().min(5, 'رابط الفيديو غير صالح').optional(),
  duration: z.number().min(0).optional(),
  isFreePreview: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;

// ─── PDF Validations ───────────────────────────────────────────
export const createPdfSchema = z.object({
  title: z.string().trim().min(2, 'عنوان الملف مطلوب'),
  subjectId: z.string().regex(objectIdRegex, 'معرف المادة غير صالح'),
  grade: z.string().trim().min(1, 'المرحلة الدراسية مطلوبة'),
  url: z.string().trim().min(5, 'رابط الملف غير صالح'),
  fileSize: z.number().min(0, 'حجم الملف لا يمكن أن يكون سالباً').optional(),
  isFreePreview: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreatePdfInput = z.infer<typeof createPdfSchema>;

export const updatePdfSchema = z.object({
  title: z.string().trim().min(2, 'عنوان الملف مطلوب').optional(),
  url: z.string().trim().min(5, 'رابط الملف غير صالح').optional(),
  fileSize: z.number().min(0).optional(),
  isFreePreview: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePdfInput = z.infer<typeof updatePdfSchema>;
