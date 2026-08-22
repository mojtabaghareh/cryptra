import 'dotenv/config';
import { createWorker, QUEUE_NAMES } from '@cryptra/queue';
import { notificationService } from '@cryptra/notifications';

interface NotificationJob {
  notificationId: string;
  userId: string;
  channel: 'TELEGRAM' | 'IN_APP';
  title: string;
  body: string;
}

async function main() {
  console.log('[workers] starting...');

  const notificationWorker = createWorker<NotificationJob>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      const { notificationId, userId, channel, title, body } = job.data;
      console.log(`[notifications] delivering ${notificationId} → ${userId}`);
      await notificationService.deliver(notificationId, userId, channel, title, body);
    },
    5,
  );

  notificationWorker.on('completed', (job) => {
    console.log(`[notifications] done ${job.id}`);
  });

  notificationWorker.on('failed', (job, err) => {
    console.error(`[notifications] failed ${job?.id}:`, err.message);
  });

  console.log('[workers] notification worker online');

  const shutdown = async () => {
    console.log('[workers] shutting down...');
    await notificationWorker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[workers] fatal', err);
  process.exit(1);
});
