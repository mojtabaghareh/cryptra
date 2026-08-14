import type { FastifyInstance } from 'fastify';
import { WalletController, type WalletRepository } from '../controllers/WalletController';
import { requireAuth } from '../middleware/auth';

export interface WalletRoutesOptions {
  walletRepository: WalletRepository;
}

export async function walletRoutes(app: FastifyInstance, options: WalletRoutesOptions): Promise<void> {
  const controller = new WalletController(options.walletRepository);

  app.addHook('preHandler', requireAuth);

  app.post('/connect', (request, reply) => controller.connectWallet(request as never, reply));

  app.get('/', (request, reply) => controller.listWallets(request, reply));

  app.post('/:walletId/primary', (request, reply) => controller.setPrimaryWallet(request as never, reply));

  app.get('/:walletId/balance', (request, reply) => controller.getBalance(request as never, reply));

  app.get('/:walletId/history', (request, reply) => controller.getHistory(request as never, reply));
}

