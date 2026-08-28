import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { activityFeed } from '@cryptra/global-activity';
import { AppError, ErrorCodes } from '@cryptra/core';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export async function activityRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const q = querySchema.safeParse(request.query);
    if (!q.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: q.error.message,
      });
    }
    const events = await activityFeed.list(q.data.limit);
    return { success: true, data: events };
  });
}
