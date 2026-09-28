import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITeacher extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  salaryPercentage: number;
  qrToken: string;
  subjects: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    salaryPercentage: {
      type: Number,
      required: [true, 'Teacher salary percentage is required'],
      min: [0, 'Salary percentage cannot be negative'],
      max: [100, 'Salary percentage cannot exceed 100%'],
      default: 50,
    },
    // 🛡️ Teacher has a fixed QR for attendance check-in
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // 🛡️ Not returned by default
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
  },
  { timestamps: true }
);

export const TeacherModel = mongoose.model<ITeacher>('Teacher', teacherSchema);
