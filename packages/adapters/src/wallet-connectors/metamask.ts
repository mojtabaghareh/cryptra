// ============================================================
// Cryptra V2.9 — MetaMask Provider
// File: metamask.ts
// EIP-1193 Provider
// ============================================================

export interface EIP1193RequestArguments {
  method: string;
  params?: unknown[];
}

export interface MetaMaskProvider {
  isMetaMask?: boolean;

  request(
    args: EIP1193RequestArguments,
  ): Promise<unknown>;

  on(
    event: string,
    listener: (...args: unknown[]) => void,
  ): void;

  removeListener(
    event: string,
    listener: (...args: unknown[]) => void,
  ): void;

  removeAllListeners(
    event?: string,
  ): void;
}

interface EthereumWindow extends Window {
  ethereum?: MetaMaskProvider & {
    providers?: MetaMaskProvider[];
  };
}

function getWindow(): EthereumWindow | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window as EthereumWindow;
}

export function getMetaMaskProvider(): MetaMaskProvider | null {
  const ethereum = getWindow()?.ethereum;

  if (!ethereum) {
    return null;
  }

  // Multiple injected EVM wallets can exist.
  // Prefer the provider explicitly identified as MetaMask.
  if (Array.isArray(ethereum.providers)) {
    const metaMaskProvider = ethereum.providers.find(
      provider => provider.isMetaMask === true,
    );

    if (metaMaskProvider) {
      return metaMaskProvider;
    }
  }

  if (ethereum.isMetaMask === true) {
    return ethereum;
  }

  return null;
}

export function isMetaMaskAvailable(): boolean {
  return getMetaMaskProvider() !== null;
}
