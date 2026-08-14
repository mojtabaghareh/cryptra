import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BrowserProvider } from 'ethers';
import type { WalletProviderId } from '@cryptra/core';
import { ALL_EVM_CHAIN_IDS } from '../networks/WalletNetworks';
import type {
  IWalletAdapter,
  PreparedEvmTransaction,
  WalletAdapterAccount,
  WalletAdapterEvent,
} from '../interfaces/IWalletAdapter';

export interface WalletConnectAdapterOptions {
  /** WalletConnect Cloud Project ID — required, obtained from cloud.walletconnect.com. */
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

type WcProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

/** Real adapter backed by WalletConnect v2 (multi-chain EVM sessions via QR / deep link). */
export class WalletConnectAdapter implements IWalletAdapter {
  public readonly id: WalletProviderId = 'walletconnect';
  public readonly name = 'WalletConnect';
  public readonly chainType = 'evm' as const;

  private readonly options: WalletConnectAdapterOptions;
  private wcProvider: WcProvider | null = null;
  private browserProvider: BrowserProvider | null = null;
  private account: WalletAdapterAccount | null = null;
  private readonly listeners = new Map<WalletAdapterEvent, Set<(...args: unknown[]) => void>>();

  constructor(options: WalletConnectAdapterOptions) {
    this.options = options;
  }

  async isAvailable(): Promise<boolean> {
    return true; // WalletConnect works anywhere a QR code can be scanned / a deep link opened.
  }

  private async getProvider(): Promise<WcProvider> {
    if (this.wcProvider) return this.wcProvider;

    this.wcProvider = await EthereumProvider.init({
      projectId: this.options.projectId,
      chains: [ALL_EVM_CHAIN_IDS[0]!],
      optionalChains: ALL_EVM_CHAIN_IDS,
      showQrModal: true,
      metadata: this.options.metadata,
    });

    return this.wcProvider;
  }

  async connect(): Promise<WalletAdapterAccount> {
    const provider = await this.getProvider();
    await provider.connect();

    const accounts = provider.accounts;
    const address = accounts[0];
    if (!address) throw new Error('WalletConnect session returned no account.');

    this.browserProvider = new BrowserProvider(provider as never);
    this.account = { address, chainType: 'evm', networkId: provider.chainId };

    provider.on('accountsChanged', (accounts: string[]) => this.handleAccountsChanged(accounts));
    provider.on('chainChanged', (chainId: number) => this.handleChainChanged(chainId));
    provider.on('disconnect', () => this.emit('disconnect'));

    this.emit('connect', this.account);
    return this.account;
  }

  async disconnect(): Promise<void> {
    await this.wcProvider?.disconnect();
    this.browserProvider = null;
    this.account = null;
    this.emit('disconnect');
  }

  getAccount(): WalletAdapterAccount | null {
    return this.account;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.browserProvider || !this.account) throw new Error('WalletConnect is not connected.');
    const signer = await this.browserProvider.getSigner(this.account.address);
    return signer.signMessage(message);
  }

  async sendTransaction(transaction: PreparedEvmTransaction): Promise<{ txHash: string }> {
    if (!this.browserProvider || !this.account) throw new Error('WalletConnect is not connected.');
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
    if (this.account) this.account = { ...this.account, address: accounts[0]! };
    this.emit('accountsChanged', accounts);
  }

  private handleChainChanged(chainId: number): void {
    if (this.account) this.account = { ...this.account, networkId: chainId };
    this.emit('chainChanged', chainId);
  }
}

