import type { FeeTierId } from '../constants/fees';
import type { SupportedLanguage } from '../constants/languages';

/**
 * Canonical User entity.
 * Backend (services/users) is the single source of truth for this record.
 * Frontend layers (Telegram Mini App, Web App, Admin Panel) MUST treat this
 * as read-only state received from the API — never mutate xp/level/feeTier locally.
 */
export interface User {
  id: string;
  telegramUserId: string | null;
  telegramUsername: string | null;
  walletAddresses: string[];
  primaryWalletAddress: string | null;
  languageCode: SupportedLanguage;
  xp: number;
  level: number;
  feeTierId: FeeTierId;
  referralCode: string;
  referredByCode: string | null;
  isActive: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
}

export type UserCreateInput = Pick<
  User,
  'telegramUserId' | 'telegramUsername' | 'languageCode' | 'referredByCode'
>;

export type UserUpdateInput = Partial<
  Pick<User, 'telegramUsername' | 'languageCode' | 'primaryWalletAddress'>
>;

export interface UserSession {
  userId: string;
  issuedAt: string;
  expiresAt: string;
  authMethod: 'telegram' | 'wallet-signature';
}
