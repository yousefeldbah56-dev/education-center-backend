import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVideo extends Document {
  _id: Types.ObjectId;
  title: string;
  subjectId: Types.ObjectId;
  grade: string;
  url: string; // S3 URL — stored reference only, file lives on S3
  duration?: number; // in seconds
  isFreePreview: boolean;
  sortOrder: number;
  isActive: boolean;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    duration: {
      type: Number,
      min: 0,
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const VideoModel = mongoose.model<IVideo>('Video', videoSchema);
