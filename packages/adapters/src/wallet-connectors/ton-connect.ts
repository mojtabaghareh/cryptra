// ============================================================
// Cryptra V2.9 — TON Connect Adapter
// File: ton-connect.ts
// Production / Non-Custodial
// ============================================================

import TonConnect, {
  SendTransactionRequest,
} from '@tonconnect/sdk';

import {
  IWalletAdapter,
  WalletAccount,
  WalletConnectOptions,
} from './IWalletAdapter';

export interface TonConnectAdapterConfig {
  manifestUrl: string;
}

export class TonConnectAdapter implements IWalletAdapter {
  readonly id = 'ton-connect';
  readonly name = 'TON Connect';
  readonly chainType = 'ton' as const;

  private readonly connector: TonConnect;

  private unsubscribeStatus: (() => void) | null = null;

  private currentAccount: WalletAccount | null = null;

  constructor(config: TonConnectAdapterConfig) {
    if (!config.manifestUrl) {
      throw new Error(
        'TON Connect manifest URL is required.',
      );
    }

    this.connector = new TonConnect({
      manifestUrl: config.manifestUrl,
    });

    this.unsubscribeStatus =
      this.connector.onStatusChange(
        wallet => {
          if (!wallet) {
            this.currentAccount = null;
            return;
          }

          this.currentAccount = {
            address: wallet.account.address,
            chainType: 'ton',
            chainId: wallet.account.chain,
          };
        },
        error => {
          console.error(
            '[Cryptra][TON Connect]',
            error,
          );
        },
      );
  }

  isAvailable(): boolean {
    // TON Connect supports both injected wallets and
    // external wallets through the official bridge protocol.
    return typeof window !== 'undefined';
  }

  isConnected(): boolean {
    return this.connector.connected;
  }

  async connect(
    _options: WalletConnectOptions = {},
  ): Promise<WalletAccount> {
    await this.connector.restoreConnection();

    if (this.connector.connected && this.connector.account) {
      const account: WalletAccount = {
        address: this.connector.account.address,
        chainType: 'ton',
        chainId: this.connector.account.chain,
      };

      this.currentAccount = account;

      return account;
    }

    const wallets = await this.connector.getWallets();

    if (!wallets.length) {
      throw new Error(
        'No TON Connect compatible wallets were found.',
      );
    }

    /*
     * Prefer an injected wallet when available.
     * Otherwise use the first official wallet entry.
     */
    const injectedWallet =
      wallets.find(wallet => {
        return 'jsBridgeKey' in wallet;
      });

    const selectedWallet =
      injectedWallet ?? wallets[0];

    const connectionSource =
      'jsBridgeKey' in selectedWallet &&
      selectedWallet.jsBridgeKey
        ? {
            jsBridgeKey: selectedWallet.jsBridgeKey,
          }
        : {
            universalLink:
              'universalLink' in selectedWallet
                ? selectedWallet.universalLink
                : undefined,
            bridgeUrl:
              'bridgeUrl' in selectedWallet
                ? selectedWallet.bridgeUrl
                : undefined,
          };

    if (
      !('jsBridgeKey' in connectionSource) &&
      (!connectionSource.universalLink ||
        !connectionSource.bridgeUrl)
    ) {
      throw new Error(
        'Selected TON wallet does not provide a valid connection source.',
      );
    }

    const universalLink =
      this.connector.connect(
        connectionSource as never,
      );

    /*
     * For external wallets, TON Connect returns a universal link.
     * The host application is responsible for opening it.
     */
    if (typeof universalLink === 'string') {
      if (typeof window !== 'undefined') {
        window.location.href = universalLink;
      }
    }

    /*
     * Connection completion is asynchronous and arrives
     * through onStatusChange().
     */
    const account = await this.waitForConnection();

    this.currentAccount = account;

    return account;
  }

  async disconnect(): Promise<void> {
    await this.connector.disconnect();

    this.currentAccount = null;
  }

  async restoreConnection(): Promise<WalletAccount | null> {
    await this.connector.restoreConnection();

    if (!this.connector.connected) {
      this.currentAccount = null;
      return null;
    }

    if (!this.connector.account) {
      return null;
    }

    const account: WalletAccount = {
      address: this.connector.account.address,
      chainType: 'ton',
      chainId: this.connector.account.chain,
    };

    this.currentAccount = account;

    return account;
  }

  async getAccount(): Promise<WalletAccount | null> {
    if (!this.connector.connected) {
      return null;
    }

    if (!this.connector.account) {
      return null;
    }

    const account: WalletAccount = {
      address: this.connector.account.address,
      chainType: 'ton',
      chainId: this.connector.account.chain,
    };

    this.currentAccount = account;

    return account;
  }

  async getAddress(): Promise<string | null> {
    const account = await this.getAccount();

    return account?.address ?? null;
  }

  async getChainId(): Promise<string | null> {
    const account = await this.getAccount();

    if (!account) {
      return null;
    }

    return String(account.chainId);
  }

  async signMessage(_message: string): Promise<string> {
    /*
     * TON Connect supports signData/signMessage depending on
     * the requested protocol capability.
     *
     * Cryptra should use the explicit structured signing flow
     * for authentication instead of silently converting a
     * plain string into a transaction.
     */
    throw new Error(
      'Use the dedicated TON Connect signData/signMessage flow for TON authentication.',
    );
  }

  async sendTransaction(
    transaction: unknown,
  ): Promise<string> {
    if (!this.connector.connected) {
      throw new Error(
        'TON wallet is not connected.',
      );
    }

    const request =
      transaction as SendTransactionRequest;

    if (!request || typeof request !== 'object') {
      throw new Error(
        'Invalid TON transaction request.',
      );
    }

    if (
      !request.validUntil ||
      !Array.isArray(request.messages) ||
      request.messages.length === 0
    ) {
      throw new Error(
        'TON transaction must contain validUntil and at least one message.',
      );
    }

    const response =
      await this.connector.sendTransaction(
        request,
      );

    /*
     * TON Connect returns a BOC transaction payload.
     * The TON network transaction hash should be resolved by
     * the backend/indexer after broadcast confirmation.
     */
    return response.boc;
  }

  on<K extends keyof import('./IWalletAdapter').WalletEventMap>(
    event: K,
    listener: import('./IWalletAdapter').WalletEventMap[K],
  ): () => void {
    if (event !== 'disconnect') {
      return () => undefined;
    }

    const wrapped = () => {
      listener();
    };

    const unsubscribe =
      this.connector.onStatusChange(
        wallet => {
          if (!wallet) {
            wrapped();
          }
        },
      );

    return unsubscribe;
  }

  removeAllListeners(): void {
    if (this.unsubscribeStatus) {
      this.unsubscribeStatus();
      this.unsubscribeStatus = null;
    }
  }

  private waitForConnection(): Promise<WalletAccount> {
    return new Promise(
      (resolve, reject) => {
        let settled = false;

        const timeout = window.setTimeout(
          () => {
            if (settled) {
              return;
            }

            settled = true;

            unsubscribe();

            reject(
              new Error(
                'TON Connect connection timed out.',
              ),
            );
          },
          120_000,
        );

        const unsubscribe =
          this.connector.onStatusChange(
            wallet => {
              if (settled || !wallet) {
                return;
              }

              settled = true;

              window.clearTimeout(timeout);
              unsubscribe();

              resolve({
                address: wallet.account.address,
                chainType: 'ton',
                chainId: wallet.account.chain,
              });
            },
            error => {
              if (settled) {
                return;
              }

              settled = true;

              window.clearTimeout(timeout);
              unsubscribe();

              reject(error);
            },
          );
      },
    );
  }
}
