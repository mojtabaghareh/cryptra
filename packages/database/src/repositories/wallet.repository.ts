import type { Prisma, Wallet, ChainType, WalletProvider } from '@prisma/client';
import { prisma } from '../client';

export class WalletRepository {
  async findById(id: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findPrimary(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findFirst({
      where: { userId, isPrimary: true },
    });
  }

  async findByAddress(
    address: string,
    chainType: ChainType,
  ): Promise<Wallet | null> {
    return prisma.wallet.findFirst({
      where: { address, chainType },
    });
  }

  async create(data: {
    userId: string;
    address: string;
    chainType: ChainType;
    provider: WalletProvider;
    isPrimary?: boolean;
    label?: string;
  }): Promise<Wallet> {
    return prisma.wallet.create({
      data: {
        userId: data.userId,
        address: data.address,
        chainType: data.chainType,
        provider: data.provider,
        isPrimary: data.isPrimary ?? false,
        label: data.label,
      },
    });
  }

  async setPrimary(userId: string, walletId: string): Promise<void> {
    await prisma.$transaction([
      prisma.wallet.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.wallet.update({
        where: { id: walletId },
        data: { isPrimary: true },
      }),
    ]);
  }

  async delete(id: string): Promise<void> {
    await prisma.wallet.delete({ where: { id } });
  }
}

export const walletRepository = new WalletRepository();
