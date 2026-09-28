import mongoose, { Document, Schema, Types } from 'mongoose';

export type WalletEntryStatus = 'pending' | 'paid';

export interface ITeacherWallet extends Document {
  _id: Types.ObjectId;
  teacherId: Types.ObjectId;
  studentId: Types.ObjectId;
  paymentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  amount: number;
  status: WalletEntryStatus;
  paidAt?: Date;
  paidBy?: Types.ObjectId; // SuperAdmin who paid the teacher
  createdAt: Date;
  updatedAt: Date;
}

const teacherWalletSchema = new Schema<ITeacherWallet>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Wallet amount cannot be negative'], // 🛡️ Financial integrity guard
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
      index: true,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// 🛡️ Prevent duplicate wallet entries for the same payment + teacher + subject
teacherWalletSchema.index({ paymentId: 1, teacherId: 1, subjectId: 1 }, { unique: true });

export const TeacherWalletModel = mongoose.model<ITeacherWallet>(
  'TeacherWallet',
  teacherWalletSchema
);
