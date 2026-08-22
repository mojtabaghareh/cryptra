import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { marketDataService } from '@cryptra/market-data';
import { AppError, ErrorCodes } from '@cryptra/core';

const DEFAULT_IDS = 'bitcoin,ethereum,solana,toncoin,binancecoin,ripple';

export async function marketRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/market/prices?ids=bitcoin,ethereum
   * ids optional — defaults to major assets
   */
  app.get('/prices', async (request) => {
    const query = z
      .object({
        ids: z.string().min(1).optional(),
      })
      .safeParse(request.query);

    if (!query.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Invalid query',
      });
    }

    const raw = query.data.ids || DEFAULT_IDS;
    const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const prices = await marketDataService.getPrices(ids);

    return { success: true, data: prices };
  });

  app.get('/major', async () => {
    const prices = await marketDataService.getMajorPrices();
    return { success: true, data: prices };
  });

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
