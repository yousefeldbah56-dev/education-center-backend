import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubject extends Document {
  _id: Types.ObjectId;
  name: string;
  grade: string;
  teacherId: Types.ObjectId;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      trim: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required for a subject'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: same subject name per grade should be unique
subjectSchema.index({ name: 1, grade: 1 }, { unique: true });

export const SubjectModel = mongoose.model<ISubject>('Subject', subjectSchema);
