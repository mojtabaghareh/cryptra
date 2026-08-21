import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateWithTelegram } from '@cryptra/auth';
import { AppError, ErrorCodes } from '@cryptra/core';

const loginBodySchema = z.object({
  initData: z.string().min(10),
});

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/auth/telegram
   * Authenticate via Telegram Mini App initData.
   */
  app.post('/telegram', async (request, reply) => {
    const body = loginBodySchema.safeParse(request.body);
    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'initData is required',
        details: { issues: body.error.issues },
      });
    }

    const result = await authenticateWithTelegram(body.data.initData, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: result,
    });
  });

  app.get('/health-auth', async () => ({
    status: 'ok',
    service: 'auth',
  }));
}
