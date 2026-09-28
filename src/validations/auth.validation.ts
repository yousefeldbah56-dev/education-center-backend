import { z } from 'zod';

/**
 * 🛡️ Validation schema for user login.
 * Supports identifier as either phone number or email.
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'رقم الهاتف أو البريد الإلكتروني مطلوب')
    .min(3, 'يجب إدخال معرف صالح (هاتف أو بريد)'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور لا تقل عن 6 أحرف'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * 🛡️ Validation schema for refreshing tokens.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * 🛡️ Validation schema for changing password.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'كلمة المرور الحالية مطلوبة')
      .min(6, 'كلمة المرور الحالية غير صالحة'),
    newPassword: z
      .string()
      .min(1, 'كلمة المرور الجديدة مطلوبة')
      .min(6, 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        'كلمة المرور الجديدة يجب أن تحتوي على حرف ورقم على الأقل'
      ),
    confirmPassword: z
      .string()
      .min(1, 'تأكيد كلمة المرور مطلوب')
      .min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمات المرور الجديدة غير متطابقة',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'لا يمكن استخدام كلمة المرور الحالية ككلمة مرور جديدة',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * 📲 Validation schema for registering/unregistering mobile device token (FCM).
 */
export const deviceTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(10, 'رمز الجهاز (Device Token) غير صالح'),
});

export type DeviceTokenInput = z.infer<typeof deviceTokenSchema>;

