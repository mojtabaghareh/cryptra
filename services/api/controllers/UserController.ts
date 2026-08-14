import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';
import {
  AppError,
  ErrorCodes,
  DEFAULT_FEE_TIER_ID,
  validateUserCreate,
  validateUserUpdate,
  type User,
  type UserCreateInput,
  type UserUpdateInput,
} from '@cryptra/core';

/**
 * Persistence contract for User records. The concrete implementation
 * (backed by PostgreSQL — see database/schema) is wired in at server
 * bootstrap once services/users / database are implemented; this
 * controller only depends on the abstraction, never on a concrete store.
 */
export interface UserRepository {
  create(input: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByTelegramId(telegramUserId: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  update(id: string, input: UserUpdateInput): Promise<User>;
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

export class UserController {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(
    request: FastifyRequest<{ Body: UserCreateInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    const input = validateUserCreate(request.body);

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
        throw new AppError({ code: ErrorCodes.REFERRAL_CODE_INVALID, message: 'Referral code does not exist.' });
      }
    }

    const now = new Date().toISOString();
    let referralCode = generateReferralCode();
    // Extremely low collision probability, but guard against it explicitly.
    while (await this.userRepository.findByReferralCode(referralCode)) {
      referralCode = generateReferralCode();
    }

    const user: User = {
      id: crypto.randomUUID(),
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

    const created = await this.userRepository.create(user);
    reply.status(201).send(created);
  }

  async getUserById(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.params;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${userId}" was not found.` });
    }
    reply.status(200).send(user);
  }

  async getCurrentUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const user = await this.userRepository.findById(request.user.userId);
    if (!user) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Authenticated user no longer exists.' });
    }
    reply.status(200).send(user);
  }

  async updateUser(
    request: FastifyRequest<{ Params: { userId: string }; Body: UserUpdateInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.params;

    if (!request.user || request.user.userId !== userId) {
      throw new AppError({ code: ErrorCodes.FORBIDDEN, message: 'You may only update your own user record.' });
    }

    const input = validateUserUpdate(request.body);

    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `User "${userId}" was not found.` });
    }

    const updated = await this.userRepository.update(userId, input);
    reply.status(200).send(updated);
  }
}

