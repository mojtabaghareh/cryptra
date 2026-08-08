// ============================================================
// Cryptra V2.9 — Phantom Solana Provider
// File: phantom.ts
// Production / Non-Custodial
// ============================================================

export interface PhantomPublicKey {
  toString(): string;
}

export interface PhantomConnectResult {
  publicKey: PhantomPublicKey;
}

export interface PhantomSignatureResult {
  signature: Uint8Array;
}

export interface PhantomSendTransactionResult {
  signature: string;
}

export interface PhantomProvider {
  isPhantom?: boolean;

  isConnected: boolean;

  publicKey: PhantomPublicKey | null;

  connect(
    options?: {
      onlyIfTrusted?: boolean;
    },
  ): Promise<PhantomConnectResult>;

  disconnect(): Promise<void>;

  signMessage(
    message: Uint8Array,
    display?: 'utf8' | 'hex',
  ): Promise<PhantomSignatureResult>;

  signAndSendTransaction(
    transaction: unknown,
  ): Promise<PhantomSendTransactionResult>;

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

interface PhantomWindow extends Window {
  phantom?: {
    solana?: PhantomProvider;
  };

  solana?: PhantomProvider;
}

function getWindow(): PhantomWindow | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window as PhantomWindow;
}

export function getPhantomProvider(): PhantomProvider | null {
  const win = getWindow();

  const provider =
    win?.phantom?.solana ??
    win?.solana ??
    null;

  if (!provider) {
    return null;
  }

  if (provider.isPhantom !== true) {
    return null;
  }

  return provider;
}

export function isPhantomAvailable(): boolean {
  return getPhantomProvider() !== null;
}
