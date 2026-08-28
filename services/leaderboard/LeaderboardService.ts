import { prisma } from '@cryptra/database';

export class LeaderboardService {
  async byXp(limit = 50) {
    return prisma.user.findMany({
      orderBy: [{ xp: 'desc' }, { level: 'desc' }],
      take: Math.min(100, Math.max(1, limit)),
      select: {
        id: true,
        username: true,
        firstName: true,
        xp: true,
        level: true,
      },
    });
  }
}

export const leaderboardService = new LeaderboardService();
