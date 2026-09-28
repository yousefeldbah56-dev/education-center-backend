import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.model.js';
import { StudentModel } from '../models/Student.model.js';
import { hashPassword } from '../utils/password.js';
import { generateSecureToken, encryptAES } from '../utils/crypto.js';
import { createAuditLog } from '../utils/auditLog.js';

/**
 * 🎓 Create Student (Creates User + Student profile + generates encrypted QR)
 * Access: SuperAdmin, Admin
 */
export async function createStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      phone,
      email,
      password,
      parentName,
      parentPhone,
      grade,
      packageId,
      subjects,
    } = req.body;

    // Check if phone or email already registered
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

    // Default password to phone if not specified, with mustChangePassword=true
    const rawPassword = password || phone;
    const hashedPassword = await hashPassword(rawPassword);

    // Create User record
    const [user] = await UserModel.create(
      [
        {
          name,
          phone,
          email: email ? email.toLowerCase() : undefined,
          password: hashedPassword,
          role: 'student',
          status: 'active',
          mustChangePassword: true,
        },
      ],
      { session }
    );

    // Generate secure random QR token (never contains student ID directly)
    const rawQrToken = generateSecureToken(32);

    // Create Student record
    const [student] = await StudentModel.create(
      [
        {
          userId: user._id,
          parentName,
          parentPhone,
          grade,
          qrToken: rawQrToken,
          packageId: packageId || undefined,
          subjects: subjects || [],
          subscriptionStatus: 'active',
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // Audit log
    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_STUDENT',
        entity: 'Student',
        entityId: student._id,
        description: `Created student: ${name} (${phone})`,
        req,
      });
    }

    // Generate encrypted QR payload for frontend display/printing
    const encryptedQR = encryptAES(
      JSON.stringify({
        type: 'student',
        token: rawQrToken,
        createdAt: Date.now(),
      })
    );

    res.status(201).json({
      message: 'تم إضافة الطالب بنجاح',
      student: {
        id: student._id,
        userId: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        grade: student.grade,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        subscriptionStatus: student.subscriptionStatus,
        createdAt: student.createdAt,
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
 * 📋 Get All Students (Paginated, Searchable, Filterable)
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, grade, subscriptionStatus } = req.query;

    const query: any = {};
    if (grade) query.grade = grade;
    if (subscriptionStatus) query.subscriptionStatus = subscriptionStatus;

    let userFilter: any = {};
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      userFilter = {
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      };
      const matchingUsers = await UserModel.find(userFilter).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const [students, total] = await Promise.all([
      StudentModel.find(query)
        .populate('userId', 'name phone email status')
        .populate('subjects', 'name grade')
        .populate('packageId', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StudentModel.countDocuments(query),
    ]);

    res.status(200).json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🔍 Get Student by ID
 * Access: SuperAdmin, Admin, Teacher, or the Student themselves
 */
export async function getStudentById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const student = await StudentModel.findById(id)
      .populate('userId', 'name phone email status createdAt')
      .populate('subjects', 'name grade')
      .populate('packageId', 'name price');

    if (!student) {
      res.status(404).json({ message: 'الطالب غير موجود' });
      return;
    }

    // Role check: Students can only view their own profile
    if (
      req.user?.role === 'student' &&
      student.userId._id.toString() !== req.user.userId
    ) {
      res.status(403).json({ message: 'غير مصرح لك بعرض بيانات طالب آخر' });
      return;
    }

    res.status(200).json({ student });
  } catch (error) {
    next(error);
  }
}

/**
 * 📲 Get Student QR Code (Encrypted Payload for Scanning)
 * Access: SuperAdmin, Admin, or Student themselves
 */
export async function getStudentQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const student = await StudentModel.findById(id).select('+qrToken');
    if (!student) {
      res.status(404).json({ message: 'الطالب غير موجود' });
      return;
    }

    // Permission check
    if (
      req.user?.role === 'student' &&
      student.userId.toString() !== req.user.userId
    ) {
      res.status(403).json({ message: 'غير مصرح لك باستعراض كود QR لطالب آخر' });
      return;
    }

    // Encrypted payload with AES-256-GCM
    const encryptedPayload = encryptAES(
      JSON.stringify({
        type: 'student',
        token: student.qrToken,
        createdAt: Date.now(),
      })
    );

    res.status(200).json({
      studentId: student._id,
      qrData: encryptedPayload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ✏️ Update Student
 * Access: SuperAdmin, Admin
 */
export async function updateStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      parentName,
      parentPhone,
      grade,
      packageId,
      subjects,
      subscriptionStatus,
      status,
    } = req.body;

    const student = await StudentModel.findById(id);
    if (!student) {
      res.status(404).json({ message: 'الطالب غير موجود' });
      return;
    }

    // Update linked user if needed
    if (name || phone || email !== undefined || status) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      if (email !== undefined) userUpdate.email = email || undefined;
      if (status) userUpdate.status = status;

      await UserModel.findByIdAndUpdate(student.userId, userUpdate);
    }

    // Update student document
    if (parentName !== undefined) student.parentName = parentName;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (grade) student.grade = grade;
    if (packageId !== undefined) student.packageId = packageId || undefined;
    if (subjects) student.subjects = subjects;
    if (subscriptionStatus) student.subscriptionStatus = subscriptionStatus;

    await student.save();

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'UPDATE_STUDENT',
        entity: 'Student',
        entityId: student._id,
        description: `Updated student id ${student._id}`,
        req,
      });
    }

    const updated = await StudentModel.findById(id)
      .populate('userId', 'name phone email status')
      .populate('subjects', 'name grade')
      .populate('packageId', 'name price');

    res.status(200).json({
      message: 'تم تحديث بيانات الطالب بنجاح',
      student: updated,
    });
  } catch (error) {
    next(error);
  }
}
