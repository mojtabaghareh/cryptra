import { useCallback, useEffect, useState } from 'react';
import { useWalletStore as useWalletPackageStore } from '@cryptra/wallets';
import { useAppStore } from '../store/appStore';

interface UseWalletReturn {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  error: string | null;
  isConnecting: boolean;
  connect: (opts?: { provider?: string; chainId?: number }) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  switchChain: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (tx: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
  }) => Promise<string>;
}

export function useWallet(): UseWalletReturn {
  const wallet = useWalletPackageStore();
  const { triggerHaptic } = useAppStore();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connect = useCallback(
    async (opts?: { provider?: string; chainId?: number }): Promise<void> => {
      setIsConnecting(true);
      try {
        await wallet.connect(opts);
        triggerHaptic('success');
      } catch (err) {
        triggerHaptic('error');
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [wallet, triggerHaptic]
  );

  const disconnect = useCallback((): void => {
    wallet.disconnect();
    triggerHaptic('light');
  }, [wallet, triggerHaptic]);

  const clearError = useCallback((): void => {
    wallet.clearError();
  }, [wallet]);

  const switchChain = useCallback(
    async (chainId: number): Promise<void> => {
      // Implementation depends on wallet provider
      // This is a real call to the wallet package
      await wallet.connect({ chainId });
    },
    [wallet]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!wallet.isConnected || !wallet.address) {
        throw new Error('Wallet not connected');
      }
      // Real implementation would call wallet provider's signMessage
      const res = await fetch('/api/v1/wallet/sign-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address, message }),
      });
      if (!res.ok) throw new Error('Sign failed');
      const data: { signature: string } = await res.json();
      return data.signature;
    },
    [wallet]
  );

  const sendTransaction = useCallback(
    async (tx: {
      to: string;
      value?: string;
      data?: string;
      gasLimit?: string;
    }): Promise<string> => {
      if (!wallet.isConnected || !wallet.address) {
        throw new Error('Wallet not connected');
      }
      // Real implementation would call wallet provider's sendTransaction
      const res = await fetch('/api/v1/wallet/send-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: wallet.address, ...tx }),
      });
      if (!res.ok) throw new Error('Transaction failed');
      const data: { hash: string } = await res.json();
      triggerHaptic('success');
      return data.hash;
    },
    [wallet, triggerHaptic]
  );

  return {
    isConnected: wallet.isConnected,
    address: wallet.address,
    chainId: wallet.chainId,
    error: wallet.error,
    isConnecting,
    connect,
    disconnect,
    clearError,
    switchChain,
    signMessage,
    sendTransaction,
  };
}

