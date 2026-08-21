import type { FastifyInstance } from 'fastify';
import { portfolioService } from '@cryptra/portfolio';
import { requireAuth } from '../middleware/auth';

export async function portfolioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/me', async (request) => {
    const summary = await portfolioService.getSummary(request.user!.userId);
    return { success: true, data: summary };
  });

  app.get('/history', async (request) => {
    const history = await portfolioService.getTradeHistory(request.user!.userId);
    return { success: true, data: history };
  });
}
