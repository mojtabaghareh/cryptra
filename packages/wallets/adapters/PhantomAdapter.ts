import { Transaction, VersionedTransaction, type Connection } from '@solana/web3.js';
import type { WalletProviderId } from '@cryptra/core';
import { getSolanaConnection, SOLANA_NETWORK_ID } from '../networks/WalletNetworks';
import type {
  IWalletAdapter,
  WalletAdapterAccount,
  WalletAdapterEvent,
} from '../interfaces/IWalletAdapter';

interface SolanaInjectedProvider {
  isPhantom?: boolean;
  publicKey: { toBase58(): string } | null;
  isConnected: boolean;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toBase58(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array }>;
  signTransaction<T>(transaction: T): Promise<T>;
  signAllTransactions<T>(transactions: T[]): Promise<T[]>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

function getWindowSolana(): SolanaInjectedProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    phantom?: { solana?: SolanaInjectedProvider };
    solana?: SolanaInjectedProvider;
  };
  return w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : undefined);
}

/** Real adapter for the Phantom browser extension / mobile in-app browser (Solana). */
export class PhantomAdapter implements IWalletAdapter {
  public readonly id: WalletProviderId = 'phantom';
  public readonly name = 'Phantom';
  public readonly chainType = 'solana' as const;

  private account: WalletAdapterAccount | null = null;
  private readonly listeners = new Map<WalletAdapterEvent, Set<(...args: unknown[]) => void>>();
  private readonly connection: Connection;

  constructor(connection: Connection = getSolanaConnection()) {
    this.connection = connection;
  }

  async isAvailable(): Promise<boolean> {
    return getWindowSolana() !== undefined;
  }

  async connect(): Promise<WalletAdapterAccount> {
    const raw = getWindowSolana();
    if (!raw) throw new Error('Phantom is not installed or not detected in this browser.');

    const { publicKey } = await raw.connect();
    this.account = { address: publicKey.toBase58(), chainType: 'solana', networkId: SOLANA_NETWORK_ID };

    raw.on('disconnect', () => this.emit('disconnect'));
    raw.on('accountChanged', (newKey: unknown) =>
      this.handleAccountChanged(newKey as { toBase58(): string } | null),
    );

    this.emit('connect', this.account);
    return this.account;
  }

  async disconnect(): Promise<void> {
    await getWindowSolana()?.disconnect();
    this.account = null;
    this.emit('disconnect');
  }

  getAccount(): WalletAdapterAccount | null {
    return this.account;
  }

  async signMessage(message: string): Promise<string> {
    const raw = getWindowSolana();
    if (!raw || !this.account) throw new Error('Phantom is not connected.');
    const encoded = new TextEncoder().encode(message);
    const { signature } = await raw.signMessage(encoded, 'utf8');
    return Buffer.from(signature).toString('hex');
  }

  /** Accepts a fully-built (unsigned) Transaction or VersionedTransaction, signs it via Phantom, and broadcasts it. */
  async sendTransaction(transaction: Transaction | VersionedTransaction): Promise<{ txHash: string }> {
    const raw = getWindowSolana();
    if (!raw || !this.account) throw new Error('Phantom is not connected.');

    const signed = await raw.signTransaction(transaction);
    const rawBytes =
      signed instanceof VersionedTransaction ? signed.serialize() : (signed as Transaction).serialize();

    const signature = await this.connection.sendRawTransaction(rawBytes, {
      skipPreflight: false,
      maxRetries: 3,
    });
    await this.connection.confirmTransaction(signature, 'confirmed');

    return { txHash: signature };
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

  private handleAccountChanged(newKey: { toBase58(): string } | null): void {
    if (!newKey) {
      this.account = null;
      this.emit('disconnect');
      return;
    }
    this.account = { address: newKey.toBase58(), chainType: 'solana', networkId: SOLANA_NETWORK_ID };
    this.emit('accountsChanged', [this.account.address]);
  }
}

