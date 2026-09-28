import mongoose, { Document, Schema, Types } from 'mongoose';

export type SessionStatus = 'upcoming' | 'running' | 'finished' | 'cancelled';

export interface ISession extends Document {
  _id: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  groupId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  qrToken: string;
  qrTokenExpiresAt: Date;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Session start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'Session end time is required'],
    },
    // 🛡️ Session-specific rotating QR token, cryptographically random
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // 🛡️ Not returned by default
    },
    qrTokenExpiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'running', 'finished', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate sessions for the same group on the same date and time
sessionSchema.index({ groupId: 1, date: 1, startTime: 1 }, { unique: true });

export const SessionModel = mongoose.model<ISession>('Session', sessionSchema);
