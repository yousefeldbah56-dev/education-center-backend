import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'pending' | 'present' | 'absent' | 'late';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttendanceStatus;
  checkInTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'present', 'absent', 'late'],
      default: 'pending',
      index: true,
    },
    checkInTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

// 🛡️ Prevent double attendance: one record per student per session
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const AttendanceModel = mongoose.model<IAttendance>('Attendance', attendanceSchema);
