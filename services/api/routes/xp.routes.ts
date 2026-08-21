import type { FastifyInstance } from 'fastify';
import { xpEngine } from '@cryptra/xp';
import { levelService } from '@cryptra/levels';
import { userRepository } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';

export async function xpRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * GET /api/v1/xp/me
   */
  app.get('/me', async (request) => {
    const user = await userRepository.findById(request.user!.userId);
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }

    const progress = levelService.getProgress(user.xp, user.level);

    return {
      success: true,
      data: {
        xp: user.xp,
        level: user.level,
        feeTier: user.feeTier,
        progress,
      },
    };
  });

  /**
   * GET /api/v1/xp/history
   */
  app.get('/history', async (request) => {
    const history = await xpEngine.getHistory(request.user!.userId);
    return { success: true, data: history };
  });
}
