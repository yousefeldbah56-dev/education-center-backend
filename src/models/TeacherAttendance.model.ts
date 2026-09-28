import mongoose, { Document, Schema, Types } from 'mongoose';

export type TeacherAttendanceStatus = 'present' | 'absent';

export interface ITeacherAttendance extends Document {
  _id: Types.ObjectId;
  teacherId: Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  status: TeacherAttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const teacherAttendanceSchema = new Schema<ITeacherAttendance>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    checkInTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'absent',
    },
  },
  { timestamps: true }
);

// One attendance record per teacher per day
teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export const TeacherAttendanceModel = mongoose.model<ITeacherAttendance>(
  'TeacherAttendance',
  teacherAttendanceSchema
);
