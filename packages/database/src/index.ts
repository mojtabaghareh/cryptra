export { prisma } from './client';
export type { PrismaClient } from './client';
export * from './repositories';

// Re-export useful Prisma types for consumers
export type {
  User,
  Wallet,
  Swap,
  Order,
  Position,
  XpEvent,
  Achievement,
  Referral,
  Reward,
  Notification,
  AuditLog,
  FeeTier,
  ChainType,
  WalletProvider,
  SwapStatus,
  OrderSide,
  OrderType,
  OrderStatus,
  PositionStatus,
  XpSource,
  ReferralStatus,
  RewardType,
  NotificationChannel,
  NotificationStatus,
} from '@prisma/client';
