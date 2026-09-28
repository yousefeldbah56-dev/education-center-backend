import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createSessionSchema = z.object({
  subjectId: z.string().regex(objectIdRegex, 'معرف المادة غير صالح'),
  teacherId: z.string().regex(objectIdRegex, 'معرف المدرس غير صالح'),
  groupId: z.string().regex(objectIdRegex, 'معرف المجموعة غير صالح'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'تاريخ الحصة غير صالح'),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة وقت البدء غير صالحة (HH:MM)'),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة وقت الانتهاء غير صالحة (HH:MM)'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const scanStudentQRSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'معرف الحصة غير صالح'),
  qrData: z.string().min(10, 'بيانات QR مشفرة غير صالحة'),
});

export type ScanStudentQRInput = z.infer<typeof scanStudentQRSchema>;

export const studentScanSessionQRSchema = z.object({
  qrData: z.string().min(10, 'بيانات QR مشفرة غير صالحة'),
});

export type StudentScanSessionQRInput = z.infer<typeof studentScanSessionQRSchema>;

export const manualAttendanceSchema = z.object({
  sessionId: z.string().regex(objectIdRegex, 'معرف الحصة غير صالح'),
  studentId: z.string().regex(objectIdRegex, 'معرف الطالب غير صالح'),
  status: z.enum(['pending', 'present', 'absent', 'late']),
});

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;

export const teacherScanQRSchema = z.object({
  qrData: z.string().min(10, 'بيانات QR مشفرة غير صالحة'),
});

export type TeacherScanQRInput = z.infer<typeof teacherScanQRSchema>;
