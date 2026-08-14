import TonConnect, { type Wallet as TonWallet, type WalletInfo } from '@tonconnect/sdk';
import type { WalletProviderId } from '@cryptra/core';
import { getTonConnectManifestUrl, TON_NETWORK_ID } from '../networks/WalletNetworks';
import type {
  IWalletAdapter,
  WalletAdapterAccount,
  WalletAdapterEvent,
} from '../interfaces/IWalletAdapter';

export interface TonMessage {
  address: string; // recipient, raw or friendly TON address
  amountNano: string; // amount in nanoTON, integer string
  payload?: string; // base64 BOC cell, optional
  stateInit?: string; // base64 BOC, optional (for contract deployment)
}

/**
 * Real adapter backed by the official @tonconnect/sdk, connecting to any
 * TON Connect compatible wallet (Tonkeeper, Wallet in Telegram, MyTonWallet, ...)
 * over the TON Connect bridge protocol.
 */
export class TonConnectAdapter implements IWalletAdapter {
  public readonly id: WalletProviderId = 'tonconnect';
  public readonly name = 'TON Connect';
  public readonly chainType = 'ton' as const;

  private connector: TonConnect | null = null;
  private account: WalletAdapterAccount | null = null;
  private readonly listeners = new Map<WalletAdapterEvent, Set<(...args: unknown[]) => void>>();

  private getConnector(): TonConnect {
    if (this.connector) return this.connector;
    this.connector = new TonConnect({ manifestUrl: getTonConnectManifestUrl() });

    this.connector.onStatusChange((wallet) => {
      if (!wallet) {
        this.account = null;
        this.emit('disconnect');
        return;
      }
      this.account = this.toAdapterAccount(wallet);
      this.emit('accountsChanged', [this.account.address]);
    });

    return this.connector;
  }

  private toAdapterAccount(wallet: TonWallet): WalletAdapterAccount {
    return {
      address: wallet.account.address,
      chainType: 'ton',
      networkId: TON_NETWORK_ID,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true; // TON Connect always works via QR / deep link / Telegram in-app bridge.
  }

  async getWalletsList(): Promise<WalletInfo[]> {
    return this.getConnector().getWallets();
  }

  /** Opens a TON Connect session with the given wallet (from getWalletsList()). */
  async connect(walletInfo?: WalletInfo): Promise<WalletAdapterAccount> {
    const connector = this.getConnector();
    const wallets = walletInfo ? [walletInfo] : await connector.getWallets();
    const target = walletInfo ?? wallets[0];
    if (!target) throw new Error('No TON Connect compatible wallet available.');

    const connectSource =
      'universalLink' in target
        ? { universalLink: target.universalLink, bridgeUrl: target.bridgeUrl }
        : { jsBridgeKey: target.jsBridgeKey };

    connector.connect(connectSource);

    const wallet = await new Promise<TonWallet>((resolve, reject) => {
      const unsubscribe = connector.onStatusChange((w) => {
        if (w) {
          unsubscribe();
          resolve(w);
        }
      }, reject);
    });

    this.account = this.toAdapterAccount(wallet);
    this.emit('connect', this.account);
    return this.account;
  }

  async disconnect(): Promise<void> {
    await this.connector?.disconnect();
    this.account = null;
    this.emit('disconnect');
  }

  getAccount(): WalletAdapterAccount | null {
    return this.account;
  }

  /**
   * TON Connect does not sign arbitrary strings directly; ownership proof is
   * obtained via the `ton_proof` connect item requested at connection time.
   * Callers that need a fresh proof should reconnect requesting `tonProof`.
   */
  async signMessage(_message: string): Promise<string> {
    throw new Error(
      'TON Connect signs ownership via ton_proof at connect() time, not via an arbitrary signMessage call. ' +
        'Request a fresh session with a tonProof payload instead.',
    );
  }

  async sendTransaction(transaction: { validUntil: number; messages: TonMessage[] }): Promise<{ txHash: string }> {
    if (!this.connector || !this.account) throw new Error('TON Connect is not connected.');

    const result = await this.connector.sendTransaction({
      validUntil: transaction.validUntil,
      messages: transaction.messages.map((m) => ({
        address: m.address,
        amount: m.amountNano,
        payload: m.payload,
        stateInit: m.stateInit,
      })),
    });

    // TON Connect returns the signed, broadcast BOC — the hash is derived
    // downstream (services/transactions) once the message is seen on-chain.
    return { txHash: result.boc };
  }

  on(event: WalletAdapterEvent, handler: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: WalletAdapterEvent, handler: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: WalletAdapterEvent, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((handler) => handler(...args));
  }
}

