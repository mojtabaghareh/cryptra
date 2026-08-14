import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  AppError,
  ErrorCodes,
  validateWalletAddress,
  isEvmNetwork,
  type ChainType,
  type NetworkId,
  type Wallet,
  type WalletProviderId,
} from '@cryptra/core';
import {
  BalanceService,
  EVMHistory,
  SolanaHistory,
  TonHistory,
  type EvmHistoryEntry,
  type SolanaHistoryEntry,
  type TonHistoryEntry,
} from '@cryptra/wallets';
import { verifyEvmSignature, verifySolanaSignature, verifyTonProofSignature } from '../middleware/auth';

/**
 * Persistence contract for connected Wallet records. Concrete storage is
 * wired at server bootstrap (see database/schema) — this controller never
 * touches a datastore directly, and NEVER stores a private key or seed.
 */
export interface WalletRepository {
  create(wallet: Wallet): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
  findByAddress(userId: string, address: string): Promise<Wallet | null>;
  listByUserId(userId: string): Promise<Wallet[]>;
  setPrimary(userId: string, walletId: string): Promise<Wallet>;
}

interface ConnectWalletBody {
  chainType: ChainType;
  address: string;
  provider: WalletProviderId;
  message: string;
  signature: string;
  /** Required only for TON ton_proof verification. */
  tonPublicKeyHex?: string;
}

const balanceService = new BalanceService();
const evmHistory = new EVMHistory();
const solanaHistory = new SolanaHistory();
const tonHistory = new TonHistory();

export class WalletController {
  constructor(private readonly walletRepository: WalletRepository) {}

  async connectWallet(
    request: FastifyRequest<{ Body: ConnectWalletBody }>,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }

    const { chainType, address, provider, message, signature, tonPublicKeyHex } = request.body;
    validateWalletAddress({ chainType, address });

    const signatureValid = this.verifyOwnership(chainType, address, message, signature, tonPublicKeyHex);
    if (!signatureValid) {
      throw new AppError({
        code: ErrorCodes.WALLET_SIGNATURE_INVALID,
        message: 'Wallet ownership signature verification failed.',
      });
    }

    const existing = await this.walletRepository.findByAddress(request.user.userId, address);
    if (existing) {
      throw new AppError({ code: ErrorCodes.CONFLICT, message: 'This wallet is already connected.' });
    }

    const existingWallets = await this.walletRepository.listByUserId(request.user.userId);
    const now = new Date().toISOString();

    const wallet: Wallet = {
      id: randomUUID(),
      userId: request.user.userId,
      address,
      chainType,
      networkId: chainType === 'evm' ? 1 : chainType === 'solana' ? 'solana' : 'ton',
      provider,
      label: null,
      isPrimary: existingWallets.length === 0,
      connectedAt: now,
      lastUsedAt: now,
      disconnectedAt: null,
    };

    const created = await this.walletRepository.create(wallet);
    reply.status(201).send(created);
  }

  async listWallets(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const wallets = await this.walletRepository.listByUserId(request.user.userId);
    reply.status(200).send(wallets);
  }

  async setPrimaryWallet(
    request: FastifyRequest<{ Params: { walletId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const updated = await this.walletRepository.setPrimary(request.user.userId, request.params.walletId);
    reply.status(200).send(updated);
  }

  async getBalance(
    request: FastifyRequest<{ Params: { walletId: string }; Querystring: { networkId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const wallet = await this.requireOwnedWallet(request);
    const networkId = this.parseNetworkId(request.query.networkId);

    const balance = await balanceService.getNativeBalance(wallet.id, wallet.address, networkId);
    reply.status(200).send(balance);
  }

  async getHistory(
    request: FastifyRequest<{ Params: { walletId: string }; Querystring: { networkId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const wallet = await this.requireOwnedWallet(request);
    const networkId = this.parseNetworkId(request.query.networkId);

    let history: EvmHistoryEntry[] | SolanaHistoryEntry[] | TonHistoryEntry[];
    if (isEvmNetwork(networkId)) {
      history = await evmHistory.getHistory(wallet.address, networkId);
    } else if (networkId === 'solana') {
      history = await solanaHistory.getHistory(wallet.address);
    } else {
      history = await tonHistory.getHistory(wallet.address);
    }

    reply.status(200).send(history);
  }

  private async requireOwnedWallet(request: FastifyRequest<{ Params: { walletId: string } }>): Promise<Wallet> {
    if (!request.user) {
      throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'No authenticated session.' });
    }
    const wallet = await this.walletRepository.findById(request.params.walletId);
    if (!wallet || wallet.userId !== request.user.userId) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: 'Wallet not found.' });
    }
    return wallet;
  }

  private parseNetworkId(raw: string): NetworkId {
    if (raw === 'solana' || raw === 'ton') return raw;
    const numeric = Number(raw);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new AppError({ code: ErrorCodes.VALIDATION_FAILED, message: `Invalid networkId "${raw}".` });
    }
    return numeric as NetworkId;
  }

  private verifyOwnership(
    chainType: ChainType,
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
}

