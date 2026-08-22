import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { leaderboardService } from '@cryptra/leaderboard';

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const q = z
      .object({
        kind: z.enum(['xp', 'referral', 'trading']).default('xp'),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(request.query);

    const data = await leaderboardService.get(q.kind, q.limit);
    return { success: true, data };
  });
}
