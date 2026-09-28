import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SubjectModel } from '../models/Subject.model.js';
import { GroupModel } from '../models/Group.model.js';
import { StudentModel } from '../models/Student.model.js';
import { TeacherModel } from '../models/Teacher.model.js';
import { createAuditLog } from '../utils/auditLog.js';

// ─── Subjects ──────────────────────────────────────────────────

/**
 * 📚 Create Subject
 * Access: SuperAdmin, Admin
 */
export async function createSubject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, grade, teacherId, description } = req.body;

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      res.status(404).json({ message: 'المدرس المحدد غير موجود' });
      return;
    }

    const existing = await SubjectModel.findOne({ name, grade });
    if (existing) {
      res.status(409).json({ message: 'هذه المادة مسجلة بالفعل لنفس المرحلة الدراسية' });
      return;
    }

    const subject = await SubjectModel.create({
      name,
      grade,
      teacherId,
      description,
      isActive: true,
    });

    // Automatically add subject to teacher's subjects array
    await TeacherModel.findByIdAndUpdate(teacherId, {
      $addToSet: { subjects: subject._id },
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_SUBJECT',
        entity: 'Subject',
        entityId: subject._id,
        description: `Created subject: ${name} (${grade})`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم إضافة المادة بنجاح',
      subject,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📚 Get All Subjects
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getSubjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { grade, teacherId } = req.query;
    const filter: any = { isActive: true };

    if (grade) filter.grade = grade;
    if (teacherId) filter.teacherId = teacherId;

    const subjects = await SubjectModel.find(filter)
      .populate('teacherId', 'salaryPercentage')
      .sort({ name: 1 });

    res.status(200).json({ data: subjects });
  } catch (error) {
    next(error);
  }
}

// ─── Groups ────────────────────────────────────────────────────

/**
 * 👥 Create Group
 * Access: SuperAdmin, Admin
 */
export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, subjectId, teacherId, grade, capacity, schedule } = req.body;

    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
      res.status(404).json({ message: 'المادة غير موجودة' });
      return;
    }

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    const group = await GroupModel.create({
      name,
      subjectId,
      teacherId,
      grade,
      capacity,
      currentCount: 0,
      students: [],
      schedule,
      isActive: true,
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_GROUP',
        entity: 'Group',
        entityId: group._id,
        description: `Created group: ${name} (Capacity: ${capacity})`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم إنشاء المجموعة بنجاح',
      group,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 👥 Get Groups
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { subjectId, teacherId, grade } = req.query;
    const filter: any = { isActive: true };

    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;
    if (grade) filter.grade = grade;

    const groups = await GroupModel.find(filter)
      .populate('subjectId', 'name grade')
      .populate('teacherId', 'salaryPercentage')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: groups });
  } catch (error) {
    next(error);
  }
}

/**
 * 👥 Get Group By ID
 * Access: SuperAdmin, Admin, Teacher
 */
export async function getGroupById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const group = await GroupModel.findById(id)
      .populate('subjectId', 'name grade')
      .populate('teacherId', 'salaryPercentage')
      .populate({
        path: 'students',
        select: 'userId grade parentPhone subscriptionStatus',
        populate: { path: 'userId', select: 'name phone' },
      });

    if (!group) {
      res.status(404).json({ message: 'المجموعة غير موجودة' });
      return;
    }

    res.status(200).json({ group });
  } catch (error) {
    next(error);
  }
}

/**
 * ➕ Add Student to Group
 * Validates capacity and avoids double enrollment
 * Access: SuperAdmin, Admin
 */
export async function addStudentToGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const [group, student] = await Promise.all([
      GroupModel.findById(id),
      StudentModel.findById(studentId),
    ]);

    if (!group) {
      res.status(404).json({ message: 'المجموعة غير موجودة' });
      return;
    }

    if (!student) {
      res.status(404).json({ message: 'الطالب غير موجود' });
      return;
    }

    // Capacity Check
    if (group.currentCount >= group.capacity) {
      res.status(400).json({
        message: `المجموعة مكتملة العدد (${group.currentCount}/${group.capacity})`,
      });
      return;
    }

    // Double Enrollment Check
    const isAlreadyEnrolled = group.students.some(
      (s) => s.toString() === studentId
    );
    if (isAlreadyEnrolled) {
      res.status(400).json({ message: 'الطالب مسجل بالفعل في هذه المجموعة' });
      return;
    }

    // Atomic update
    group.students.push(student._id);
    group.currentCount = group.students.length;
    await group.save();

    // Link subject to student if not present
    await StudentModel.findByIdAndUpdate(studentId, {
      $addToSet: { subjects: group.subjectId },
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'ADD_STUDENT_TO_GROUP',
        entity: 'Group',
        entityId: group._id,
        description: `Added student ${studentId} to group ${group.name}`,
        req,
      });
    }

    res.status(200).json({
      message: 'تم إضافة الطالب للمجموعة بنجاح',
      currentCount: group.currentCount,
      capacity: group.capacity,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ➖ Remove Student from Group
 * Access: SuperAdmin, Admin
 */
export async function removeStudentFromGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, studentId } = req.params;

    const group = await GroupModel.findById(id);
    if (!group) {
      res.status(404).json({ message: 'المجموعة غير موجودة' });
      return;
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId as string);
    group.students = group.students.filter(
      (s) => !s.equals(studentObjectId)
    );
    group.currentCount = group.students.length;
    await group.save();

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'REMOVE_STUDENT_FROM_GROUP',
        entity: 'Group',
        entityId: group._id,
        description: `Removed student ${studentId} from group ${group.name}`,
        req,
      });
    }

    res.status(200).json({
      message: 'تم حذف الطالب من المجموعة بنجاح',
      currentCount: group.currentCount,
    });
  } catch (error) {
    next(error);
  }
}
