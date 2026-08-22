import { prisma } from '@cryptra/database';
import { registerHealthCheck } from '@cryptra/monitoring';

/**
 * Register infrastructure health checks (DB, optional Redis later).
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
}
