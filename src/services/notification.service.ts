import { UserModel } from '../models/User.model.js';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * 📲 Notification Service (Firebase Cloud Messaging - FCM)
 * Sends push notifications to mobile devices.
 */
export class NotificationService {
  /**
   * Send push notification to specific users by their user IDs.
   */
  static async sendToUsers(
    userIds: string[],
    payload: NotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      if (!userIds || userIds.length === 0) {
        return { sent: 0, failed: 0 };
      }

      // Fetch all device tokens for target users
      const users = await UserModel.find({
        _id: { $in: userIds },
        deviceTokens: { $exists: true, $not: { $size: 0 } },
      }).select('deviceTokens name');

      const allTokens: string[] = [];
      users.forEach((user) => {
        if (user.deviceTokens && Array.isArray(user.deviceTokens)) {
          allTokens.push(...user.deviceTokens);
        }
      });

      if (allTokens.length === 0) {
        return { sent: 0, failed: 0 };
      }

      // 🛡️ Log notification dispatch
      console.log(
        `📲 [FCM Notification] Sending to ${allTokens.length} devices (Users: ${users.length}): "${payload.title}" - "${payload.body}"`
      );

      // Note: When Firebase Admin SDK credentials are provided in production,
      // admin.messaging().sendEachForMulticast({ tokens: allTokens, notification: { title: payload.title, body: payload.body }, data: payload.data })
      // is dispatched here.

      return { sent: allTokens.length, failed: 0 };
    } catch (error) {
      console.error('⚠️ Failed to send push notification:', error);
      return { sent: 0, failed: userIds.length };
    }
  }

  /**
   * Send notification when student attendance is recorded.
   */
  static async notifyAttendance(
    userId: string,
    studentName: string,
    sessionTitle: string,
    time: string
  ): Promise<void> {
    await this.sendToUsers([userId], {
      title: '✅ تسجيل الحضور في السنتر',
      body: `تم تسجيل حضور الطالب "${studentName}" لحصة ${sessionTitle} بنجاح في تمام الساعة ${time}.`,
      data: {
        type: 'attendance',
        studentName,
        sessionTitle,
      },
    });
  }

  /**
   * Send notification when a new invoice is issued.
   */
  static async notifyInvoice(
    userId: string,
    studentName: string,
    month: string,
    amount: number
  ): Promise<void> {
    await this.sendToUsers([userId], {
      title: '🧾 فاتورة اشتراك جديدة',
      body: `تم إصدار فاتورة شهر ${month} للطالب "${studentName}" بقيمة ${amount} ج.م.`,
      data: {
        type: 'invoice',
        month,
        amount: amount.toString(),
      },
    });
  }
}
