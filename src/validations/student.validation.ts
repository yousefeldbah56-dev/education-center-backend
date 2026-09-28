import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createStudentSchema = z.object({
  name: z.string().trim().min(3, 'الاسم يجب أن لا يقل عن 3 أحرف'),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف يجب أن يكون رقم مصري صالح (مثال: 01012345678)'),
  email: z.string().trim().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف').optional(),
  parentName: z.string().trim().optional(),
  parentPhone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم هاتف ولي الأمر يجب أن يكون رقم مصري صالح')
    .optional()
    .or(z.literal('')),
  grade: z.string().trim().min(1, 'المرحلة الدراسية مطلوبة'),
  packageId: z
    .string()
    .regex(objectIdRegex, 'معرف الباقة غير صالح')
    .optional()
    .or(z.literal('')),
  subjects: z
    .array(z.string().regex(objectIdRegex, 'معرف المادة غير صالح'))
    .optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  name: z.string().trim().min(3, 'الاسم يجب أن لا يقل عن 3 أحرف').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف يجب أن يكون رقم مصري صالح')
    .optional(),
  email: z.string().trim().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  parentName: z.string().trim().optional(),
  parentPhone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم هاتف ولي الأمر يجب أن يكون رقم مصري صالح')
    .optional()
    .or(z.literal('')),
  grade: z.string().trim().min(1, 'المرحلة الدراسية غير صالحة').optional(),
  packageId: z
    .string()
    .regex(objectIdRegex, 'معرف الباقة غير صالح')
    .optional()
    .nullable(),
  subjects: z
    .array(z.string().regex(objectIdRegex, 'معرف المادة غير صالح'))
    .optional(),
  subscriptionStatus: z
    .enum(['active', 'pending', 'overdue', 'suspended'])
    .optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
