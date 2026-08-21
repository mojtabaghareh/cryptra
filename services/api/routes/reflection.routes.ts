import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { reflectionEngine } from '@cryptra/reflection';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';

export async function reflectionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * GET /api/v1/reflection/weekly
   * Optional query: days=7
   */
  app.get('/weekly', async (request) => {
    const query = z
      .object({
        days: z.coerce.number().int().min(1).max(90).default(7),
      })
      .safeParse(request.query);

    if (!query.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Invalid days parameter',
      });
    }

    const report = await reflectionEngine.generateReport(
      request.user!.userId,
      query.data.days,
    );

    return { success: true, data: report };
  });
}
