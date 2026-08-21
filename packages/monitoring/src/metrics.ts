import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry, prefix: 'cryptra_' });

export const httpRequestDuration = new Histogram({
  name: 'cryptra_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

export const httpRequestTotal = new Counter({
  name: 'cryptra_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

export const swapQuotesTotal = new Counter({
  name: 'cryptra_swap_quotes_total',
  help: 'Total swap quotes requested',
  labelNames: ['protocol', 'status'],
  registers: [registry],
});

export const ordersTotal = new Counter({
  name: 'cryptra_orders_total',
  help: 'Total perpetual orders',
  labelNames: ['protocol', 'side', 'status'],
  registers: [registry],
});

export const activeUsersGauge = new Gauge({
  name: 'cryptra_active_users',
  help: 'Approximate active users (updated periodically)',
  registers: [registry],
});

export const queueJobsGauge = new Gauge({
  name: 'cryptra_queue_jobs',
  help: 'Jobs in queue by status',
  labelNames: ['queue', 'status'],
  registers: [registry],
});

export async function getMetricsText(): Promise<string> {
  return registry.metrics();
}
