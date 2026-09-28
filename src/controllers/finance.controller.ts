import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { InvoiceModel } from '../models/Invoice.model.js';
import { PaymentModel } from '../models/Payment.model.js';
import { TeacherWalletModel } from '../models/TeacherWallet.model.js';
import { ExpenseModel } from '../models/Expense.model.js';
import { PackageModel } from '../models/Package.model.js';
import { StudentModel } from '../models/Student.model.js';
import { SubjectModel } from '../models/Subject.model.js';
import { TeacherModel } from '../models/Teacher.model.js';
import { createAuditLog } from '../utils/auditLog.js';

// ─── Invoices ──────────────────────────────────────────────────

/**
 * 🧾 Create Student Invoice
 * Access: SuperAdmin, Admin
 */
export async function createInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId, month, totalAmount, dueDate, notes } = req.body;

    const student = await StudentModel.findById(studentId);
    if (!student) {
      res.status(404).json({ message: 'الطالب غير موجود' });
      return;
    }

    // Prevent duplicate invoice for the same student in the same month
    const existing = await InvoiceModel.findOne({ studentId, month });
    if (existing) {
      res.status(409).json({ message: `تم إصدار فاتورة مسبقاً لهذا الطالب لشهر ${month}` });
      return;
    }

    const invoice = await InvoiceModel.create({
      studentId,
      month,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: 'pending',
      dueDate: new Date(dueDate),
      notes,
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_INVOICE',
        entity: 'Invoice',
        entityId: invoice._id,
        description: `Issued invoice of ${totalAmount} EGP for student ${studentId} (${month})`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم إنشاء الفاتورة بنجاح',
      invoice,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🧾 Get Invoices (Filterable, Paginated)
 * Access: SuperAdmin, Admin, Teacher, Student
 */
export async function getInvoices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId, month, status } = req.query;
    const filter: any = {};

    // Role safety: Students can only see their own invoices
    if (req.user?.role === 'student') {
      const student = await StudentModel.findOne({ userId: req.user.userId });
      if (!student) {
        res.status(404).json({ message: 'حساب الطالب غير موجود' });
        return;
      }
      filter.studentId = student._id;
    } else if (studentId) {
      filter.studentId = studentId;
    }

    if (month) filter.month = month;
    if (status) filter.status = status;

    const invoices = await InvoiceModel.find(filter)
      .populate({
        path: 'studentId',
        select: 'userId grade parentPhone',
        populate: { path: 'userId', select: 'name phone' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ data: invoices });
  } catch (error) {
    next(error);
  }
}

// ─── Payments & Teacher Wallet ─────────────────────────────────

/**
 * 💳 Record Payment (Transaction-safe with Teacher Wallet Crediting)
 * Access: SuperAdmin, Admin
 */
export async function recordPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceId, studentId, amount, method, notes } = req.body;

    const invoice = await InvoiceModel.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      res.status(404).json({ message: 'الفاتورة غير موجودة' });
      return;
    }

    if (invoice.status === 'paid') {
      await session.abortTransaction();
      res.status(400).json({ message: 'هذه الفاتورة مدفوعة بالكامل بالفعل' });
      return;
    }

    // 🛡️ Prevent Overpayment
    if (amount > invoice.remainingAmount) {
      await session.abortTransaction();
      res.status(400).json({
        message: `قيمة الدفعة (${amount}) أكبر من المبلغ المتبقي على الفاتورة (${invoice.remainingAmount})`,
      });
      return;
    }

    const student = await StudentModel.findById(studentId).session(session);
    if (!student) {
      await session.abortTransaction();
      res.status(404).json({ message: 'الطالب غير موجود' });
      return;
    }

    // Create Payment Record
    const [payment] = await PaymentModel.create(
      [
        {
          studentId,
          invoiceId,
          amount,
          method,
          paidDate: new Date(),
          collectedBy: req.user!.userId,
          notes,
        },
      ],
      { session }
    );

    // Update Invoice status
    invoice.paidAmount += amount;
    invoice.remainingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    invoice.status = invoice.remainingAmount === 0 ? 'paid' : 'partial';
    await invoice.save({ session });

    // If fully paid, activate student subscription status
    if (invoice.status === 'paid') {
      student.subscriptionStatus = 'active';
      await student.save({ session });
    }

    // 🛡️ Calculate and Credit Teacher Wallet
    // Fetch subjects student is enrolled in
    if (student.subjects && student.subjects.length > 0) {
      const subjects = await SubjectModel.find({
        _id: { $in: student.subjects },
      }).session(session);

      const portionPerSubject = amount / subjects.length;

      for (const subject of subjects) {
        const teacher = await TeacherModel.findById(subject.teacherId).session(session);
        if (teacher && teacher.salaryPercentage > 0) {
          const teacherCut = Math.round((portionPerSubject * teacher.salaryPercentage) / 100 * 100) / 100;

          if (teacherCut > 0) {
            await TeacherWalletModel.create(
              [
                {
                  teacherId: teacher._id,
                  studentId: student._id,
                  paymentId: payment._id,
                  subjectId: subject._id,
                  amount: teacherCut,
                  status: 'pending',
                },
              ],
              { session }
            );
          }
        }
      }
    }

    await session.commitTransaction();

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'RECORD_PAYMENT',
        entity: 'Payment',
        entityId: payment._id,
        description: `Collected ${amount} EGP for invoice ${invoiceId} via ${method}`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم تسجيل الدفعة بنجاح وتحديث الفاتورة ومحفظة المدرسين',
      payment,
      invoice: {
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingAmount,
        status: invoice.status,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ─── Teacher Wallet & Payouts ──────────────────────────────────

/**
 * 💰 Get Teacher Wallet Summary & Transactions
 * Access: SuperAdmin, Admin, Teacher themselves
 */
export async function getTeacherWallet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { teacherId } = req.params;

    const teacher = await TeacherModel.findById(teacherId).populate(
      'userId',
      'name phone email'
    );
    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    // Role check: Teachers can only view their own wallet
    if (
      req.user?.role === 'teacher' &&
      teacher.userId._id.toString() !== req.user.userId
    ) {
      res.status(403).json({ message: 'غير مصرح لك باستعراض محفظة مدرس آخر' });
      return;
    }

    const entries = await TeacherWalletModel.find({ teacherId })
      .populate('studentId', 'userId grade')
      .populate('subjectId', 'name grade')
      .populate('paymentId', 'amount method paidDate')
      .sort({ createdAt: -1 });

    const totalEarned = entries.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPaidOut = entries
      .filter((e) => e.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const pendingBalance = totalEarned - totalPaidOut;

    res.status(200).json({
      teacher: {
        id: teacher._id,
        name: (teacher.userId as any)?.name,
        salaryPercentage: teacher.salaryPercentage,
      },
      summary: {
        totalEarned: Math.round(totalEarned * 100) / 100,
        totalPaidOut: Math.round(totalPaidOut * 100) / 100,
        pendingBalance: Math.round(pendingBalance * 100) / 100,
      },
      entries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 💸 Settle / Payout Teacher Wallet
 * Marks pending wallet entries as paid
 * Access: SuperAdmin
 */
export async function settleTeacherWallet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { teacherId, amount } = req.body;

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      res.status(404).json({ message: 'المدرس غير موجود' });
      return;
    }

    // Find pending entries
    const pendingEntries = await TeacherWalletModel.find({
      teacherId,
      status: 'pending',
    }).sort({ createdAt: 1 });

    const totalPending = pendingEntries.reduce((acc, curr) => acc + curr.amount, 0);

    if (amount > totalPending) {
      res.status(400).json({
        message: `مبلغ التسوية (${amount}) أكبر من الرصيد المعلق للمدرس (${totalPending})`,
      });
      return;
    }

    let remainingToSettle = amount;
    const settledIds: mongoose.Types.ObjectId[] = [];

    for (const entry of pendingEntries) {
      if (remainingToSettle <= 0) break;

      if (entry.amount <= remainingToSettle) {
        entry.status = 'paid';
        entry.paidAt = new Date();
        entry.paidBy = new mongoose.Types.ObjectId(req.user!.userId);
        await entry.save();
        remainingToSettle -= entry.amount;
        settledIds.push(entry._id);
      }
    }

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'SuperAdmin',
        userRole: req.user.role,
        action: 'SETTLE_TEACHER_WALLET',
        entity: 'TeacherWallet',
        entityId: teacher._id,
        description: `Paid out ${amount} EGP to teacher ${teacherId}`,
        req,
      });
    }

    res.status(200).json({
      message: 'تم تسوية مستحقات المدرس بنجاح',
      settledAmount: amount - remainingToSettle,
      remainingPending: totalPending - amount,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Operating Expenses ────────────────────────────────────────

/**
 * 🏢 Record Center Expense
 * Access: SuperAdmin, Admin
 */
export async function createExpense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, amount, category, date, notes } = req.body;

    const expense = await ExpenseModel.create({
      title,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user!.userId,
      notes,
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        userName: 'Admin',
        userRole: req.user.role,
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense._id,
        description: `Recorded expense: ${title} (${amount} EGP) - ${category}`,
        req,
      });
    }

    res.status(201).json({
      message: 'تم تسجيل المصروف بنجاح',
      expense,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 🏢 Get Expenses
 * Access: SuperAdmin, Admin
 */
export async function getExpenses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, startDate, endDate } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const expenses = await ExpenseModel.find(filter)
      .populate('createdBy', 'name role')
      .sort({ date: -1 });

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      totalExpense,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Packages ──────────────────────────────────────────────────

/**
 * 📦 Create Package
 * Access: SuperAdmin, Admin
 */
export async function createPackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, grade, subjects, price, duration } = req.body;

    const pkg = await PackageModel.create({
      name,
      grade,
      subjects,
      price,
      duration: duration || 30,
      isActive: true,
    });

    res.status(201).json({
      message: 'تم إنشاء الباقة بنجاح',
      package: pkg,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 📦 Get Packages
 * Access: Public / Authenticated
 */
export async function getPackages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { grade } = req.query;
    const filter: any = { isActive: true };
    if (grade) filter.grade = grade;

    const packages = await PackageModel.find(filter)
      .populate('subjects', 'name grade')
      .sort({ price: 1 });

    res.status(200).json({ data: packages });
  } catch (error) {
    next(error);
  }
}

// ─── Financial Analytics & Center Net Profit ───────────────────

/**
 * 📈 Center Financial Summary & Net Profit
 * Revenue - Expenses - Teacher Cuts = Net Profit
 * Access: SuperAdmin
 */
export async function getFinancialSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [payments, expenses, teacherEarnings, overdueInvoices] = await Promise.all([
      PaymentModel.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      ExpenseModel.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      TeacherWalletModel.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      InvoiceModel.aggregate([
        { $match: { remainingAmount: { $gt: 0 } } },
        { $group: { _id: null, totalRemaining: { $sum: '$remainingAmount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = payments[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;
    const totalTeacherCuts = teacherEarnings[0]?.total || 0;
    const netProfit = totalRevenue - totalExpenses - totalTeacherCuts;

    res.status(200).json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalTeacherCuts: Math.round(totalTeacherCuts * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        uncollectedDebt: Math.round((overdueInvoices[0]?.totalRemaining || 0) * 100) / 100,
        unpaidInvoicesCount: overdueInvoices[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}
