// ============================================================
// PhantomAdapter.ts
// ============================================================

import { IWalletAdapter, WalletAccount, TransactionRequest } from './IWalletAdapter';
import { Connection, PublicKey, LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';

export class PhantomAdapter implements IWalletAdapter {
  readonly id = 'phantom';
  readonly name = 'Phantom';
  private connection: Connection;

  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  get installed(): boolean {
    return typeof window !== 'undefined' && !!window.solana?.isPhantom;
  }

  async connect(): Promise<WalletAccount> {
    if (!this.installed) throw new Error('Phantom is not installed');
    await window.solana.connect();
    return { address: window.solana.publicKey.toString(), chainId: 'solana' };
  }

  async disconnect(): Promise<void> {
    await window.solana.disconnect();
  }

  async isConnected(): Promise<boolean> {
    return !!window.solana?.isConnected;
  }

  async getAccount(): Promise<WalletAccount | null> {
    if (!this.isConnected()) return null;
    return { address: window.solana.publicKey.toString(), chainId: 'solana' };
  }

  async getBalance(): Promise<string> {
    const account = await this.getAccount();
    if (!account) return "0";
    const balance = await this.connection.getBalance(new PublicKey(account.address));
    return (balance / LAMPORTS_PER_SOL).toString();
  }

  async sendTransaction(tx: TransactionRequest): Promise<string> {
    throw new Error('Phantom sendTransaction requires Solana-specific instruction building. Implement later.');
  }

  async switchChain(chainId: number | string): Promise<void> {
    console.warn('Phantom does not support switching chains');
  }
