import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import {
  AppError,
  ErrorCodes,
  isEvmNetwork,
  validateWalletAddress,
  type ChainType,
  type NetworkId,
  type Wallet,
  type WalletBalance,
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

export interface WalletRepository {
  create(wallet: Wallet): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
  findByAddress(userId: string, address: string): Promise<Wallet | null>;
  listByUserId(userId: string, includeDisconnected?: boolean): Promise<Wallet[]>;
  unsetAllPrimary(userId: string): Promise<void>;
  setPrimary(id: string): Promise<Wallet>;
  softDisconnect(id: string): Promise<Wallet>;
  touchLastUsed(id: string): Promise<void>;
}

interface WalletRow {
  id: string;
  user_id: string;
  address: string;
  chain_type: ChainType;
  network_id: string;
  provider: WalletProviderId;
  label: string | null;
  is_primary: boolean;
  connected_at: Date;
  last_used_at: Date;
  disconnected_at: Date | null;
}

function decodeNetworkId(raw: string): NetworkId {
  if (raw === 'solana' || raw === 'ton') return raw;
  return Number(raw) as NetworkId;
}

function mapRowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address,
    chainType: row.chain_type,
    networkId: decodeNetworkId(row.network_id),
    provider: row.provider,
    label: row.label,
    isPrimary: row.is_primary,
    connectedAt: row.connected_at.toISOString(),
    lastUsedAt: row.last_used_at.toISOString(),
    disconnectedAt: row.disconnected_at ? row.disconnected_at.toISOString() : null,
  };
}

/**
 * PostgreSQL-backed implementation of WalletRepository. Table: public.wallets.
 * STRICT NON-CUSTODIAL RULE: the `wallets` table schema must never contain a
 * private-key or seed-phrase column — only public connection metadata.
 */
export class PostgresWalletRepository implements WalletRepository {
  constructor(private readonly pool: Pool) {}

  async create(wallet: Wallet): Promise<Wallet> {
    const result = await this.pool.query<WalletRow>(
      `INSERT INTO wallets (
         id, user_id, address, chain_type, network_id, provider,
         label, is_primary, connected_at, last_used_at, disconnected_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        wallet.id,
        wallet.userId,
        wallet.address,
        wallet.chainType,
        String(wallet.networkId),
        wallet.provider,
        wallet.label,
        wallet.isPrimary,
        wallet.connectedAt,
        wallet.lastUsedAt,
        wallet.disconnectedAt,
      ],
    );
    return mapRowToWallet(result.rows[0]!);
  }

  async findById(id: string): Promise<Wallet | null> {
    const result = await this.pool.query<WalletRow>('SELECT * FROM wallets WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRowToWallet(result.rows[0]) : null;
  }

  async findByAddress(userId: string, address: string): Promise<Wallet | null> {
    const result = await this.pool.query<WalletRow>(
      `SELECT * FROM wallets
       WHERE user_id = $1 AND lower(address) = lower($2) AND disconnected_at IS NULL
       LIMIT 1`,
      [userId, address],
    );
    return result.rows[0] ? mapRowToWallet(result.rows[0]) : null;
  }

  async listByUserId(userId: string, includeDisconnected = false): Promise<Wallet[]> {
    const query = includeDisconnected
      ? 'SELECT * FROM wallets WHERE user_id = $1 ORDER BY connected_at ASC'
      : 'SELECT * FROM wallets WHERE user_id = $1 AND disconnected_at IS NULL ORDER BY connected_at ASC';
    const result = await this.pool.query<WalletRow>(query, [userId]);
    return result.rows.map(mapRowToWallet);
  }

  async unsetAllPrimary(userId: string): Promise<void> {
    await this.pool.query('UPDATE wallets SET is_primary = false WHERE user_id = $1', [userId]);
  }

  async setPrimary(id: string): Promise<Wallet> {
    const result = await this.pool.query<WalletRow>(
      'UPDATE wallets SET is_primary = true WHERE id = $1 RETURNING *',
      [id],
    );
    if (result.rows.length === 0) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `Wallet "${id}" was not found.` });
    }
    return mapRowToWallet(result.rows[0]!);
  }

  async softDisconnect(id: string): Promise<Wallet> {
    const result = await this.pool.query<WalletRow>(
      'UPDATE wallets SET disconnected_at = $2, is_primary = false WHERE id = $1 RETURNING *',
      [id, new Date().toISOString()],
    );
    if (result.rows.length === 0) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `Wallet "${id}" was not found.` });
    }
    return mapRowToWallet(result.rows[0]!);
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.pool.query('UPDATE wallets SET last_used_at = $2 WHERE id = $1', [id, new Date().toISOString()]);
  }
}

export interface ConnectWalletInput {
  userId: string;
  chainType: ChainType;
  address: string;
  provider: WalletProviderId;
  defaultNetworkId: NetworkId;
  label?: string;
}

/**
 * Business-logic layer for the connected-Wallet domain.
 * STRICT NON-CUSTODIAL RULE: this service, and everything it calls, must
 * never accept, derive, store, or log a private key or seed phrase — only
 * public addresses and connection metadata. Ownership must be established
 * upstream (services/api middleware) via a verified wallet signature before
 * connectWallet() is ever invoked.
 */
export class WalletService {
  private readonly balanceService = new BalanceService();
  private readonly evmHistory = new EVMHistory();
  private readonly solanaHistory = new SolanaHistory();
  private readonly tonHistory = new TonHistory();

  constructor(private readonly walletRepository: WalletRepository) {}

  async connectWallet(input: ConnectWalletInput): Promise<Wallet> {
    validateWalletAddress({ chainType: input.chainType, address: input.address });

    const existing = await this.walletRepository.findByAddress(input.userId, input.address);
    if (existing) {
      throw new AppError({ code: ErrorCodes.CONFLICT, message: 'This wallet is already connected.' });
    }

    const currentWallets = await this.walletRepository.listByUserId(input.userId);
    const now = new Date().toISOString();

    const wallet: Wallet = {
      id: randomUUID(),
      userId: input.userId,
      address: input.address,
      chainType: input.chainType,
      networkId: input.defaultNetworkId,
      provider: input.provider,
      label: input.label ?? null,
      isPrimary: currentWallets.length === 0,
      connectedAt: now,
      lastUsedAt: now,
      disconnectedAt: null,
    };

    return this.walletRepository.create(wallet);
  }

  async listWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepository.listByUserId(userId);
  }

  async getWallet(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet || wallet.userId !== userId || wallet.disconnectedAt) {
      throw new AppError({ code: ErrorCodes.NOT_FOUND, message: `Wallet "${walletId}" was not found.` });
    }
    return wallet;
  }

  async setPrimaryWallet(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await this.getWallet(walletId, userId);
    await this.walletRepository.unsetAllPrimary(userId);
    return this.walletRepository.setPrimary(wallet.id);
  }

  async disconnectWallet(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await this.getWallet(walletId, userId);
    const disconnected = await this.walletRepository.softDisconnect(wallet.id);

    if (wallet.isPrimary) {
      const remaining = await this.walletRepository.listByUserId(userId);
      const next = remaining[0];
      if (next) {
        await this.walletRepository.setPrimary(next.id);
      }
    }

    return disconnected;
  }

  async getNativeBalance(walletId: string, userId: string, networkId: NetworkId): Promise<WalletBalance> {
    const wallet = await this.getWallet(walletId, userId);
    await this.walletRepository.touchLastUsed(wallet.id);
    return this.balanceService.getNativeBalance(wallet.id, wallet.address, networkId);
  }

  async getHistory(
    walletId: string,
    userId: string,
    networkId: NetworkId,
  ): Promise<EvmHistoryEntry[] | SolanaHistoryEntry[] | TonHistoryEntry[]> {
    const wallet = await this.getWallet(walletId, userId);
    await this.walletRepository.touchLastUsed(wallet.id);

    if (isEvmNetwork(networkId)) {
      return this.evmHistory.getHistory(wallet.address, networkId);
    }
    if (networkId === 'solana') {
      return this.solanaHistory.getHistory(wallet.address);
    }
    if (networkId === 'ton') {
      return this.tonHistory.getHistory(wallet.address);
    }

    throw new AppError({
      code: ErrorCodes.WALLET_CHAIN_UNSUPPORTED,
      message: `Unsupported network for history lookup: ${String(networkId)}`,
    });
  }
}

