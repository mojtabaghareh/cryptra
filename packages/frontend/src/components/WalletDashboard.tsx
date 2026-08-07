"use client";

import { useState } from "react";
// نکته مهم: مسیر زیر را دقیقاً با توجه به نام پوشه‌های خود چک کنید
import { walletManager } from "../../../adapters/src/wallet-connectors/WalletManager";
import { registerWallets } from "../../../adapters/src/wallet-connectors/registerWallets";

// ثبت ولت‌ها در زمان لود شدن برنامه
registerWallets();

export default function WalletDashboard() {
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const installed = walletManager.getInstalledAdapters();
      if (installed.length === 0) {
        setError("هیچ کیف پول نصب شده‌ای (متامسک/فانتوم) پیدا نشد!");
        return;
      }
      // به اولین کیف پول موجود (متامسک) وصل می‌شویم
      const account = await walletManager.connect(installed[0].id);
      setAddress(account.address);
      
      const bal = await walletManager.getBalance();
      setBalance(bal);
    } catch (e: any) {
      setError(e.message || "خطا در اتصال");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    await walletManager.disconnect();
    setAddress("");
    setBalance("0");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0e14] text-white p-4">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Cryptra
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {!address ? (
          <button
            onClick={connect}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all"
          >
            {isLoading ? "در حال اتصال..." : "🦊 اتصال MetaMask / Phantom"}
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
              <p className="text-xs text-gray-400 mb-1">آدرس کیف پول</p>
              <p className="font-mono text-sm truncate text-blue-400">{address}</p>
            </div>

            <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
              <p className="text-xs text-gray-400 mb-1">موجودی</p>
              <p className="font-bold text-3xl text-green-400">{balance} ETH</p>
            </div>

            <button
              onClick={disconnect}
              className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 font-medium py-2 px-4 rounded-xl transition-all border border-red-900/50"
            >
              قطع اتصال
            </button>
          </div>
        )}
      </div>
    </div>
  );
}