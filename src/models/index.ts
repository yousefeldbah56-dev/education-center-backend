// Barrel export for all Mongoose models
export { UserModel } from './User.model.js';
export { StudentModel } from './Student.model.js';
export { TeacherModel } from './Teacher.model.js';
export { SubjectModel } from './Subject.model.js';
export { GroupModel } from './Group.model.js';
export { SessionModel } from './Session.model.js';
export { AttendanceModel } from './Attendance.model.js';
export { TeacherAttendanceModel } from './TeacherAttendance.model.js';
export { PackageModel } from './Package.model.js';
export { InvoiceModel } from './Invoice.model.js';
export { PaymentModel } from './Payment.model.js';
export { TeacherWalletModel } from './TeacherWallet.model.js';
export { StudentSubscriptionModel } from './StudentSubscription.model.js';
export { ExpenseModel } from './Expense.model.js';
export { VideoModel } from './Video.model.js';
export { PdfModel } from './Pdf.model.js';
export { AuditLogModel } from './AuditLog.model.js';
export { SettingModel } from './Setting.model.js';

// Re-export types
export type { IUser, UserRole, UserStatus } from './User.model.js';
export type { IStudent, SubscriptionStatus } from './Student.model.js';
export type { ITeacher } from './Teacher.model.js';
export type { ISubject } from './Subject.model.js';
export type { IGroup, IGroupSchedule } from './Group.model.js';
export type { ISession, SessionStatus } from './Session.model.js';
export type { IAttendance, AttendanceStatus } from './Attendance.model.js';
export type { ITeacherAttendance, TeacherAttendanceStatus } from './TeacherAttendance.model.js';
export type { IPackage } from './Package.model.js';
export type { IInvoice, InvoiceStatus } from './Invoice.model.js';
export type { IPayment, PaymentMethod } from './Payment.model.js';
export type { ITeacherWallet, WalletEntryStatus } from './TeacherWallet.model.js';
export type { IStudentSubscription, SubscriptionStatusType } from './StudentSubscription.model.js';
export type { IExpense, ExpenseCategory } from './Expense.model.js';
export type { IVideo } from './Video.model.js';
export type { IPdf } from './Pdf.model.js';
export type { IAuditLog } from './AuditLog.model.js';
export type { ISetting } from './Setting.model.js';
