// ============================================================
// Cryptra V2.9 — Wallet Registration
// File: registerWallets.ts
// ============================================================

import { WalletManager } from './WalletManager';

import { MetaMaskAdapter } from './MetaMaskAdapter';
import { PhantomAdapter } from './PhantomAdapter';
import { TonConnectAdapter } from './ton-connect';

export interface WalletRegistrationConfig {
  tonManifestUrl: string;
}

export function registerWallets(
  manager: WalletManager,
  config: WalletRegistrationConfig,
): WalletManager {
  if (!config.tonManifestUrl) {
    throw new Error(
      'TON Connect manifest URL is required.',
    );
  }

  manager.register(
    new MetaMaskAdapter(),
  );

  manager.register(
    new PhantomAdapter(),
  );

  manager.register(
    new TonConnectAdapter({
      manifestUrl: config.tonManifestUrl,
    }),
  );

  return manager;
}

export function createWalletManager(
  config: WalletRegistrationConfig,
): WalletManager {
  const manager = new WalletManager();

  return registerWallets(
    manager,
    config,
  );
}
