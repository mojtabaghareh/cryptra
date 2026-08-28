import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }
  return redis;
}

export type IdempotencyClaim =
  | { status: 'acquired' }
  | { status: 'replay'; body: string }
  | { status: 'in_progress' }
  | { status: 'unavailable' };

/**
 * Claim an idempotency key for financial side-effects.
 * Uses Redis SET NX when available; returns unavailable if Redis is down
 * so callers can fall back to DB-level checks.
 */
export async function claimIdempotencyKey(
  scope: string,
  key: string,
  ttlSeconds = 86_400,
): Promise<IdempotencyClaim> {
  const client = getRedis();
  if (!client) return { status: 'unavailable' };

  const redisKey = `idem:${scope}:${key}`;

  try {
    if (client.status !== 'ready') {
      await client.connect().catch(() => undefined);
    }

    const existing = await client.get(redisKey);
    if (existing === 'PENDING') return { status: 'in_progress' };
    if (existing && existing !== 'PENDING') {
      return { status: 'replay', body: existing };
    }

    const ok = await client.set(redisKey, 'PENDING', 'EX', ttlSeconds, 'NX');
    if (ok !== 'OK') {
      const again = await client.get(redisKey);
      if (again && again !== 'PENDING') return { status: 'replay', body: again };
      return { status: 'in_progress' };
    }
    return { status: 'acquired' };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function completeIdempotencyKey(
  scope: string,
  key: string,
  responseJson: string,
  ttlSeconds = 86_400,
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  const redisKey = `idem:${scope}:${key}`;
  try {
    await client.set(redisKey, responseJson, 'EX', ttlSeconds);
  } catch {
    // non-fatal
  }
}

export async function releaseIdempotencyKey(scope: string, key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(`idem:${scope}:${key}`);
  } catch {
    // non-fatal
  }
}
