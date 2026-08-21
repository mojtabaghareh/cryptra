import type { Prisma, User } from '@prisma/client';
import { prisma } from '../client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByTelegramId(telegramId: bigint | number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
  }

  async findByReferralCode(code: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { referralCode: code } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async updateLastActive(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async addXp(id: string, amount: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { xp: { increment: amount } },
    });
  }

  async setLevel(id: string, level: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { level },
    });
  }

  async list(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  } = {}): Promise<User[]> {
    return prisma.user.findMany({
      skip: params.skip,
      take: params.take ?? 50,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
    });
  }
}

export const userRepository = new UserRepository();
