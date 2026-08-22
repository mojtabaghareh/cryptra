import { prisma } from '@cryptra/database';

export type LeaderboardKind = 'xp' | 'referral' | 'trading';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  firstName: string | null;
  value: number;
  level?: number;
}

export class LeaderboardService {
  async byXp(limit = 50): Promise<LeaderboardEntry[]> {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ xp: 'desc' }, { level: 'desc' }],
      take: limit,
      select: {
        id: true,
        username: true,
        firstName: true,
        xp: true,
        level: true,
      },
    });

    return users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username,
      firstName: u.firstName,
      value: u.xp,
      level: u.level,
    }));
  }

  async byReferrals(limit = 50): Promise<LeaderboardEntry[]> {
    const rows = await prisma.referral.groupBy({
      by: ['referrerId'],
      where: { status: { in: ['ACTIVE', 'PENDING'] } },
      _count: { refereeId: true },
      orderBy: { _count: { refereeId: 'desc' } },
      take: limit,
    });

    const userIds = rows.map((r) => r.referrerId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, firstName: true },
    });
    const map = new Map(users.map((u) => [u.id, u]));

    return rows.map((r, i) => {
      const u = map.get(r.referrerId);
      return {
        rank: i + 1,
        userId: r.referrerId,
        username: u?.username ?? null,
        firstName: u?.firstName ?? null,
        value: r._count.refereeId,
      };
    });
  }

  async byTradingVolume(limit = 50): Promise<LeaderboardEntry[]> {
    // Approximate volume = count of confirmed swaps + filled orders
    const swapCounts = await prisma.swap.groupBy({
      by: ['userId'],
      where: { status: { in: ['CONFIRMED', 'SUBMITTED'] } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit * 2,
    });

    const orderCounts = await prisma.order.groupBy({
      by: ['userId'],
      where: { status: { in: ['FILLED', 'PARTIALLY_FILLED'] } },
      _count: { id: true },
    });

    const orderMap = new Map(orderCounts.map((o) => [o.userId, o._count.id]));
    const scores = new Map<string, number>();

    for (const s of swapCounts) {
      scores.set(s.userId, (scores.get(s.userId) ?? 0) + s._count.id);
    }
    for (const [uid, c] of orderMap) {
      scores.set(uid, (scores.get(uid) ?? 0) + c);
    }

    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    const users = await prisma.user.findMany({
      where: { id: { in: sorted.map(([id]) => id) } },
      select: { id: true, username: true, firstName: true },
    });
    const umap = new Map(users.map((u) => [u.id, u]));

    return sorted.map(([userId, value], i) => {
      const u = umap.get(userId);
      return {
        rank: i + 1,
        userId,
        username: u?.username ?? null,
        firstName: u?.firstName ?? null,
        value,
      };
    });
  }

  async get(kind: LeaderboardKind, limit = 50): Promise<LeaderboardEntry[]> {
    switch (kind) {
      case 'xp':
        return this.byXp(limit);
      case 'referral':
        return this.byReferrals(limit);
      case 'trading':
        return this.byTradingVolume(limit);
      default:
        return this.byXp(limit);
    }
  }
}

export const leaderboardService = new LeaderboardService();
