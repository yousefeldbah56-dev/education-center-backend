import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.model.js';
import { TeacherModel } from '../models/Teacher.model.js';
import { hashPassword } from '../utils/password.js';
import { generateSecureToken, encryptAES } from '../utils/crypto.js';
import { createAuditLog } from '../utils/auditLog.js';

/**
 * 👨‍🏫 Create Teacher
 * Access: SuperAdmin, Admin
 */
export async function createTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, phone, email, password, salaryPercentage, subjects } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [
        { phone },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();
      res.status(409).json({
        message: 'رقم الهاتف أو البريد الإلكتروني مسجل بالفعل لمستخدم آخر',
      });
      return;
    }

    const rawPassword = password || phone;
    const hashedPassword = await hashPassword(rawPassword);

    const [user] = await UserModel.create(
      [
        {
          name,
          phone,
          email: email ? email.toLowerCase() : undefined,
          password: hashedPassword,
          role: 'teacher',
          status: 'active',
          mustChangePassword: true,
        },
      ],
      { session }
    );

    const rawQrToken = generateSecureToken(32);

    const [teacher] = await TeacherModel.create(
      [
        {
          userId: user._id,
          salaryPercentage,
          qrToken: rawQrToken,
          subjects: subjects || [],
        },
      ],
      { session }
    );

    await session.commitTransaction();

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_TEACHER',
        entity: 'Teacher',
        entityId: teacher._id,
        description: `Created teacher: ${name} (${phone}) with ${salaryPercentage}%`,
        req,
      });
    }

    const encryptedQR = encryptAES(
      JSON.stringify({
        type: 'teacher',
        token: rawQrToken,
        createdAt: Date.now(),
      })
    );

    res.status(201).json({
      message: 'تم إضافة المدرس بنجاح',
      teacher: {
        id: teacher._id,
        userId: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        salaryPercentage: teacher.salaryPercentage,
        subjects: teacher.subjects,
        createdAt: teacher.createdAt,
      },
      qrCodeData: encryptedQR,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

/**
 * 📋 Get All Teachers
 * Access: SuperAdmin, Admin
 */
export async function getTeachers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const teachers = await TeacherModel.find()
      .populate('userId', 'name phone email status')
      .populate('subjects', 'name grade')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: teachers });
  } catch (error) {
    next(error);
  }
}

/**
 * 🔍 Get Teacher by ID
 * Access: SuperAdmin, Admin, Teacher themselves
 */
export async function getTeacherById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const teacher = await TeacherModel.findById(id)
      .populate('userId', 'name phone email status createdAt')
      .populate('subjects', 'name grade');

    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    // Teachers can only view their own full data
    if (
      req.user?.role === 'teacher' &&
      teacher.userId._id.toString() !== req.user.userId
    ) {
      res.status(403).json({ message: 'غير مصرح لك بعرض بيانات مدرس آخر' });
      return;
    }

    res.status(200).json({ teacher });
  } catch (error) {
    next(error);
  }
}

/**
 * 📲 Get Teacher QR Code
 * Access: SuperAdmin, Admin, Teacher themselves
 */
export async function getTeacherQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const teacher = await TeacherModel.findById(id).select('+qrToken');
    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    if (
      req.user?.role === 'teacher' &&
      teacher.userId.toString() !== req.user.userId
    ) {
      res.status(403).json({ message: 'غير مصرح لك باستعراض QR لمدرس آخر' });
      return;
    }

    const encryptedPayload = encryptAES(
      JSON.stringify({
        type: 'teacher',
        token: teacher.qrToken,
        createdAt: Date.now(),
      })
    );

    res.status(200).json({
      teacherId: teacher._id,
      qrData: encryptedPayload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ✏️ Update Teacher
 * Access: SuperAdmin, Admin
 */
export async function updateTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, phone, email, salaryPercentage, subjects, status } = req.body;

    const teacher = await TeacherModel.findById(id);
    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    if (name || phone || email !== undefined || status) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      if (email !== undefined) userUpdate.email = email || undefined;
      if (status) userUpdate.status = status;

      await UserModel.findByIdAndUpdate(teacher.userId, userUpdate);
    }

    if (salaryPercentage !== undefined) teacher.salaryPercentage = salaryPercentage;
    if (subjects) teacher.subjects = subjects;

    await teacher.save();

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'UPDATE_TEACHER',
        entity: 'Teacher',
        entityId: teacher._id,
        description: `Updated teacher id ${teacher._id}`,
        req,
      });
    }

    const updated = await TeacherModel.findById(id)
      .populate('userId', 'name phone email status')
      .populate('subjects', 'name grade');

    res.status(200).json({
      message: 'تم تحديث بيانات المدرس بنجاح',
      teacher: updated,
    });
  } catch (error) {
    next(error);
  }
}
