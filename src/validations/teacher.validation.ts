import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTeacherSchema = z.object({
  name: z.string().trim().min(3, 'اسم المدرس يجب أن لا يقل عن 3 أحرف'),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف يجب أن يكون رقم مصري صالح'),
  email: z.string().trim().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور لا تقل عن 6 أحرف').optional(),
  salaryPercentage: z
    .number()
    .min(0, 'النسبة لا يمكن أن تقل عن 0%')
    .max(100, 'النسبة لا يمكن أن تتجاوز 100%'),
  subjects: z
    .array(z.string().regex(objectIdRegex, 'معرف المادة غير صالح'))
    .optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  name: z.string().trim().min(3, 'الاسم لا يقل عن 3 أحرف').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صالح')
    .optional(),
  email: z.string().trim().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  salaryPercentage: z
    .number()
    .min(0, 'النسبة لا يمكن أن تقل عن 0%')
    .max(100, 'النسبة لا يمكن أن تتجاوز 100%')
    .optional(),
  subjects: z
    .array(z.string().regex(objectIdRegex, 'معرف المادة غير صالح'))
    .optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
