import type { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../middleware/auth';
import type { UserService } from '@cryptra/service-users';

export interface UserRoutesOptions {
  userService: UserService;
}

export async function userRoutes(app: FastifyInstance, options: UserRoutesOptions): Promise<void> {
  const controller = new UserController(options.userService);

  app.post('/', (request, reply) => controller.createUser(request, reply));

  app.get('/me', { preHandler: requireAuth }, (request, reply) => controller.getCurrentUser(request, reply));

  app.patch('/me', { preHandler: requireAuth }, (request, reply) => controller.updateCurrentUser(request, reply));

  app.post('/me/touch', { preHandler: requireAuth }, (request, reply) => controller.touchLastSeen(request, reply));

  app.get('/referral/:referralCode', (request, reply) => controller.getUserByReferralCode(request as never, reply));

  app.get(
    '/referral/:referralCode/active-count',
    (request, reply) => controller.getActiveReferralCount(request as never, reply),
  );

  app.get('/:userId', { preHandler: requireAuth }, (request, reply) => controller.getUserById(request, reply));

  app.post('/:userId/xp', { preHandler: requireAuth }, (request, reply) => controller.applyXpDelta(request, reply));

  app.post('/:userId/ban', { preHandler: requireAuth }, (request, reply) => controller.banUser(request, reply));

  app.post('/:userId/unban', { preHandler: requireAuth }, (request, reply) => controller.unbanUser(request, reply));
}
