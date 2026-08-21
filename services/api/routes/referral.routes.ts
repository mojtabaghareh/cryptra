import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { referralService } from '@cryptra/referral';
import { userRepository } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';

export async function referralRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * GET /api/v1/referral/me
   */
  app.get('/me', async (request) => {
    const user = await userRepository.findById(request.user!.userId);
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }

    const stats = await referralService.getStats(user.id);

    return {
      success: true,
      data: {
        code: user.referralCode,
        stats,
      },
    };
  });

  /**
   * POST /api/v1/referral/apply
   */
  app.post('/apply', async (request) => {
    const body = z
      .object({
        code: z.string().min(4).max(20),
      })
      .safeParse(request.body);

    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Referral code is required',
      });
    }

    const result = await referralService.applyCode(request.user!.userId, body.data.code);
    return { success: true, data: result };
  });

  /**
   * GET /api/v1/referral/list
   */
  app.get('/list', async (request) => {
    const list = await referralService.getReferrals(request.user!.userId);
    return { success: true, data: list };
  });
}
