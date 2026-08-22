import { prisma } from '@cryptra/database';
import { registerHealthCheck } from '@cryptra/monitoring';

/**
 * Register infrastructure health checks (Postgres + Redis).
 * Call once at API boot.
 */
export function registerInfrastructureHealthChecks(): void {
  registerHealthCheck(async () => {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        name: 'postgres',
        status: 'up' as const,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'postgres',
        status: 'down' as const,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'DB unreachable',
      };
    }
  });

  registerHealthCheck(async () => {
    const start = Date.now();
    const url = process.env.REDIS_URL;
    if (!url) {
      return {
        name: 'redis',
        status: 'degraded' as const,
        latencyMs: Date.now() - start,
        message: 'REDIS_URL not set',
      };
    }

    try {
      // Lightweight PING without hard dependency on ioredis package shape
      const { default: Redis } = await import('ioredis');
      const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: true,
      });
      await client.connect();
      const pong = await client.ping();
      await client.quit().catch(() => undefined);
      return {
        name: 'redis',
        status: pong === 'PONG' ? ('up' as const) : ('degraded' as const),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'down' as const,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Redis unreachable',
      };
    }
  });
}
