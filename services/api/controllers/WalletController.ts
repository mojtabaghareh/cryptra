import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCodes, isEvmNetwork, type NetworkId } from '@cryptra/core';
import type { WalletService } from '@cryptra/service-wallets';
import { verifyEvmSignature, verifySolanaSignature, verifyTonProofSignature } from '../middleware/auth';

const connectWalletBodySchema = z.object({
  chainType: z.enum(['evm', 'solana', 'ton']),
  address: z.string().min(1),
  provider: z.enum([
    'metamask',
    'trustwallet',
    'walletconnect',
    'phantom',
    'coinbase',
    'rabby',
    'ledger',
    'trezor',
    'tonconnect',
  ]),
  message: z.string().min(1),
  signature: z.string().min(1),
  tonPublicKeyHex: z.string().min(1).optional(),
  label: z.string().min(1).max(64).optional(),
});

const walletParamsSchema = z.object({ walletId: z.string().uuid() });

const networkQuerySchema = z.object({ networkId: z.string().min(1) });

function parseNetworkId(raw: string): NetworkId {
  if (raw === 'solana' || raw === 'ton') return raw;
  const numeric = Number(raw);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new AppError({ code: ErrorCodes.VALIDATION_FAILED, message: `Invalid networkId "${raw}".` });
  }
  return numeric as NetworkId;
}

export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  async connectWallet(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }

    const body = connectWalletBodySchema.parse(request.body);

    const signatureValid = this.verifyOwnership(
      body.chainType,
      body.address,
      body.message,
      body.signature,
      body.tonPublicKeyHex,
    );
    if (!signatureValid) {
      throw new AppError({
        code: ErrorCodes.WALLET_SIGNATURE_INVALID,
        message: 'Wallet ownership signature verification failed.',
      });
    }

    const defaultNetworkId: NetworkId = body.chainType === 'evm' ? 1 : body.chainType === 'solana' ? 'solana' : 'ton';

    const wallet = await this.walletService.connectWallet({
      userId: request.user.userId,
      chainType: body.chainType,
      address: body.address,
      provider: body.provider,
      defaultNetworkId,
      label: body.label,
    });

    reply.status(201).send(wallet);
  }

  async listWallets(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const wallets = await this.walletService.listWallets(request.user.userId);
    reply.status(200).send(wallets);
  }

  async getWallet(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const { walletId } = walletParamsSchema.parse(request.params);
    const wallet = await this.walletService.getWallet(walletId, request.user.userId);
    reply.status(200).send(wallet);
  }

  async setPrimaryWallet(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const { walletId } = walletParamsSchema.parse(request.params);
    const wallet = await this.walletService.setPrimaryWallet(walletId, request.user.userId);
    reply.status(200).send(wallet);
  }

  async disconnectWallet(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const { walletId } = walletParamsSchema.parse(request.params);
    const wallet = await this.walletService.disconnectWallet(walletId, request.user.userId);
    reply.status(200).send(wallet);
  }

  async getBalance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const { walletId } = walletParamsSchema.parse(request.params);
    const { networkId: networkIdRaw } = networkQuerySchema.parse(request.query);
    const networkId = parseNetworkId(networkIdRaw);

    const balance = await this.walletService.getNativeBalance(walletId, request.user.userId, networkId);
    reply.status(200).send(balance);
  }

  async getHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const { walletId } = walletParamsSchema.parse(request.params);
    const { networkId: networkIdRaw } = networkQuerySchema.parse(request.query);
    const networkId = parseNetworkId(networkIdRaw);

    const history = await this.walletService.getHistory(walletId, request.user.userId, networkId);
    reply.status(200).send(history);
  }

  private verifyOwnership(
    chainType: 'evm' | 'solana' | 'ton',
    address: string,
    message: string,
    signature: string,
    tonPublicKeyHex: string | undefined,
  ): boolean {
    if (chainType === 'evm') {
      return verifyEvmSignature(message, signature, address);
    }
    if (chainType === 'solana') {
      return verifySolanaSignature(message, signature, address);
    }
    if (!tonPublicKeyHex) {
      throw new AppError({
        code: ErrorCodes.VALIDATION_FAILED,
        message: 'tonPublicKeyHex is required to verify a TON wallet signature.',
      });
    }
    return verifyTonProofSignature({ message, signatureBase64: signature, publicKeyHex: tonPublicKeyHex, address });
  }

  static assertEvmNetwork(networkId: NetworkId): void {
    if (!isEvmNetwork(networkId) && networkId !== 'solana' && networkId !== 'ton') {
      throw new AppError({ code: ErrorCodes.WALLET_CHAIN_UNSUPPORTED, message: 'Unsupported network.' });
    }
  }
}
