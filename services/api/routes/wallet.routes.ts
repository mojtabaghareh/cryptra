import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { walletRepository, prisma } from '@cryptra/database';
import { requireAuth } from '../middleware/auth';
import { AppError, ErrorCodes } from '@cryptra/core';
import {
  verifyEvmSignature,
  verifySolanaSignature,
  verifyTonProofSignature,
} from '../middleware/auth';

const chainMap = {
  EVM: 'EVM',
  SOLANA: 'SOLANA',
  TON: 'TON',
  evm: 'EVM',
  solana: 'SOLANA',
  ton: 'TON',
} as const;

const providerMap = {
  METAMASK: 'METAMASK',
  WALLETCONNECT: 'WALLETCONNECT',
  PHANTOM: 'PHANTOM',
  TON_CONNECT: 'TON_CONNECT',
  TRUST_WALLET: 'TRUST_WALLET',
  OTHER: 'OTHER',
  metamask: 'METAMASK',
  walletconnect: 'WALLETCONNECT',
  phantom: 'PHANTOM',
  tonconnect: 'TON_CONNECT',
  trustwallet: 'TRUST_WALLET',
  other: 'OTHER',
  demo: 'OTHER',
} as const;

export async function walletRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /** List linked wallets */
  app.get('/', async (request) => {
    const wallets = await walletRepository.findByUserId(request.user!.userId);
    return { success: true, data: wallets };
  });

  /**
   * Link a wallet to the user.
   * In production: require message + signature.
   * In development: signature optional when NODE_ENV=development.
   */
  app.post('/connect', async (request) => {
    const body = z
      .object({
        address: z.string().min(8),
        chainType: z.enum(['EVM', 'SOLANA', 'TON', 'evm', 'solana', 'ton']),
        provider: z
          .enum([
            'METAMASK',
            'WALLETCONNECT',
            'PHANTOM',
            'TON_CONNECT',
            'TRUST_WALLET',
            'OTHER',
            'metamask',
            'walletconnect',
            'phantom',
            'tonconnect',
            'trustwallet',
            'other',
            'demo',
          ])
          .default('OTHER'),
        label: z.string().max(64).optional(),
        message: z.string().optional(),
        signature: z.string().optional(),
        tonPublicKeyHex: z.string().optional(),
        skipSignature: z.boolean().optional(),
      })
      .safeParse(request.body);

    if (!body.success) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: body.error.message,
      });
    }

    const data = body.data;
    const chainType = chainMap[data.chainType];
    const provider = providerMap[data.provider];
    const address = data.address.trim();
    const isDev = process.env.NODE_ENV !== 'production';
    const canSkip = isDev && (data.skipSignature || data.provider === 'demo');

    if (!canSkip) {
      if (!data.message || !data.signature) {
        throw new AppError({
          code: ErrorCodes.VALIDATION_FAILED,
          message: 'message and signature required to prove wallet ownership',
        });
      }

      let valid = false;
      if (chainType === 'EVM') {
        valid = verifyEvmSignature(data.message, data.signature, address);
      } else if (chainType === 'SOLANA') {
        valid = verifySolanaSignature(data.message, data.signature, address);
      } else {
        if (!data.tonPublicKeyHex) {
          throw new AppError({
            code: ErrorCodes.VALIDATION_FAILED,
            message: 'tonPublicKeyHex required for TON',
          });
        }
        valid = verifyTonProofSignature({
          message: data.message,
          signatureBase64: data.signature,
          publicKeyHex: data.tonPublicKeyHex,
          address,
        });
      }

      if (!valid) {
        throw new AppError({
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Invalid wallet signature',
        });
      }
    }

    const existing = await walletRepository.findByAddress(address, chainType as any);
    if (existing && existing.userId !== request.user!.userId) {
      throw new AppError({
        code: ErrorCodes.CONFLICT,
        message: 'Wallet already linked to another account',
      });
    }

    if (existing && existing.userId === request.user!.userId) {
      return { success: true, data: existing, linked: false };
    }

    const wallets = await walletRepository.findByUserId(request.user!.userId);
    const isPrimary = wallets.length === 0;

    const wallet = await walletRepository.create({
      userId: request.user!.userId,
      address,
      chainType: chainType as any,
      provider: provider as any,
      isPrimary,
      label: data.label,
    });

    return { success: true, data: wallet, linked: true };
  });

  /** Set primary wallet */
  app.post('/:id/primary', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const wallet = await walletRepository.findById(params.id);
    if (!wallet || wallet.userId !== request.user!.userId) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Wallet not found' });
    }
    await walletRepository.setPrimary(request.user!.userId, params.id);
    const updated = await walletRepository.findById(params.id);
    return { success: true, data: updated };
  });

  /** Unlink wallet */
  app.delete('/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const wallet = await walletRepository.findById(params.id);
    if (!wallet || wallet.userId !== request.user!.userId) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Wallet not found' });
    }
    await walletRepository.delete(params.id);
    return { success: true };
  });
}
