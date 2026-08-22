import type { FastifyInstance } from 'fastify';
import { prisma } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { achievementService } from '@cryptra/achievements';

export async function rewardsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const [catalog, claimed] = await Promise.all([
      prisma.reward.findMany({ where: { isActive: true } }),
      prisma.userReward.findMany({
        where: { userId: request.user!.userId },
        include: { reward: true },
      }),
    ]);
    return { success: true, data: { catalog, claimed } };
  });

  app.get('/achievements', async (request) => {
    const [all, unlocked] = await Promise.all([
      prisma.achievement.findMany({ where: { isActive: true } }),
      prisma.userAchievement.findMany({
        where: { userId: request.user!.userId },
        include: { achievement: true },
      }),
    ]);
    return { success: true, data: { all, unlocked } };
  });
}
