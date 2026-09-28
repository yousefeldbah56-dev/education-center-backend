import { Request, Response, NextFunction } from 'express';
import { VideoModel } from '../models/Video.model.js';
import { PdfModel } from '../models/Pdf.model.js';
import { StudentModel } from '../models/Student.model.js';
import { SubjectModel } from '../models/Subject.model.js';
import { createAuditLog } from '../utils/auditLog.js';
import { getMediaUrl } from '../utils/s3.js';

// ─── Video Controller ──────────────────────────────────────────

/**
 * 🎬 Upload / Register Video
 * Access: SuperAdmin, Admin, Teacher
 */
export async function createVideo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, subjectId, grade, url, duration, isFreePreview, sortOrder } = req.body;

    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
      res.status(404).json({ message: 'المادة المحددة غير موجودة' });
      return;
    }

    const resolvedUrl = getMediaUrl(url);

    const video = await VideoModel.create({
      title,
      subjectId,
      grade,
      url: resolvedUrl,
      duration: duration || 0,
      isFreePreview: !!isFreePreview,
      sortOrder: sortOrder || 0,
      uploadedBy: req.user!.userId,
      isActive: true,
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_VIDEO',
        entity: 'Video',
        entityId: video._id,
        description: `Uploaded video: ${title} (${grade})`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم إضافة الفيديو بنجاح',
      video,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🎬 Get Videos (Subscription Gated for Students)
 * Access: SuperAdmin, Admin, Teacher, Student
 */
export async function getVideos(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { subjectId, grade } = req.query;
    const filter: any = { isActive: true };

    if (grade) filter.grade = grade;
    if (subjectId) filter.subjectId = subjectId;

    // 🛡️ Subscription Security Gate for Students
    if (req.user?.role === 'student') {
      const student = await StudentModel.findOne({ userId: req.user.userId });
      if (!student) {
        res.status(404).json({ message: 'حساب الطالب غير موجود' });
        return;
      }

      // If student subscription is inactive or overdue, only allow free preview lessons!
      if (student.subscriptionStatus !== 'active') {
        filter.isFreePreview = true;
      } else {
        // Active student: can see free preview OR lessons for their enrolled subjects
        filter.$or = [
          { isFreePreview: true },
          { subjectId: { $in: student.subjects } },
        ];
      }
    }

    const videos = await VideoModel.find(filter)
      .populate('subjectId', 'name grade')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({ data: videos });
  } catch (error) {
    next(error);
  }
}

/**
 * 🎬 Get Single Video by ID (Access Gated)
 */
export async function getVideoById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const video = await VideoModel.findById(id).populate('subjectId', 'name grade');
    if (!video || !video.isActive) {
      res.status(404).json({ message: 'الفيديو غير موجود' });
      return;
    }

    // Security Gate for Students
    if (req.user?.role === 'student' && !video.isFreePreview) {
      const student = await StudentModel.findOne({ userId: req.user.userId });
      if (!student || student.subscriptionStatus !== 'active') {
        res.status(403).json({
          message: 'يجب تجديد الاشتراك وسداد الرسوم للوصول إلى هذا الدرس',
        });
        return;
      }

      const isEnrolled = student.subjects.some(
        (s) => s.toString() === video.subjectId._id.toString()
      );
      if (!isEnrolled) {
        res.status(403).json({
          message: 'أنت غير مسجل في هذه المادة الدراسية',
        });
        return;
      }
    }

    res.status(200).json({ video });
  } catch (error) {
    next(error);
  }
}

/**
 * 🎬 Update Video
 * Access: SuperAdmin, Admin, Teacher
 */
export async function updateVideo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { title, url, duration, isFreePreview, sortOrder, isActive } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (url) updateData.url = getMediaUrl(url);
    if (duration !== undefined) updateData.duration = duration;
    if (isFreePreview !== undefined) updateData.isFreePreview = isFreePreview;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const video = await VideoModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!video) {
      res.status(404).json({ message: 'الفيديو غير موجود' });
      return;
    }

    res.status(200).json({
      message: 'تم تحديث الفيديو بنجاح',
      video,
    });
  } catch (error) {
    next(error);
  }
}

// ─── PDF Controller ────────────────────────────────────────────

/**
 * 📄 Upload / Register PDF
 * Access: SuperAdmin, Admin, Teacher
 */
export async function createPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, subjectId, grade, url, fileSize, isFreePreview, sortOrder } = req.body;

    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
      res.status(404).json({ message: 'المادة المحددة غير موجودة' });
      return;
    }

    const resolvedUrl = getMediaUrl(url);

    const pdf = await PdfModel.create({
      title,
      subjectId,
      grade,
      url: resolvedUrl,
      fileSize: fileSize || 0,
      isFreePreview: !!isFreePreview,
      sortOrder: sortOrder || 0,
      uploadedBy: req.user!.userId,
      isActive: true,
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_PDF',
        entity: 'Pdf',
        entityId: pdf._id,
        description: `Uploaded PDF: ${title} (${grade})`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم إضافة الملف بنجاح',
      pdf,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📄 Get PDFs (Subscription Gated for Students)
 * Access: SuperAdmin, Admin, Teacher, Student
 */
export async function getPdfs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { subjectId, grade } = req.query;
    const filter: any = { isActive: true };

    if (grade) filter.grade = grade;
    if (subjectId) filter.subjectId = subjectId;

    // 🛡️ Subscription Security Gate for Students
    if (req.user?.role === 'student') {
      const student = await StudentModel.findOne({ userId: req.user.userId });
      if (!student) {
        res.status(404).json({ message: 'حساب الطالب غير موجود' });
        return;
      }

      if (student.subscriptionStatus !== 'active') {
        filter.isFreePreview = true;
      } else {
        filter.$or = [
          { isFreePreview: true },
          { subjectId: { $in: student.subjects } },
        ];
      }
    }

    const pdfs = await PdfModel.find(filter)
      .populate('subjectId', 'name grade')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({ data: pdfs });
  } catch (error) {
    next(error);
  }
}

/**
 * 📄 Get Single PDF by ID (Access Gated)
 */
export async function getPdfById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const pdf = await PdfModel.findById(id).populate('subjectId', 'name grade');
    if (!pdf || !pdf.isActive) {
      res.status(404).json({ message: 'الملف غير موجود' });
      return;
    }

    // Security Gate for Students
    if (req.user?.role === 'student' && !pdf.isFreePreview) {
      const student = await StudentModel.findOne({ userId: req.user.userId });
      if (!student || student.subscriptionStatus !== 'active') {
        res.status(403).json({
          message: 'يجب تجديد الاشتراك وسداد الرسوم للوصول إلى هذا الملف',
        });
        return;
      }

      const isEnrolled = student.subjects.some(
        (s) => s.toString() === pdf.subjectId._id.toString()
      );
      if (!isEnrolled) {
        res.status(403).json({
          message: 'أنت غير مسجل في هذه المادة الدراسية',
        });
        return;
      }
    }

    res.status(200).json({ pdf });
  } catch (error) {
    next(error);
  }
}

/**
 * 📄 Update PDF
 * Access: SuperAdmin, Admin, Teacher
 */
export async function updatePdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { title, url, fileSize, isFreePreview, sortOrder, isActive } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (url) updateData.url = getMediaUrl(url);
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (isFreePreview !== undefined) updateData.isFreePreview = isFreePreview;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const pdf = await PdfModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!pdf) {
      res.status(404).json({ message: 'الملف غير موجود' });
      return;
    }

    res.status(200).json({
      message: 'تم تحديث الملف بنجاح',
      pdf,
    });
  } catch (error) {
    next(error);
  }
}
