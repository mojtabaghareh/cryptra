import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { adminService } from '@cryptra/admin';
import { AppError, ErrorCodes } from '@cryptra/core';

function requireAdminKey(request: { headers: Record<string, unknown> }) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    throw new AppError({
      code: ErrorCodes.UNKNOWN,
      message: 'ADMIN_API_KEY not configured',
      statusCode: 500,
    });
  }
  const header = request.headers['x-admin-key'] || request.headers['authorization'];
  const value = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
  if (value !== key) {
    throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'Invalid admin key' });
  }
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    requireAdminKey(request as any);
  });

  app.get('/overview', async () => {
    const data = await adminService.overview();
    return { success: true, data };
  });

  app.get('/users', async (request) => {
    const q = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      })
      .parse(request.query);
    const data = await adminService.listUsers(q.page, q.pageSize);
    return { success: true, data };
  });

  app.post('/users/:id/active', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ isActive: z.boolean() }).parse(request.body);
    const user = await adminService.setUserActive(params.id, body.isActive);
    return { success: true, data: user };
  });

  app.post('/users/:id/xp', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        amount: z.number().int().positive(),
        description: z.string().optional(),
      })
      .parse(request.body);
    const user = await adminService.grantXp(params.id, body.amount, body.description);
    return { success: true, data: user };
  });

  app.get('/audit', async (request) => {
    const q = z
      .object({ limit: z.coerce.number().int().min(1).max(200).default(50) })
      .parse(request.query);
    const data = await adminService.recentAudit(q.limit);
    return { success: true, data };
  });
}
