import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { AppError, ErrorCodes } from '@cryptra/core';
import { registerRateLimit } from './middleware/rateLimit';
import { registerErrorHandler } from './middleware/errorHandler';
import { userRoutes } from './routes/user.routes';
import { walletRoutes } from './routes/wallet.routes';
import type { UserRepository } from './controllers/UserController';
import type { WalletRepository } from './controllers/WalletController';

/**
 * Persistence layer is provided by database/ + services/users /
 * services/wallets once implemented. Until that is wired in, this
 * placeholder honestly reports that persistence is not yet available
 * instead of returning fabricated data.
 */
function createUnimplementedUserRepository(): UserRepository {
  const notImplemented = (): never => {
    throw new AppError({
      code: ErrorCodes.UNKNOWN,
      message: 'User persistence is not yet wired (database/services/users pending).',
      statusCode: 501,
    });
  };
  return {
    create: async () => notImplemented(),
    findById: async () => notImplemented(),
    findByTelegramId: async () => notImplemented(),
    findByReferralCode: async () => notImplemented(),
    update: async () => notImplemented(),
  };
}

function createUnimplementedWalletRepository(): WalletRepository {
  const notImplemented = (): never => {
    throw new AppError({
      code: ErrorCodes.UNKNOWN,
      message: 'Wallet persistence is not yet wired (database/services/wallets pending).',
      statusCode: 501,
    });
  };
  return {
    create: async () => notImplemented(),
    findById: async () => notImplemented(),
    findByAddress: async () => notImplemented(),
    listByUserId: async () => notImplemented(),
    setPrimary: async () => notImplemented(),
  };
}

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

  const userRepository = createUnimplementedUserRepository();
  const walletRepository = createUnimplementedWalletRepository();

  await app.register(userRoutes, { prefix: '/api/v1/users', userRepository });
  await app.register(walletRoutes, { prefix: '/api/v1/wallets', walletRepository });

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

