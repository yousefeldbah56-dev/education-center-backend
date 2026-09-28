import mongoose, { Document, Schema, Types } from 'mongoose';

export type SubscriptionStatus = 'active' | 'pending' | 'overdue' | 'suspended';

export interface IStudent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  parentName?: string;
  parentPhone?: string;
  grade: string;
  qrToken: string;
  qrTokenUpdatedAt: Date;
  packageId?: Types.ObjectId;
  subjects: Types.ObjectId[];
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    parentName: {
      type: String,
      trim: true,
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      trim: true,
      index: true,
    },
    // 🛡️ Security: QR Token is cryptographically random, NEVER contains studentId
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // 🛡️ Not returned by default to avoid leaking tokens
    },
    qrTokenUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    subscriptionStatus: {
      type: String,
      enum: ['active', 'pending', 'overdue', 'suspended'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.model<IStudent>('Student', studentSchema);
