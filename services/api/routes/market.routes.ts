import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { marketDataService } from '@cryptra/market-data';
import { AppError, ErrorCodes } from '@cryptra/core';

export async function marketRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/market/prices?ids=bitcoin,ethereum,solana
   */
  app.get('/prices', async (request) => {
    const query = z
      .object({
        ids: z.string().min(1),
      })
      .safeParse(request.query);

    if (!query.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Query param "ids" is required (comma-separated)',
      });
    }

    const ids = query.data.ids.split(',').map((s) => s.trim()).filter(Boolean);
    const prices = await marketDataService.getPrices(ids);

    return { success: true, data: prices };
  });

  /**
   * GET /api/v1/market/major
   */
  app.get('/major', async () => {
    const prices = await marketDataService.getMajorPrices();
    return { success: true, data: prices };
  });

  /**
   * GET /api/v1/market/search?q=sol
   */
  app.get('/search', async (request) => {
    const query = z
      .object({
        q: z.string().min(1),
        limit: z.coerce.number().min(1).max(30).default(10),
      })
      .safeParse(request.query);

    if (!query.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Query param "q" is required',
      });
    }

    const results = await marketDataService.search(query.data.q, query.data.limit);
    return { success: true, data: results };
  });
}
