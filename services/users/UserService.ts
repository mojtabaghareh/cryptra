import { Pool, type PoolClient } from 'pg';
import { randomUUID, randomBytes } from 'node:crypto';
import {
  AppError,
  ErrorCodes,
  DEFAULT_FEE_TIER_ID,
  resolveLevelForXp,
  type User,
  type UserCreateInput,
  type UserUpdateInput,
} from '@cryptra/core';

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByTelegramId(telegramUserId: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  update(id: string, patch: Partial<User>): Promise<User>;
  countActiveReferralsForCode(referralCode: string): Promise<number>;
}

interface UserRow {
  id: string;
  telegram_user_id: string | null;
  telegram_username: string | null;
  wallet_addresses: string[];
  primary_wallet_address: string | null;
  language_code: string;
  xp: number;
  level: number;
  fee_tier_id: number;
  referral_code: string;
  referred_by_code: string | null;
  is_active: boolean;
  is_banned: boolean;
  banned_reason: string | null;
  created_at: Date;
  updated_at: Date;
  last_seen_at: Date | null;
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    telegramUsername: row.telegram_username,
    walletAddresses: row.wallet_addresses ?? [],
    primaryWalletAddress: row.primary_wallet_address,
    languageCode: row.language_code as User['languageCode'],
    xp: row.xp,
    level: row.level,
    feeTierId: row.fee_tier_id as User['feeTierId'],
    referralCode: row.referral_code,
    referredByCode: row.referred_by_code,
    isActive: row.is_active,
    isBanned: row.is_banned,
    bannedReason: row.banned_reason,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    lastSeenAt: row.last_seen_at ? row.last_seen_at.toISOString() : null,
  };
}

/** PostgreSQL-backed implementation of UserRepository. Table: public.users. */
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async create(user: User): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (
         id, telegram_user_id, telegram_username, wallet_addresses,
         primary_wallet_address, language_code, xp, level, fee_tier_id,
         referral_code, referred_by_code, is_active, is_banned, banned_reason,
         created_at, updated_at, last_seen_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        user.id,
        user.telegramUserId,
        user.telegramUsername,
        user.walletAddresses,
        user.primaryWalletAddress,
        user.languageCode,
        user.xp,
        user.level,
        user.feeTierId,
        user.referralCode,
        user.referredByCode,
        user.isActive,
        user.isBanned,
        user.bannedReason,
        user.createdAt,
        user.updatedAt,
        user.lastSeenAt,
      ],
    );
    return mapRowToUser(result.rows[0]!);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
  }

  async findByTelegramId(telegramUserId: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE telegram_user_id = $1 LIMIT 1',
      [telegramUserId],
    );
    return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE referral_code = $1 LIMIT 1',
      [referralCode],
    );
    return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
  }

  async countActiveReferralsForCode(referralCode: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM users
       WHERE referred_by_code = $1 AND is_active = true`,
      [referralCode],
    );
    return Number(result.rows[0]?.count ?? '0');
  }

  async update(id: string, patch: Partial<User>): Promise<User> {
    const columnMap: Record<string, string> = {
      telegramUsername: 'telegram_username',
      walletAddresses: 'wallet_addresses',
      primaryWalletAddress: 'primary_wallet_address',
      languageCode: 'language_code',
      xp: 'xp',
      level: 'level',
      feeTierId: 'fee_tier_id',
      isActive: 'is_active',
      isBanned: 'is_banned',
      bannedReason: 'banned_reason',
      lastSeenAt: 'last_seen_at',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(patch)) {
      const column = columnMap[key];
      if (!column) continue;
      setClauses.push(`${column} = $${index}`);
      values.push(value);
      index += 1;
    }

    if (setClauses.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
      }
      return existing;
    }

    setClauses.push(`updated_at = $${index}`);
    values.push(new Date().toISOString());
    index += 1;

    values.push(id);

    const result = await this.pool.query<UserRow>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${index} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
    }

    return mapRowToUser(result.rows[0]!);
  }
}

function generateReferralCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // unambiguous charset
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

/**
 * Business-logic layer for the User domain. This is the single authoritative
 * place XP/Level/Fee-tier promotions are applied for a user — Frontend and
 * every other service must go through here (directly, or via services/api)
 * rather than mutating a user record independently.
 */
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(input: UserCreateInput): Promise<User> {
    if (input.telegramUserId) {
      const existing = await this.userRepository.findByTelegramId(input.telegramUserId);
      if (existing) {
        throw new AppError({
          code: ErrorCodes.CONFLICT,
          message: 'A user with this Telegram account already exists.',
        });
      }
    }

    if (input.referredByCode) {
      const referrer = await this.userRepository.findByReferralCode(input.referredByCode);
      if (!referrer) {
        throw new AppError({
          code: ErrorCodes.REFERRAL_CODE_INVALID,
          message: 'Referral code does not exist.',
        });
      }
    }

    let referralCode = generateReferralCode();
    while (await this.userRepository.findByReferralCode(referralCode)) {
      referralCode = generateReferralCode();
    }

    const now = new Date().toISOString();

    const user: User = {
      id: randomUUID(),
      telegramUserId: input.telegramUserId,
      telegramUsername: input.telegramUsername,
      walletAddresses: [],
      primaryWalletAddress: null,
      languageCode: input.languageCode,
      xp: 0,
      level: 1,
      feeTierId: DEFAULT_FEE_TIER_ID,
      referralCode,
      referredByCode: input.referredByCode,
      isActive: true,
      isBanned: false,
      bannedReason: null,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    };

    return this.userRepository.create(user);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
    }
    return user;
  }

  async getUserByTelegramId(telegramUserId: string): Promise<User | null> {
    return this.userRepository.findByTelegramId(telegramUserId);
  }

  async getUserByReferralCode(referralCode: string): Promise<User | null> {
    return this.userRepository.findByReferralCode(referralCode);
  }

  async updateProfile(id: string, patch: UserUpdateInput): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
    }
    return this.userRepository.update(id, patch);
  }

  async recordLastSeen(id: string): Promise<User> {
    return this.userRepository.update(id, { lastSeenAt: new Date().toISOString() });
  }

  /**
   * Applies an XP delta and recomputes the user's Level and Fee Tier from
   * the central level table (@cryptra/core LEVELS). Frontend must never
   * compute or apply this — this is the sole source of XP truth (services
   * that award XP, e.g. XP events processing, call through here).
   */
  async applyXpDelta(id: string, xpDelta: number): Promise<User> {
    if (!Number.isFinite(xpDelta)) {
      throw new AppError({ code: ErrorCodes.XP_EVENT_INVALID, message: 'xpDelta must be a finite number.' });
    }

    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
    }

    const newXp = Math.max(0, existing.xp + xpDelta);
    const levelConfig = resolveLevelForXp(newXp);

    return this.userRepository.update(id, {
      xp: newXp,
      level: levelConfig.level,
      feeTierId: levelConfig.feeTierId,
    });
  }

  async banUser(id: string, reason: string): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
    }
    return this.userRepository.update(id, { isBanned: true, bannedReason: reason, isActive: false });
  }

  async unbanUser(id: string): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${id}" was not found.` });
    }
    return this.userRepository.update(id, { isBanned: false, bannedReason: null, isActive: true });
  }

  /** True once a referred user has met minimum activity (used by services/referrals to flip Active status). */
  async countActiveReferrals(referralCode: string): Promise<number> {
    return this.userRepository.countActiveReferralsForCode(referralCode);
  }

  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>, pool: Pool): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

