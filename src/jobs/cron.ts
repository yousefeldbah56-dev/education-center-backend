import { StudentModel } from '../models/Student.model.js';
import { InvoiceModel } from '../models/Invoice.model.js';
import { PackageModel } from '../models/Package.model.js';
import { SettingModel } from '../models/Setting.model.js';
import { NotificationService } from '../services/notification.service.js';

/**
 * ⏰ Cron Jobs Manager for Education Center System
 * Runs automated background tasks without requiring third-party cron daemons.
 */

let lastMonthInvoiced: string = '';
let lastDayChecked: string = '';

/**
 * 🧾 Monthly Invoicing Automation
 * Runs on the 1st day of each month to generate invoices for all active students.
 */
export async function runMonthlyInvoicing(): Promise<{ generated: number; skipped: number }> {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`⏰ [Cron] Running monthly invoice generation for month: ${currentMonth}...`);

    const students = await StudentModel.find({
      subscriptionStatus: { $in: ['active', 'pending'] },
    }).populate('packageId', 'price');

    let generated = 0;
    let skipped = 0;

    // Due date is set to the 10th of the month
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 10, 23, 59, 59);

    for (const student of students) {
      // Check if invoice already generated
      const existing = await InvoiceModel.findOne({
        studentId: student._id,
        month: currentMonth,
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Calculate total amount from package or default
      const packageDoc = student.packageId as any;
      const totalAmount = packageDoc?.price || 500; // Default center monthly fee if no package

      const invoice = await InvoiceModel.create({
        studentId: student._id,
        month: currentMonth,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: 'pending',
        dueDate,
        notes: `فاتورة شهرية مجدولة تلقائياً (${currentMonth})`,
      });

      generated++;

      // Trigger notification to student device
      NotificationService.notifyInvoice(
        student.userId.toString(),
        'الطالب',
        currentMonth,
        totalAmount
      ).catch(() => {});
    }

    console.log(`✅ [Cron] Invoicing completed: ${generated} generated, ${skipped} skipped.`);
    lastMonthInvoiced = currentMonth;
    return { generated, skipped };
  } catch (error) {
    console.error('❌ [Cron] Error running monthly invoicing:', error);
    return { generated: 0, skipped: 0 };
  }
}

/**
 * ⚠️ Overdue Subscriptions Resolver
 * Runs daily to check invoices that passed grace period and updates student status to 'overdue'.
 */
export async function resolveOverdueSubscriptions(): Promise<{ updated: number }> {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    console.log(`⏰ [Cron] Checking overdue subscriptions for ${todayStr}...`);

    // Fetch grace period from settings
    const graceSetting = await SettingModel.findOne({ key: 'grace_period_days' });
    const gracePeriodDays = Number(graceSetting?.value) || 10;

    // Threshold date: dueDate + gracePeriodDays < now  =>  dueDate < now - gracePeriodDays
    const thresholdDate = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);

    const overdueInvoices = await InvoiceModel.find({
      dueDate: { $lt: thresholdDate },
      remainingAmount: { $gt: 0 },
      status: { $in: ['pending', 'partial'] },
    }).distinct('studentId');

    if (overdueInvoices.length > 0) {
      await StudentModel.updateMany(
        {
          _id: { $in: overdueInvoices },
          subscriptionStatus: 'active',
        },
        { subscriptionStatus: 'overdue' }
      );
    }

    console.log(`✅ [Cron] Overdue check completed: ${overdueInvoices.length} students flagged.`);
    lastDayChecked = todayStr;
    return { updated: overdueInvoices.length };
  } catch (error) {
    console.error('❌ [Cron] Error checking overdue subscriptions:', error);
    return { updated: 0 };
  }
}

/**
 * 🚀 Start Background Schedulers
 * Checks every hour to execute tasks on schedule.
 */
export function startCronJobs(): void {
  console.log('⏰ Background Cron Engine Initialized.');

  // Run initial overdue check 10 seconds after server startup
  setTimeout(() => {
    resolveOverdueSubscriptions().catch(console.error);
  }, 10000);

  // Check every 1 hour (3600000 ms)
  setInterval(async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Check if it's the 1st day of the month and hasn't run yet
    if (now.getDate() === 1 && lastMonthInvoiced !== currentMonth) {
      await runMonthlyInvoicing();
    }

    // Check once per day for overdue subscriptions
    if (lastDayChecked !== todayStr) {
      await resolveOverdueSubscriptions();
    }
  }, 60 * 60 * 1000);
}
