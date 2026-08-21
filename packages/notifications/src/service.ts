import { prisma } from '@cryptra/database';
import { enqueue, QUEUE_NAMES } from '@cryptra/queue';
import { sendTelegramMessage } from './telegram';

export interface NotifyInput {
  userId: string;
  title: string;
  body: string;
  channel?: 'TELEGRAM' | 'IN_APP';
  metadata?: Record<string, unknown>;
  /** If true, enqueue instead of sending immediately */
  async?: boolean;
}

export class NotificationService {
  /**
   * Create a notification record and optionally send it.
   */
  async notify(input: NotifyInput): Promise<{ id: string }> {
    const channel = input.channel ?? 'TELEGRAM';

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        channel,
        title: input.title,
        body: input.body,
        status: 'PENDING',
        metadata: input.metadata ?? undefined,
      },
    });

    if (input.async) {
      await enqueue(QUEUE_NAMES.NOTIFICATIONS, {
        notificationId: notification.id,
        userId: input.userId,
        channel,
        title: input.title,
        body: input.body,
      });
      return { id: notification.id };
    }

    await this.deliver(notification.id, input.userId, channel, input.title, input.body);
    return { id: notification.id };
  }

  async deliver(
    notificationId: string,
    userId: string,
    channel: 'TELEGRAM' | 'IN_APP',
    title: string,
    body: string,
  ): Promise<void> {
    try {
      if (channel === 'TELEGRAM') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { telegramId: true },
        });

        if (!user?.telegramId) {
          throw new Error('User has no telegramId');
        }

        await sendTelegramMessage(user.telegramId.toString(), `<b>${title}</b>\n\n${body}`);
      }

      // IN_APP is already stored in DB as PENDING → mark SENT
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });
      throw error;
    }
  }

  async listForUser(userId: string, limit = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { status: 'READ', readAt: new Date() },
    });
  }
}

export const notificationService = new NotificationService();
