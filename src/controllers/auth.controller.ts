import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.model.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { createAuditLog } from '../utils/auditLog.js';
import { env } from '../config/env.js';

/**
 * Cookie options for refreshToken
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

/**
 * 🔐 Login with phone or email + password.
 * Rate limited and protected against user enumeration.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { identifier, password } = req.body;

    // Search by phone or email (case insensitive email)
    const user = await UserModel.findOne({
      $or: [
        { phone: identifier },
        { email: identifier.toLowerCase() },
      ],
    }).select('+password');

    // Generic error message to prevent user enumeration attacks
    const invalidCredentialsMsg = 'بيانات الاعتماد غير صحيحة أو الحساب غير مفعل';

    if (!user) {
      res.status(401).json({ message: invalidCredentialsMsg });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        message:
          user.status === 'suspended'
            ? 'تم إيقاف هذا الحساب. يرجى مراجعة إدارة السنتر.'
            : 'هذا الحساب غير نشط حالياً.',
      });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: invalidCredentialsMsg });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: invalidCredentialsMsg });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Audit log
    await createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: `User logged in from IP`,
      req,
    });

    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      accessToken,
      refreshToken, // Also returned in body for non-browser/mobile clients
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🔄 Refresh Access Token using Refresh Token.
 * Validates token signature, token type, and user active status.
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      res.status(401).json({ message: 'رمز التحديث غير متوفر (Refresh token missing)' });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ message: 'رمز التحديث غير صالح أو منتهي الصلاحية' });
      return;
    }

    // Ensure user still exists and is active
    const user = await UserModel.findById(payload.userId);
    if (!user || user.status !== 'active') {
      res.status(401).json({ message: 'المستخدم غير موجود أو تم إيقاف حسابه' });
      return;
    }

    // Issue new access token
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);

    res.status(200).json({
      message: 'تم تجديد رمز الدخول بنجاح',
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🔑 Change Password.
 * Required for first-time login when mustChangePassword is true, or on demand.
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'غير مصرح بالدخول' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user.userId).select('+password');
    if (!user) {
      res.status(404).json({ message: 'المستخدم غير موجود' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ message: 'الحساب ليس لديه كلمة مرور حالية' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    // Hash and update
    user.password = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    await createAuditLog({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: user._id,
      description: 'User changed password successfully',
      req,
    });

    res.status(200).json({
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 👤 Get Current User Profile (Me).
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'غير مصرح بالدخول' });
      return;
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'المستخدم غير موجود' });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🚪 Logout.
 * Clears the refresh token cookie.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'User',
        userRole: req.user.role,
        action: 'LOGOUT',
        entity: 'User',
        entityId: req.user.userId,
        description: 'User logged out',
        req,
      });
    }

    res.status(200).json({ message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    next(error);
  }
}

/**
 * 📲 Register Mobile Device Token (FCM)
 * Access: Authenticated (Student, Teacher, Admin, SuperAdmin)
 */
export async function registerDeviceToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'غير مصرح بالدخول' });
      return;
    }

    const { token } = req.body;

    await UserModel.findByIdAndUpdate(req.user.userId, {
      $addToSet: { deviceTokens: token },
    });

    res.status(200).json({
      message: 'تم تسجيل توكن الإشعارات للجهاز بنجاح',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📲 Remove Mobile Device Token (e.g. on user logout from specific device)
 * Access: Authenticated
 */
export async function removeDeviceToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'غير مصرح بالدخول' });
      return;
    }

    const { token } = req.body;

    await UserModel.findByIdAndUpdate(req.user.userId, {
      $pull: { deviceTokens: token },
    });

    res.status(200).json({
      message: 'تم إلغاء تسجيل توكن الإشعارات للجهاز بنجاح',
    });
  } catch (error) {
    next(error);
  }
}
