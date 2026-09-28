import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGroupSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  grade: string;
  schedule: IGroupSchedule[];
  capacity: number;
  currentCount: number;
  students: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupScheduleSchema = new Schema<IGroupSchedule>(
  {
    day: {
      type: String,
      required: true,
      enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
  },
  { _id: false }
);

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
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
    grade: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    schedule: {
      type: [groupScheduleSchema],
      required: true,
      validate: {
        validator: (v: IGroupSchedule[]) => v.length > 0,
        message: 'Group must have at least one scheduled day',
      },
    },
    capacity: {
      type: Number,
      required: [true, 'Group capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [200, 'Capacity cannot exceed 200'],
    },
    currentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

groupSchema.index({ subjectId: 1, name: 1 }, { unique: true });

export const GroupModel = mongoose.model<IGroup>('Group', groupSchema);
