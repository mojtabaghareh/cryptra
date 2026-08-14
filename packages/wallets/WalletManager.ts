import type { ChainType, NetworkId, WalletBalance, WalletProviderId } from '@cryptra/core';
import { AppError, ErrorCodes, isEvmNetwork } from '@cryptra/core';
import type { IWalletAdapter, WalletAdapterAccount, WalletAdapterEvent } from './interfaces/IWalletAdapter';
import { BalanceService } from './balances/BalanceService';
import { WalletTransactionService } from './transactions/WalletTransactionService';
import { EVMHistory, type EvmHistoryEntry } from './history/EVMHistory';
import { SolanaHistory, type SolanaHistoryEntry } from './history/SolanaHistory';
import { TonHistory, type TonHistoryEntry } from './history/TonHistory';

export type WalletManagerEvent = 'walletConnected' | 'walletDisconnected' | 'accountChanged' | 'chainChanged';

export interface WalletManagerState {
  activeProvider: WalletProviderId | null;
  account: WalletAdapterAccount | null;
}

export type AnyHistoryEntry = EvmHistoryEntry | SolanaHistoryEntry | TonHistoryEntry;

/**
 * Central orchestrator for the whole non-custodial wallet layer.
 * Registers adapters, manages the currently active connection, and
 * delegates balance / transaction / history lookups to the dedicated
 * services. This is the only class apps (Telegram Mini App, Web App)
 * should talk to directly.
 */
export class WalletManager {
  private readonly adapters = new Map<WalletProviderId, IWalletAdapter>();
  private activeAdapter: IWalletAdapter | null = null;
  private readonly listeners = new Map<WalletManagerEvent, Set<(...args: unknown[]) => void>>();

  public readonly balances = new BalanceService();
  public readonly transactions = new WalletTransactionService();
  public readonly evmHistory = new EVMHistory();
  public readonly solanaHistory = new SolanaHistory();
  public readonly tonHistory = new TonHistory();

  registerAdapter(adapter: IWalletAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  registerAdapters(adapters: IWalletAdapter[]): void {
    adapters.forEach((adapter) => this.registerAdapter(adapter));
  }

  getAdapter(providerId: WalletProviderId): IWalletAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new AppError({
        code: ErrorCodes.WALLET_PROVIDER_UNAVAILABLE,
        message: `No adapter registered for provider "${providerId}".`,
      });
    }
    return adapter;
  }

  listAdapters(): IWalletAdapter[] {
    return Array.from(this.adapters.values());
  }

  async listAvailableAdapters(): Promise<IWalletAdapter[]> {
    const results = await Promise.all(
      this.listAdapters().map(async (adapter) => ({ adapter, available: await adapter.isAvailable() })),
    );
    return results.filter((r) => r.available).map((r) => r.adapter);
  }

  async connect(providerId: WalletProviderId): Promise<WalletAdapterAccount> {
    const adapter = this.getAdapter(providerId);

    const available = await adapter.isAvailable();
    if (!available) {
      throw new AppError({
        code: ErrorCodes.WALLET_PROVIDER_UNAVAILABLE,
        message: `${adapter.name} is not available in this environment.`,
      });
    }

    let account: WalletAdapterAccount;
    try {
      account = await adapter.connect();
    } catch (error) {
      throw new AppError({
        code: ErrorCodes.WALLET_CONNECTION_REJECTED,
        message: `Connection to ${adapter.name} was rejected or failed.`,
        cause: error,
      });
    }

    this.detachActiveAdapterListeners();
    this.activeAdapter = adapter;
    this.attachActiveAdapterListeners(adapter);

    this.emit('walletConnected', { providerId, account });
    return account;
  }

  async disconnect(): Promise<void> {
    if (!this.activeAdapter) return;
    const providerId = this.activeAdapter.id;

    await this.activeAdapter.disconnect();
    this.detachActiveAdapterListeners();
    this.activeAdapter = null;

    this.emit('walletDisconnected', { providerId });
  }

  getActiveAdapter(): IWalletAdapter | null {
    return this.activeAdapter;
  }

  getState(): WalletManagerState {
    return {
      activeProvider: this.activeAdapter?.id ?? null,
      account: this.activeAdapter?.getAccount() ?? null,
    };
  }

  requireActiveAdapter(): IWalletAdapter {
    if (!this.activeAdapter) {
      throw new AppError({
        code: ErrorCodes.WALLET_NOT_CONNECTED,
        message: 'No wallet is currently connected.',
      });
    }
    return this.activeAdapter;
  }

  async signMessage(message: string): Promise<string> {
    const adapter = this.requireActiveAdapter();
    try {
      return await adapter.signMessage(message);
    } catch (error) {
      throw new AppError({
        code: ErrorCodes.WALLET_SIGNATURE_REJECTED,
        message: 'The wallet rejected the signature request.',
        cause: error,
      });
    }
  }

  async getNativeBalance(networkId: NetworkId): Promise<WalletBalance> {
    const adapter = this.requireActiveAdapter();
    const account = adapter.getAccount();
    if (!account) {
      throw new AppError({ code: ErrorCodes.WALLET_NOT_CONNECTED, message: 'No active account.' });
    }
    return this.balances.getNativeBalance(adapter.id, account.address, networkId);
  }

  async getHistory(networkId: NetworkId): Promise<AnyHistoryEntry[]> {
    const adapter = this.requireActiveAdapter();
    const account = adapter.getAccount();
    if (!account) {
      throw new AppError({ code: ErrorCodes.WALLET_NOT_CONNECTED, message: 'No active account.' });
    }

    if (isEvmNetwork(networkId)) {
      return this.evmHistory.getHistory(account.address, networkId);
    }
    if (networkId === 'solana') {
      return this.solanaHistory.getHistory(account.address);
    }
    if (networkId === 'ton') {
      return this.tonHistory.getHistory(account.address);
    }

    throw new AppError({
      code: ErrorCodes.WALLET_CHAIN_UNSUPPORTED,
      message: `Unsupported network for history lookup: ${String(networkId)}`,
    });
  }

  getActiveChainType(): ChainType | null {
    return this.activeAdapter?.chainType ?? null;
  }

  on(event: WalletManagerEvent, handler: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: WalletManagerEvent, handler: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: WalletManagerEvent, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((handler) => handler(...args));
  }

  private readonly boundAccountsChanged = (...args: unknown[]) => this.emit('accountChanged', ...args);
  private readonly boundChainChanged = (...args: unknown[]) => this.emit('chainChanged', ...args);
  private readonly boundDisconnect = () => {
    const providerId = this.activeAdapter?.id ?? null;
    this.activeAdapter = null;
    this.emit('walletDisconnected', { providerId });
  };

  private attachActiveAdapterListeners(adapter: IWalletAdapter): void {
    const events: WalletAdapterEvent[] = ['accountsChanged', 'chainChanged', 'disconnect'];
    adapter.on('accountsChanged', this.boundAccountsChanged);
    adapter.on('chainChanged', this.boundChainChanged);
    adapter.on('disconnect', this.boundDisconnect);
    void events;
  }

  private detachActiveAdapterListeners(): void {
    if (!this.activeAdapter) return;
    this.activeAdapter.off('accountsChanged', this.boundAccountsChanged);
    this.activeAdapter.off('chainChanged', this.boundChainChanged);
    this.activeAdapter.off('disconnect', this.boundDisconnect);
  }
}

