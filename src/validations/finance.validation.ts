import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ─── Invoice Validations ───────────────────────────────────────
export const createInvoiceSchema = z.object({
  studentId: z.string().regex(objectIdRegex, 'معرف الطالب غير صالح'),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'صيغة الشهر غير صالحة (مثال: 2026-09)'),
  totalAmount: z
    .number()
    .min(0, 'المبلغ الإجمالي لا يمكن أن يكون سالباً'),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'تاريخ الاستحقاق غير صالح'),
  notes: z.string().trim().max(500).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ─── Payment Validations ───────────────────────────────────────
export const createPaymentSchema = z.object({
  invoiceId: z.string().regex(objectIdRegex, 'معرف الفاتورة غير صالح'),
  studentId: z.string().regex(objectIdRegex, 'معرف الطالب غير صالح'),
  amount: z
    .number()
    .min(0.01, 'قيمة الدفعة يجب أن تكون أكبر من الصفر (0.01 على الأقل)'),
  method: z.enum(['cash', 'visa', 'instapay', 'vodafone_cash']),
  notes: z.string().trim().max(500).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ─── Expense Validations ───────────────────────────────────────
export const createExpenseSchema = z.object({
  title: z.string().trim().min(2, 'عنوان المصروف مطلوب'),
  amount: z
    .number()
    .min(0.01, 'قيمة المصروف يجب أن تكون أكبر من الصفر'),
  category: z.enum([
    'electricity',
    'water',
    'internet',
    'rent',
    'salary',
    'maintenance',
    'supplies',
    'other',
  ]),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'تاريخ المصروف غير صالح')
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ─── Teacher Wallet Settlement Validations ────────────────────
export const settleTeacherWalletSchema = z.object({
  teacherId: z.string().regex(objectIdRegex, 'معرف المدرس غير صالح'),
  amount: z
    .number()
    .min(0.01, 'مبلغ التسوية يجب أن يكون أكبر من الصفر'),
  notes: z.string().trim().optional(),
});

export type SettleTeacherWalletInput = z.infer<typeof settleTeacherWalletSchema>;

// ─── Package Validations ───────────────────────────────────────
export const createPackageSchema = z.object({
  name: z.string().trim().min(2, 'اسم الباقة مطلوب'),
  grade: z.string().trim().min(1, 'المرحلة الدراسية مطلوبة'),
  subjects: z.array(z.string().regex(objectIdRegex, 'معرف المادة غير صالح')).min(1),
  price: z.number().min(0, 'سعر الباقة لا يمكن أن يكون سالباً'),
  duration: z.number().int().min(1, 'المدة يجب أن تكون يوم واحد على الأقل').optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
