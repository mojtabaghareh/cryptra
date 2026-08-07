// ============================================================
// registerWallets.ts
// ============================================================

import { walletManager } from './WalletManager';
import { MetaMaskAdapter } from './MetaMaskAdapter';
import { PhantomAdapter } from './PhantomAdapter';

export function registerWallets(): void {
  walletManager.register(new MetaMaskAdapter());
  walletManager.register(new PhantomAdapter());
}