import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ─── Subject Schemas ──────────────────────────────────────────
export const createSubjectSchema = z.object({
  name: z.string().trim().min(2, 'اسم المادة مطلوب (حرفين على الأقل)'),
  grade: z.string().trim().min(1, 'المرحلة الدراسية مطلوبة'),
  teacherId: z.string().regex(objectIdRegex, 'معرف المدرس غير صالح'),
  description: z.string().trim().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// ─── Group Schemas ────────────────────────────────────────────
export const groupScheduleSchema = z.object({
  day: z.enum([
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة وقت البدء غير صالحة (HH:MM)'),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة وقت الانتهاء غير صالحة (HH:MM)'),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'اسم المجموعة مطلوب'),
  subjectId: z.string().regex(objectIdRegex, 'معرف المادة غير صالح'),
  teacherId: z.string().regex(objectIdRegex, 'معرف المدرس غير صالح'),
  grade: z.string().trim().min(1, 'المرحلة الدراسية مطلوبة'),
  capacity: z.number().int().min(1, 'السعة الاستيعابية يجب أن تكون طالب واحد على الأقل'),
  schedule: z.array(groupScheduleSchema).min(1, 'يجب تحديد موعد واحد على الأقل في الجدول'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const assignStudentSchema = z.object({
  studentId: z.string().regex(objectIdRegex, 'معرف الطالب غير صالح'),
});

export type AssignStudentInput = z.infer<typeof assignStudentSchema>;
