import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createUserService } from '@cryptra/service-users';
import {
  httpRequestDuration,
  httpRequestTotal,
  getMetricsText,
  runHealthChecks,
  alertError,
} from '@cryptra/monitoring';
import { registerInfrastructureHealthChecks } from './health/register';
import { registerRateLimit } from './middleware/rateLimit';
import { registerErrorHandler } from './middleware/errorHandler';
import { userRoutes } from './routes/user.routes';
import { walletRoutes } from './routes/wallet.routes';
import { authRoutes } from './routes/auth.routes';
import { marketRoutes } from './routes/market.routes';
import { swapRoutes } from './routes/swap.routes';
import { xpRoutes } from './routes/xp.routes';
import { referralRoutes } from './routes/referral.routes';
import { portfolioRoutes } from './routes/portfolio.routes';
import { reflectionRoutes } from './routes/reflection.routes';
import { leaderboardRoutes } from './routes/leaderboard.routes';
import { ordersRoutes } from './routes/orders.routes';
import { rewardsRoutes } from './routes/rewards.routes';
import { adminRoutes } from './routes/admin.routes';
import { notificationsRoutes } from './routes/notifications.routes';

registerInfrastructureHealthChecks();

function resolveCorsOrigin(): boolean | string[] {
  const raw = (process.env.CORS_ALLOWED_ORIGINS ?? '').trim();
  if (!raw || raw === '*') return true;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

async function buildServer() {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === 'production'
        ? { level: process.env.LOG_LEVEL ?? 'info' }
        : { level: process.env.LOG_LEVEL ?? 'debug', transport: { target: 'pino-pretty' } },
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await app.register(cors, {
    origin: resolveCorsOrigin(),
    credentials: true,
  });
  await app.register(registerRateLimit);

  registerErrorHandler(app);

  app.addHook('onRequest', async (request) => {
    (request as any).startTime = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request, reply) => {
    const start = (request as any).startTime as bigint | undefined;
    if (!start) return;

    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const route = request.routeOptions?.url ?? request.url;
    const labels = {
      method: request.method,
      route,
      status_code: String(reply.statusCode),
    };

    httpRequestDuration.observe(labels, durationSec);
    httpRequestTotal.inc(labels);

    if (reply.statusCode >= 500) {
      void alertError(`http:${request.method} ${route}`, `status=${reply.statusCode}`);
    }
  });

  const userService = createUserService();

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(marketRoutes, { prefix: '/api/v1/market' });
  await app.register(userRoutes, { prefix: '/api/v1/users', userService });
  await app.register(walletRoutes, { prefix: '/api/v1/wallets' });
  await app.register(swapRoutes, { prefix: '/api/v1/swaps' });
  await app.register(xpRoutes, { prefix: '/api/v1/xp' });
  await app.register(referralRoutes, { prefix: '/api/v1/referral' });
  await app.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
  await app.register(reflectionRoutes, { prefix: '/api/v1/reflection' });
  await app.register(leaderboardRoutes, { prefix: '/api/v1/leaderboard' });
  await app.register(ordersRoutes, { prefix: '/api/v1/orders' });
  await app.register(rewardsRoutes, { prefix: '/api/v1/rewards' });
  await app.register(notificationsRoutes, { prefix: '/api/v1/notifications' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  app.get('/health', async () => runHealthChecks());
  app.get('/ready', async () => ({
    status: 'ready',
    timestamp: new Date().toISOString(),
  }));
  app.get('/metrics', async (_request, reply) => {
    const metrics = await getMetricsText();
    return reply.type('text/plain; version=0.0.4').send(metrics);
  });

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

main();
