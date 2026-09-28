import { Request } from 'express';
import { AuditLogModel } from '../models/AuditLog.model.js';
import type { Types } from 'mongoose';

interface AuditLogParams {
  userId: Types.ObjectId | string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: Types.ObjectId | string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  description?: string;
  req?: Request;
}

/**
 * Create an immutable audit log entry.
 * 🛡️ Captures IP address from the request for security tracing.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const ip = params.req
      ? (params.req.headers['x-forwarded-for'] as string) || params.req.ip || 'unknown'
      : 'system';

    await AuditLogModel.create({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ip,
      oldValue: params.oldValue,
      newValue: params.newValue,
      description: params.description,
    });
  } catch (error) {
    // 🛡️ Audit log failures should never crash the main operation
    console.error('⚠️ Failed to create audit log:', error);
  }
}
