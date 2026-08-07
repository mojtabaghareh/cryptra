// ============================================================
// WalletManager.ts
// ============================================================

import { IWalletAdapter, WalletAccount, TransactionRequest } from './IWalletAdapter';

export class WalletManager {
  private adapters = new Map<string, IWalletAdapter>();
  private activeAdapter: IWalletAdapter | null = null;

  register(adapter: IWalletAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  getInstalledAdapters(): IWalletAdapter[] {
    return Array.from(this.adapters.values()).filter((a) => a.installed);
  }

  async connect(id: string): Promise<WalletAccount> {
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Wallet adapter "${id}" not found.`);
    this.activeAdapter = adapter;
    return await adapter.connect();
  }

  async disconnect(): Promise<void> {
    if (this.activeAdapter) {
      await this.activeAdapter.disconnect();
      this.activeAdapter = null;
    }
  }

  async getBalance(): Promise<string> {
    if (!this.activeAdapter) return "0";
    return this.activeAdapter.getBalance();
  }

  async sendTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.activeAdapter) throw new Error('No wallet connected.');
    return this.activeAdapter.sendTransaction(tx);
  }
}

export const walletManager = new WalletManager();