import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createUserService } from '@cryptra/service-users';
import { createWalletService } from '@cryptra/service-wallets';
import { registerRateLimit } from './middleware/rateLimit';
import { registerErrorHandler } from './middleware/errorHandler';
import { userRoutes } from './routes/user.routes';
import { walletRoutes } from './routes/wallet.routes';

async function buildServer() {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === 'production'
        ? { level: process.env.LOG_LEVEL ?? 'info' }
        : { level: process.env.LOG_LEVEL ?? 'debug', transport: { target: 'pino-pretty' } },
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });
  await app.register(registerRateLimit);

  registerErrorHandler(app);

  const userService = createUserService();
  const walletService = createWalletService();

  await app.register(userRoutes, { prefix: '/api/v1/users', userService });
  await app.register(walletRoutes, { prefix: '/api/v1/wallets', walletService });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

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
