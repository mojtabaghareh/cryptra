import Redis from 'ioredis';
import { getConfig } from '@cryptra/config';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const config = getConfig();
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }
  return redis;
}

/**
 * Sliding window rate limiter backed by Redis.
 * Key format: rl:{namespace}:{identifier}
 */
export async function checkRateLimit(
  identifier: string,
  options?: {
    namespace?: string;
    windowMs?: number;
    max?: number;
  },
): Promise<RateLimitResult> {
  const config = getConfig();
  const windowMs = options?.windowMs ?? config.RATE_LIMIT_WINDOW_MS;
  const max = options?.max ?? config.RATE_LIMIT_MAX_REQUESTS;
  const namespace = options?.namespace ?? 'global';
  const key = `rl:${namespace}:${identifier}`;

  const client = getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;

  const multi = client.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now.toString(), `${now}:${Math.random()}`);
  multi.zcard(key);
  multi.pexpire(key, windowMs);

  const results = await multi.exec();
  if (!results) {
    // Fail open if Redis is unavailable
    return { allowed: true, remaining: max, resetAt: now + windowMs, limit: max };
  }

  const count = (results[2]?.[1] as number) ?? 0;
  const allowed = count <= max;
  const remaining = Math.max(0, max - count);
  const resetAt = now + windowMs;

  return { allowed, remaining, resetAt, limit: max };
}

export async function resetRateLimit(identifier: string, namespace = 'global'): Promise<void> {
  const client = getRedis();
  await client.del(`rl:${namespace}:${identifier}`);
}
