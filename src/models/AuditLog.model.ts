import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: Types.ObjectId;
  ip?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  description?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'logout',
        'payment',
        'refund',
        'attendance_scan',
        'session_create',
        'session_cancel',
        'subscription_update',
        'teacher_payout',
        'password_change',
        'role_change',
        'settings_update',
      ],
      index: true,
    },
    entity: {
      type: String,
      required: [true, 'Entity type is required'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    ip: {
      type: String,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // 🛡️ Audit logs are immutable — no updatedAt
  }
);

// Query optimization for audit trail lookups
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
