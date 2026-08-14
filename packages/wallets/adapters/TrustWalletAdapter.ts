import { BrowserProvider, type Eip1193Provider as EthersEip1193Provider } from 'ethers';
import type { WalletProviderId } from '@cryptra/core';
import type {
  IWalletAdapter,
  PreparedEvmTransaction,
  WalletAdapterAccount,
  WalletAdapterEvent,
} from '../interfaces/IWalletAdapter';

interface InjectedEip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  providers?: InjectedEip1193Provider[];
}

function getWindowEthereum(): InjectedEip1193Provider | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { ethereum?: InjectedEip1193Provider }).ethereum;
}

/** Real adapter for the Trust Wallet browser extension / mobile in-app browser. */
export class TrustWalletAdapter implements IWalletAdapter {
  public readonly id: WalletProviderId = 'trustwallet';
  public readonly name = 'Trust Wallet';
  public readonly chainType = 'evm' as const;

  private browserProvider: BrowserProvider | null = null;
  private account: WalletAdapterAccount | null = null;
  private readonly listeners = new Map<WalletAdapterEvent, Set<(...args: unknown[]) => void>>();

  private detectRawProvider(): InjectedEip1193Provider | undefined {
    const ethereum = getWindowEthereum();
    if (!ethereum) return undefined;

    if (ethereum.providers?.length) {
      return ethereum.providers.find((p) => p.isTrust || p.isTrustWallet);
    }
    return ethereum.isTrust || ethereum.isTrustWallet ? ethereum : undefined;
  }

  async isAvailable(): Promise<boolean> {
    return this.detectRawProvider() !== undefined;
  }

  async connect(): Promise<WalletAdapterAccount> {
    const raw = this.detectRawProvider();
    if (!raw) {
      throw new Error('Trust Wallet is not installed or not detected in this browser.');
    }

    const accounts = (await raw.request({ method: 'eth_requestAccounts' })) as string[];
    const address = accounts[0];
    if (!address) {
      throw new Error('Trust Wallet did not return any account.');
    }

    const chainIdHex = (await raw.request({ method: 'eth_chainId' })) as string;
    const networkId = parseInt(chainIdHex, 16);

    this.browserProvider = new BrowserProvider(raw as unknown as EthersEip1193Provider);
    this.account = { address, chainType: 'evm', networkId };

    raw.on('accountsChanged', (accounts: unknown) => this.handleAccountsChanged(accounts as string[]));
    raw.on('chainChanged', (hex: unknown) => this.handleChainChanged(hex as string));
    raw.on('disconnect', () => this.emit('disconnect'));

    this.emit('connect', this.account);
    return this.account;
  }

  async disconnect(): Promise<void> {
    this.browserProvider = null;
    this.account = null;
    this.emit('disconnect');
  }

  getAccount(): WalletAdapterAccount | null {
    return this.account;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.browserProvider || !this.account) {
      throw new Error('Trust Wallet is not connected.');
    }
    const signer = await this.browserProvider.getSigner(this.account.address);
    return signer.signMessage(message);
  }

  async sendTransaction(transaction: PreparedEvmTransaction): Promise<{ txHash: string }> {
    if (!this.browserProvider || !this.account) {
      throw new Error('Trust Wallet is not connected.');
    }
    const signer = await this.browserProvider.getSigner(this.account.address);
    const response = await signer.sendTransaction({
      to: transaction.to,
      data: transaction.data,
      value: transaction.value,
      gasLimit: transaction.gasLimit,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
    });
    return { txHash: response.hash };
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

  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.account = null;
      this.emit('disconnect');
      return;
    }
    if (this.account) {
      this.account = { ...this.account, address: accounts[0]! };
    }
    this.emit('accountsChanged', accounts);
  }

  private handleChainChanged(chainIdHex: string): void {
    const networkId = parseInt(chainIdHex, 16);
    if (this.account) {
      this.account = { ...this.account, networkId };
    }
    this.emit('chainChanged', networkId);
  }
}

