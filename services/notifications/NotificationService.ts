import { prisma } from '@cryptra/database';

export class NotificationService {
  async list(userId: string, limit = 40) {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      return [];
    }
  }

  async markRead(userId: string, id: string) {
    try {
      return await prisma.notification.updateMany({
        where: { id, userId },
        data: { readAt: new Date() },
      });
    } catch {
      return { count: 0 };
    }
  }
}

export const notificationService = new NotificationService();
