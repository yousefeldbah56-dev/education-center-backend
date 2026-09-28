import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPackage extends Document {
  _id: Types.ObjectId;
  name: string;
  grade: string;
  subjects: Types.ObjectId[];
  price: number;
  duration: number; // in days (e.g. 30 for monthly)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
      maxlength: [100, 'Package name cannot exceed 100 characters'],
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      trim: true,
      index: true,
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    price: {
      type: Number,
      required: [true, 'Package price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: true,
      default: 30,
      min: [1, 'Duration must be at least 1 day'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const PackageModel = mongoose.model<IPackage>('Package', packageSchema);
