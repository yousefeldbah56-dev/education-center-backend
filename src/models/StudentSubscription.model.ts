import mongoose, { Document, Schema, Types } from 'mongoose';

export type SubscriptionStatusType = 'active' | 'pending' | 'overdue' | 'suspended' | 'expired';

export interface IStudentSubscription extends Document {
  studentId: Types.ObjectId;
  packageId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  nextPaymentDate: Date;
  gracePeriodDays: number;
  status: SubscriptionStatusType;
  createdAt: Date;
  updatedAt: Date;
}

const studentSubscriptionSchema = new Schema<IStudentSubscription>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    nextPaymentDate: {
      type: Date,
      required: true,
    },
    gracePeriodDays: {
      type: Number,
      default: 10,
      min: [0, 'Grace period cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'overdue', 'suspended', 'expired'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const StudentSubscriptionModel = mongoose.model<IStudentSubscription>(
  'StudentSubscription',
  studentSubscriptionSchema
);
