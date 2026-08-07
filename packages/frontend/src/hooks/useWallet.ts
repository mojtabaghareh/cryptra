import { useState, useEffect } from 'react';
import { walletManager } from '../../../adapters/src/wallet-connectors/WalletManager';
import { registerWallets } from '../../../adapters/src/wallet-connectors/registerWallets';

// ثبت ولت‌ها در زمان لود شدن برنامه
registerWallets();

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // بررسی اتصال اولیه
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await walletManager.isConnected();
      if (isConnected) {
        const account = await walletManager.getAccount();
        if (account) {
          setAddress(account.address);
          const bal = await walletManager.getBalance();
          setBalance(bal);
        }
      }
    };
    checkConnection();
  }, []);

  const connect = async (walletId: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const account = await walletManager.connect(walletId);
      setAddress(account.address);
      const bal = await walletManager.getBalance();
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || 'خطا در اتصال به کیف پول');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    await walletManager.disconnect();
    setAddress(null);
    setBalance('0');
  };

  return {
    address,
    balance,
    isConnecting,
    error,
    connect,
    disconnect,
    isConnected: !!address,
    availableWallets: walletManager.getInstalledAdapters(),
  };
}