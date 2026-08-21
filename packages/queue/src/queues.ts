import { Queue, Worker, type Job, type Processor } from 'bullmq';
import { getQueueConnection } from './connection';

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  XP_AWARDS: 'xp-awards',
  AUDIT: 'audit',
  WEBHOOKS: 'webhooks',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export function createWorker<T = unknown>(
  name: QueueName,
  processor: Processor<T>,
  concurrency = 5,
): Worker<T> {
  return new Worker<T>(name, processor, {
    connection: getQueueConnection(),
    concurrency,
  });
}

export async function enqueue<T = unknown>(
  name: QueueName,
  data: T,
  opts?: { delay?: number; priority?: number; jobId?: string },
): Promise<Job<T>> {
  const queue = getQueue(name);
  return queue.add(name, data as any, {
    delay: opts?.delay,
    priority: opts?.priority,
    jobId: opts?.jobId,
  });
}
