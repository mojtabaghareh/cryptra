// ============================================================
// MetaMaskAdapter.ts
// ============================================================

import { IWalletAdapter, WalletAccount, TransactionRequest } from './IWalletAdapter';
import { BrowserProvider, ethers } from 'ethers';

export class MetaMaskAdapter implements IWalletAdapter {
  readonly id = 'metamask';
  readonly name = 'MetaMask';
  private provider: BrowserProvider | null = null;

  get installed(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  }

  async connect(): Promise<WalletAccount> {
    if (!this.installed) throw new Error('MetaMask is not installed');
    this.provider = new BrowserProvider(window.ethereum);
    await this.provider.send('eth_requestAccounts', []);
    const signer = await this.provider.getSigner();
    return { address: await signer.getAddress(), chainId: (await this.provider.getNetwork()).chainId };
  }

  async disconnect(): Promise<void> {
    this.provider = null;
  }

  async isConnected(): Promise<boolean> {
    if (!this.provider) return false;
    return (await this.provider.listAccounts()).length > 0;
  }

  async getAccount(): Promise<WalletAccount | null> {
    if (!this.provider) return null;
    const accounts = await this.provider.listAccounts();
    if (accounts.length === 0) return null;
    return { address: accounts[0].address, chainId: (await this.provider.getNetwork()).chainId };
  }

  async getBalance(): Promise<string> {
    const account = await this.getAccount();
    if (!account) return "0";
    return ethers.formatEther(await this.provider!.getBalance(account.address));
  }

  async sendTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.provider) throw new Error('Wallet not connected');
    const signer = await this.provider.getSigner();
    const response = await signer.sendTransaction({
      to: tx.to,
      value: ethers.parseEther(tx.value),
      data: tx.data || '0x',
    });
    return response.hash;
  }

  async switchChain(chainId: number | string): Promise<void> {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${Number(chainId).toString(16)}` }],
    });
  }
}