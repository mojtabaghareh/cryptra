// ============================================================
// Cryptra V2.9 — Wallet Manager
// File: WalletManager.ts
// Production / Non-Custodial
// ============================================================

import {
  IWalletAdapter,
  WalletAccount,
  WalletConnectOptions,
} from './IWalletAdapter';

export class WalletManager {
  private readonly adapters = new Map<string, IWalletAdapter>();

  private activeWalletId: string | null = null;

  register(adapter: IWalletAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(
        `Wallet adapter "${adapter.id}" is already registered.`,
      );
    }

    this.adapters.set(adapter.id, adapter);
  }

  unregister(walletId: string): void {
    const adapter = this.adapters.get(walletId);

    if (!adapter) {
      return;
    }

    adapter.removeAllListeners();

    if (this.activeWalletId === walletId) {
      this.activeWalletId = null;
    }

    this.adapters.delete(walletId);
  }

  get(walletId: string): IWalletAdapter {
    const adapter = this.adapters.get(walletId);

    if (!adapter) {
      throw new Error(
        `Wallet adapter "${walletId}" is not registered.`,
      );
    }

    return adapter;
  }

  getAll(): IWalletAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAvailable(): IWalletAdapter[] {
    return this.getAll().filter(
      adapter => adapter.isAvailable(),
    );
  }

  async connect(
    walletId: string,
    options: WalletConnectOptions = {},
  ): Promise<WalletAccount> {
    const adapter = this.get(walletId);

    if (!adapter.isAvailable()) {
      throw new Error(
        `${adapter.name} is not available in this environment.`,
      );
    }

    const account = await adapter.connect(options);

    this.activeWalletId = walletId;

    return account;
  }

  async disconnect(walletId?: string): Promise<void> {
    const id = walletId ?? this.activeWalletId;

    if (!id) {
      return;
    }

    const adapter = this.get(id);

    await adapter.disconnect();

    if (this.activeWalletId === id) {
      this.activeWalletId = null;
    }
  }

  getActiveAdapter(): IWalletAdapter | null {
    if (!this.activeWalletId) {
      return null;
    }

    return this.adapters.get(this.activeWalletId) ?? null;
  }

  getActiveWalletId(): string | null {
    return this.activeWalletId;
  }

  async getActiveAccount(): Promise<WalletAccount | null> {
    const adapter = this.getActiveAdapter();

    if (!adapter) {
      return null;
    }

    return adapter.getAccount();
  }

  async getAccount(
    walletId: string,
  ): Promise<WalletAccount | null> {
    return this.get(walletId).getAccount();
  }

  async signMessage(message: string): Promise<string> {
    const adapter = this.requireActiveAdapter();

    return adapter.signMessage(message);
  }

  async sendTransaction(
    transaction: unknown,
  ): Promise<string> {
    const adapter = this.requireActiveAdapter();

    return adapter.sendTransaction(transaction);
  }

  has(walletId: string): boolean {
    return this.adapters.has(walletId);
  }

  private requireActiveAdapter(): IWalletAdapter {
    const adapter = this.getActiveAdapter();

    if (!adapter) {
      throw new Error('No active wallet is connected.');
    }

    return adapter;
  }

  destroy(): void {
    for (const adapter of this.adapters.values()) {
      adapter.removeAllListeners();
    }

    this.adapters.clear();
    this.activeWalletId = null;
  }
}
