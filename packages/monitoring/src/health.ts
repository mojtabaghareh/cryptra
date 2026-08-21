export interface HealthCheckResult {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
}

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheckResult[];
}

type Checker = () => Promise<HealthCheckResult>;

const checkers: Checker[] = [];

export function registerHealthCheck(checker: Checker): void {
  checkers.push(checker);
}

export async function runHealthChecks(): Promise<HealthReport> {
  const results = await Promise.all(
    checkers.map(async (checker) => {
      const start = Date.now();
      try {
        const result = await checker();
        return { ...result, latencyMs: result.latencyMs ?? Date.now() - start };
      } catch (error) {
        return {
          name: 'unknown',
          status: 'down' as const,
          latencyMs: Date.now() - start,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
  );

  const hasDown = results.some((r) => r.status === 'down');
  const hasDegraded = results.some((r) => r.status === 'degraded');

  let status: HealthReport['status'] = 'healthy';
  if (hasDown) status = 'unhealthy';
  else if (hasDegraded) status = 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: results,
  };
}

/** Built-in process health */
registerHealthCheck(async () => ({
  name: 'process',
  status: 'up',
  message: `memory ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
}));
