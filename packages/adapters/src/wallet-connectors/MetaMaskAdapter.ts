// ============================================================
// Cryptra V2.9 — MetaMask Wallet Adapter
// File: MetaMaskAdapter.ts
// Production / Non-Custodial
// ============================================================

import {
  EvmTransaction,
  IWalletAdapter,
  WalletAccount,
  WalletConnectOptions,
} from './IWalletAdapter';

import {
  getMetaMaskProvider,
  isMetaMaskAvailable,
  MetaMaskProvider,
} from './metamask';

export class MetaMaskAdapter implements IWalletAdapter {
  readonly id = 'metamask';
  readonly name = 'MetaMask';
  readonly chainType = 'evm' as const;

  private provider: MetaMaskProvider | null = null;

  constructor() {
    this.provider = getMetaMaskProvider();
  }

  isAvailable(): boolean {
    return isMetaMaskAvailable();
  }

  isConnected(): boolean {
    return Boolean(this.provider);
  }

  async connect(
    options: WalletConnectOptions = {},
  ): Promise<WalletAccount> {
    if (!this.provider) {
      throw new Error('MetaMask is not installed or available.');
    }

    let accounts: string[];

    if (options.onlyIfTrusted) {
      accounts = await this.provider.request({
        method: 'eth_accounts',
      }) as string[];
    } else {
      accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      }) as string[];
    }

    if (!accounts.length) {
      throw new Error('No MetaMask account was returned.');
    }

    if (options.chainId !== undefined) {
      await this.switchChain(options.chainId);
    }

    const chainId = await this.getChainId();

    return {
      address: accounts[0],
      chainType: 'evm',
      chainId: chainId ?? undefined,
    };
  }

  async disconnect(): Promise<void> {
    // EIP-1193 wallets generally do not expose a universal
    // programmatic disconnect method.
    //
    // Cryptra therefore clears its local session state.
    // The wallet remains under the user's control.
    this.removeAllListeners();
  }

  async getAccount(): Promise<WalletAccount | null> {
    if (!this.provider) {
      return null;
    }

    const accounts = await this.provider.request({
      method: 'eth_accounts',
    }) as string[];

    if (!accounts.length) {
      return null;
    }

    const chainId = await this.getChainId();

    return {
      address: accounts[0],
      chainType: 'evm',
      chainId: chainId ?? undefined,
    };
  }

  async getAddress(): Promise<string | null> {
    const account = await this.getAccount();
    return account?.address ?? null;
  }

  async getChainId(): Promise<number | null> {
    if (!this.provider) {
      return null;
    }

    const chainIdHex = await this.provider.request({
      method: 'eth_chainId',
    }) as string;

    return Number.parseInt(chainIdHex, 16);
  }

  async switchChain(chainId: number | string): Promise<void> {
    if (!this.provider) {
      throw new Error('MetaMask is not available.');
    }

    const numericChainId =
      typeof chainId === 'number'
        ? chainId
        : Number(chainId);

    if (!Number.isInteger(numericChainId)) {
      throw new Error(`Invalid EVM chain ID: ${chainId}`);
    }

    const hexChainId = `0x${numericChainId.toString(16)}`;

    await this.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider) {
      throw new Error('MetaMask is not available.');
    }

    const address = await this.getAddress();

    if (!address) {
      throw new Error('MetaMask wallet is not connected.');
    }

    return await this.provider.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string;
  }

  async sendTransaction(transaction: unknown): Promise<string> {
    if (!this.provider) {
      throw new Error('MetaMask is not available.');
    }

    const tx = transaction as EvmTransaction;

    if (!tx || typeof tx !== 'object') {
      throw new Error('Invalid EVM transaction.');
    }

    if (!tx.to) {
      throw new Error('Transaction recipient is required.');
    }

    const from = tx.from ?? await this.getAddress();

    if (!from) {
      throw new Error('MetaMask wallet is not connected.');
    }

    return await this.provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from,
          to: tx.to,
          ...(tx.value !== undefined && { value: tx.value }),
          ...(tx.data !== undefined && { data: tx.data }),
          ...(tx.gas !== undefined && { gas: tx.gas }),
          ...(tx.gasPrice !== undefined && { gasPrice: tx.gasPrice }),
          ...(tx.maxFeePerGas !== undefined && {
            maxFeePerGas: tx.maxFeePerGas,
          }),
          ...(tx.maxPriorityFeePerGas !== undefined && {
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
          }),
          ...(tx.nonce !== undefined && { nonce: tx.nonce }),
        },
      ],
    }) as string;
  }

  on<K extends keyof import('./IWalletAdapter').WalletEventMap>(
    event: K,
    listener: import('./IWalletAdapter').WalletEventMap[K],
  ): () => void {
    if (!this.provider) {
      return () => undefined;
    }

    const handler = listener as (...args: unknown[]) => void;

    this.provider.on(event, handler);

    return () => {
      this.provider?.removeListener(event, handler);
    };
  }

  removeAllListeners(): void {
    this.provider?.removeAllListeners('accountsChanged');
    this.provider?.removeAllListeners('chainChanged');
    this.provider?.removeAllListeners('disconnect');
  }
}
