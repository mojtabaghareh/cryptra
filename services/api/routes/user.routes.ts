import type { FastifyInstance } from 'fastify';
import { UserController, type UserRepository } from '../controllers/UserController';
import { requireAuth } from '../middleware/auth';

export interface UserRoutesOptions {
  userRepository: UserRepository;
}

export async function userRoutes(app: FastifyInstance, options: UserRoutesOptions): Promise<void> {
  const controller = new UserController(options.userRepository);

  app.post('/', (request, reply) => controller.createUser(request as never, reply));

  app.get('/me', { preHandler: requireAuth }, (request, reply) => controller.getCurrentUser(request, reply));

  app.get('/:userId', { preHandler: requireAuth }, (request, reply) =>
    controller.getUserById(request as never, reply),
  );

  app.patch('/:userId', { preHandler: requireAuth }, (request, reply) =>
    controller.updateUser(request as never, reply),
  );
}

