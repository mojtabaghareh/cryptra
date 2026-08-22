import { prisma } from '@cryptra/database';
import { AppError, ErrorCodes } from '@cryptra/core';

export class AdminService {
  async overview() {
    const [users, swaps, orders, openPositions, pendingNotifications] = await Promise.all([
      prisma.user.count(),
      prisma.swap.count(),
      prisma.order.count(),
      prisma.position.count({ where: { status: 'OPEN' } }),
      prisma.notification.count({ where: { status: 'PENDING' } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        firstName: true,
        telegramId: true,
        xp: true,
        level: true,
        createdAt: true,
      },
    });

    return {
      counts: { users, swaps, orders, openPositions, pendingNotifications },
      recentUsers,
    };
  }

  async listUsers(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          xp: true,
          level: true,
          feeTier: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return { items, total, page, pageSize };
  }

  async setUserActive(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
    }
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async grantXp(userId: string, amount: number, description?: string) {
    if (amount <= 0 || amount > 100_000) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'Invalid XP amount',
      });
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'User not found' });
      }

      await tx.xpEvent.create({
        data: {
          userId,
          source: 'ADMIN',
          amount,
          description: description ?? 'Admin grant',
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: { xp: { increment: amount } },
      });
    });
  }

  async recentAudit(limit = 50) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const adminService = new AdminService();
