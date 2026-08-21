import Redis from 'ioredis';
import { getConfig } from '@cryptra/config';

let connection: Redis | null = null;

export function getQueueConnection(): Redis {
  if (!connection) {
    const config = getConfig();
    connection = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }
  return connection;
}
