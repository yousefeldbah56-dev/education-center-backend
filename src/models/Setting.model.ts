import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISetting extends Document {
  _id: Types.ObjectId;
  key: string;
  value: Schema.Types.Mixed;
  description?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'Setting value is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const SettingModel = mongoose.model<ISetting>('Setting', settingSchema);

// Default settings to seed
export const DEFAULT_SETTINGS = {
  GRACE_PERIOD_DAYS: { key: 'grace_period_days', value: 10, description: 'Days before suspension after subscription expiry' },
  BLOCK_ATTENDANCE_ON_OVERDUE: { key: 'block_attendance_on_overdue', value: false, description: 'Whether to block attendance when payment is overdue' },
  QR_ROTATION_ENABLED: { key: 'qr_rotation_enabled', value: true, description: 'Whether to rotate QR tokens periodically' },
  SESSION_AUTO_CREATE_MINUTES: { key: 'session_auto_create_minutes', value: 15, description: 'Minutes before class to auto-generate session' },
  DEFAULT_TEMP_PASSWORD: { key: 'default_temp_password', value: '12345678', description: 'Default temporary password for new students' },
} as const;
