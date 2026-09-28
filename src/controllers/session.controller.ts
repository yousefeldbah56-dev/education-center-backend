import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SessionModel } from '../models/Session.model.js';
import { AttendanceModel } from '../models/Attendance.model.js';
import { GroupModel } from '../models/Group.model.js';
import { StudentModel } from '../models/Student.model.js';
import { TeacherModel } from '../models/Teacher.model.js';
import { TeacherAttendanceModel } from '../models/TeacherAttendance.model.js';
import { generateSecureToken, encryptAES, decryptAES } from '../utils/crypto.js';
import { createAuditLog } from '../utils/auditLog.js';
import { env } from '../config/env.js';
import { NotificationService } from '../services/notification.service.js';

// ─── Sessions ──────────────────────────────────────────────────

/**
 * 📅 Create Session
 * Automatically populates pending attendance records for all enrolled group students
 * Access: SuperAdmin, Admin
 */
export async function createSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { subjectId, teacherId, groupId, date, startTime, endTime } = req.body;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      res.status(404).json({ message: 'المجموعة المحددة غير موجودة' });
      return;
    }

    const qrToken = generateSecureToken(32);
    const qrTokenExpiresAt = new Date(
      Date.now() + env.QR_ROTATION_INTERVAL_SECONDS * 1000
    );

    const session = await SessionModel.create({
      subjectId,
      teacherId,
      groupId,
      date: new Date(date),
      startTime,
      endTime,
      qrToken,
      qrTokenExpiresAt,
      status: 'upcoming',
    });

    // Automatically create initial 'pending' attendance records for enrolled students
    if (group.students && group.students.length > 0) {
      const attendanceDocs = group.students.map((studentId) => ({
        sessionId: session._id,
        studentId,
        status: 'pending',
      }));
      await AttendanceModel.insertMany(attendanceDocs, { ordered: false });
    }

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_SESSION',
        entity: 'Session',
        entityId: session._id,
        description: `Created session for group ${group.name} on ${date}`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم إنشاء الحصة بنجاح وتجهيز سجل الحضور',
      session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📅 Get Sessions
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date, groupId, teacherId, status } = req.query;
    const filter: any = {};

    if (groupId) filter.groupId = groupId;
    if (teacherId) filter.teacherId = teacherId;
    if (status) filter.status = status;
    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const sessions = await SessionModel.find(filter)
      .populate('subjectId', 'name grade')
      .populate('groupId', 'name capacity currentCount')
      .populate({
        path: 'teacherId',
        select: 'userId salaryPercentage',
        populate: { path: 'userId', select: 'name phone' },
      })
      .sort({ date: -1, startTime: -1 });

    res.status(200).json({ data: sessions });
  } catch (error) {
    next(error);
  }
}

/**
 * 📅 Get Session Details with Attendance Records
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getSessionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const session = await SessionModel.findById(id)
      .populate('subjectId', 'name grade')
      .populate('groupId', 'name capacity currentCount')
      .populate({
        path: 'teacherId',
        select: 'userId salaryPercentage',
        populate: { path: 'userId', select: 'name phone' },
      });

    if (!session) {
      res.status(404).json({ message: 'الحصة غير موجودة' });
      return;
    }

    const attendances = await AttendanceModel.find({ sessionId: id })
      .populate({
        path: 'studentId',
        select: 'userId grade parentPhone subscriptionStatus',
        populate: { path: 'userId', select: 'name phone' },
      })
      .sort({ createdAt: 1 });

    res.status(200).json({
      session,
      attendances,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🔄 Get Rotating Dynamic QR for Live Session Display
 * Rotates token every QR_ROTATION_INTERVAL_SECONDS to prevent screenshot sharing
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getSessionRotatingQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const session = await SessionModel.findById(id).select('+qrToken');
    if (!session) {
      res.status(404).json({ message: 'الحصة غير موجودة' });
      return;
    }

    const now = new Date();
    // If expired or within 3 seconds of expiry, rotate immediately
    if (session.qrTokenExpiresAt <= new Date(now.getTime() + 3000)) {
      session.qrToken = generateSecureToken(32);
      session.qrTokenExpiresAt = new Date(
        now.getTime() + env.QR_ROTATION_INTERVAL_SECONDS * 1000
      );
      await session.save();
    }

    const remainingMs = session.qrTokenExpiresAt.getTime() - now.getTime();

    const encryptedPayload = encryptAES(
      JSON.stringify({
        type: 'session',
        sessionId: session._id,
        token: session.qrToken,
        expiresAt: session.qrTokenExpiresAt.getTime(),
      })
    );

    res.status(200).json({
      sessionId: session._id,
      qrData: encryptedPayload,
      expiresInSeconds: Math.max(1, Math.floor(remainingMs / 1000)),
      expiresAt: session.qrTokenExpiresAt,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Attendance Recording ──────────────────────────────────────

/**
 * 📷 Admin/Staff scans Student QR Card for a Session
 * Decrypts student card and marks attendance
 * Access: SuperAdmin, Admin, Teacher
 */
export async function scanStudentQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId, qrData } = req.body;

    // Decrypt AES-256-GCM
    let payloadStr: string;
    try {
      payloadStr = decryptAES(qrData);
    } catch {
      res.status(400).json({ message: 'كود الـ QR غير صالح أو تم التلاعب به' });
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      res.status(400).json({ message: 'صيغة كود QR غير صالحة' });
      return;
    }

    if (payload.type !== 'student' || !payload.token) {
      res.status(400).json({ message: 'كود QR غير مخصص للطلاب' });
      return;
    }

    const student = await StudentModel.findOne({ qrToken: payload.token })
      .select('+qrToken')
      .populate('userId', 'name phone status');

    if (!student) {
      res.status(404).json({ message: 'الطالب غير موجود في النظام' });
      return;
    }

    // Check if session exists
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'الحصة غير موجودة' });
      return;
    }

    // Double scan check / Record attendance
    const attendance = await AttendanceModel.findOneAndUpdate(
      { sessionId, studentId: student._id },
      {
        status: 'present',
        checkInTime: new Date(),
      },
      { upsert: true, new: true }
    );

    const user = student.userId as any;

    // 📲 Asynchronous Push Notification to Student / Parent Mobile
    if (user?._id) {
      NotificationService.notifyAttendance(
        user._id.toString(),
        user.name || 'الطالب',
        'الحصة الدراسية',
        new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      ).catch((err) => console.error('Notification dispatch error:', err));
    }

    res.status(200).json({
      message: `تم تسجيل حضور الطالب: ${user?.name || ''} بنجاح`,
      student: {
        id: student._id,
        name: user?.name,
        phone: user?.phone,
        subscriptionStatus: student.subscriptionStatus,
      },
      attendance: {
        status: attendance.status,
        checkInTime: attendance.checkInTime,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📲 Student Scans Rotating Live QR from Screen/Projector
 * Validates rotating token & timestamp to prevent replay attacks
 * Access: Student (Authenticated)
 */
export async function studentScanSessionQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'student') {
      res.status(403).json({ message: 'هذه العملية مخصصة للطلاب فقط' });
      return;
    }

    const { qrData } = req.body;

    let payloadStr: string;
    try {
      payloadStr = decryptAES(qrData);
    } catch {
      res.status(400).json({ message: 'كود الـ QR غير صالح أو منتهي الصلاحية' });
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      res.status(400).json({ message: 'صيغة كود QR غير صالحة' });
      return;
    }

    if (payload.type !== 'session' || !payload.sessionId || !payload.token) {
      res.status(400).json({ message: 'كود QR غير مخصص لحصة' });
      return;
    }

    // Expiry check (Replay attack defense)
    if (Date.now() > payload.expiresAt) {
      res.status(400).json({ message: 'انتهت صلاحية كود الـ QR المعروض. يرجى مسح الكود المحدث' });
      return;
    }

    const session = await SessionModel.findById(payload.sessionId).select('+qrToken');
    if (!session) {
      res.status(404).json({ message: 'الحصة غير موجودة' });
      return;
    }

    if (session.qrToken !== payload.token) {
      res.status(400).json({ message: 'تم تحديث كود الـ QR. يرجى إعادة المسح' });
      return;
    }

    // Find student record for logged-in user
    const student = await StudentModel.findOne({ userId: req.user.userId });
    if (!student) {
      res.status(404).json({ message: 'سجل الطالب غير موجود' });
      return;
    }

    // Double scan check: Check if already registered
    const existingAttendance = await AttendanceModel.findOne({
      sessionId: session._id,
      studentId: student._id,
    });

    if (existingAttendance && existingAttendance.status === 'present') {
      res.status(400).json({
        message: 'تم تسجيل حضورك مسبقاً في هذه الحصة',
        checkInTime: existingAttendance.checkInTime,
      });
      return;
    }

    // Mark as present
    const attendance = await AttendanceModel.findOneAndUpdate(
      { sessionId: session._id, studentId: student._id },
      { status: 'present', checkInTime: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: 'تم تسجيل حضورك بنجاح! 🎉',
      checkInTime: attendance.checkInTime,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 👨‍🏫 Record Teacher Attendance
 * Access: SuperAdmin, Admin
 */
export async function recordTeacherAttendance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { qrData } = req.body;

    let payloadStr: string;
    try {
      payloadStr = decryptAES(qrData);
    } catch {
      res.status(400).json({ message: 'كود QR المدرس غير صالح' });
      return;
    }

    const payload = JSON.parse(payloadStr);
    if (payload.type !== 'teacher' || !payload.token) {
      res.status(400).json({ message: 'كود QR غير مخصص للمدرسين' });
      return;
    }

    const teacher = await TeacherModel.findOne({ qrToken: payload.token })
      .select('+qrToken')
      .populate('userId', 'name phone');

    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teacherAttendance = await TeacherAttendanceModel.findOneAndUpdate(
      { teacherId: teacher._id, date: today },
      {
        status: 'present',
        checkInTime: new Date(),
      },
      { upsert: true, new: true }
    );

    const user = teacher.userId as any;

    res.status(200).json({
      message: `تم تسجيل حضور المدرس: ${user?.name || ''} بنجاح`,
      teacherName: user?.name,
      checkInTime: teacherAttendance.checkInTime,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📊 Real-Time Session Attendance Stats
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getSessionStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const [session, attendances] = await Promise.all([
      SessionModel.findById(id).populate('groupId', 'capacity currentCount'),
      AttendanceModel.find({ sessionId: id }),
    ]);

    if (!session) {
      res.status(404).json({ message: 'الحصة غير موجودة' });
      return;
    }

    const total = attendances.length;
    const present = attendances.filter((a) => a.status === 'present').length;
    const absent = attendances.filter((a) => a.status === 'absent').length;
    const late = attendances.filter((a) => a.status === 'late').length;
    const pending = attendances.filter((a) => a.status === 'pending').length;

    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.status(200).json({
      sessionId: id,
      stats: {
        total,
        present,
        absent,
        late,
        pending,
        attendancePercentage: percentage,
      },
    });
  } catch (error) {
    next(error);
  }
}
