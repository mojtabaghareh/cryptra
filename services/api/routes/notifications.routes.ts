import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { notificationService } from '@cryptra/notifications';
import { requireAuth } from '../middleware/auth';

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const q = z
      .object({ limit: z.coerce.number().int().min(1).max(100).default(30) })
      .parse(request.query);

    const items = await notificationService.listForUser(request.user!.userId, q.limit);
    return { success: true, data: items };
  });

  app.post('/:id/read', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await notificationService.markRead(request.user!.userId, params.id);
    return { success: true };
  });
}
