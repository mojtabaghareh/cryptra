// ============================================================
// metamask.ts
// Adapter برای اتصال به MetaMask و خواندن تراکنش‌ها
// ============================================================

export interface MetaMaskTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // به صورت هگزادسیمال
  blockNumber: number;
  timestamp: number;
  tokenTransfers?: {
    contract: string;
    symbol: string;
    amount: string;
  }[];
}

/**
 * کلاس آداپتور MetaMask
 * برای خواندن تاریخچه تراکنش‌های کاربر از شبکه
 */
export class MetaMaskAdapter {
  private apiKey: string;
  private baseUrl: string = 'https://api.etherscan.io/api';

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  /**
   * دریافت تراکنش‌های یک آدرس کیف پول در شبکه اتریوم
   */
  async getTransactions(address: string): Promise<MetaMaskTransaction[]> {
    try {
      // در نسخه‌ی واقعی، از API Etherscan استفاده می‌شود
      console.log(`📤 [MetaMask] دریافت تراکنش‌های آدرس: ${address}`);

      // شبیه‌سازی داده‌های تراکنش
      await new Promise(resolve => setTimeout(resolve, 600));

      // بازگرداندن تراکنش‌های شبیه‌سازی‌شده
      return [
        {
          hash: '0x' + Math.random().toString(16).substring(2, 40),
          from: address,
          to: '0x' + Math.random().toString(16).substring(2, 40),
          value: '0x' + (Math.floor(Math.random() * 1000000000000000000)).toString(16),
          blockNumber: 19000000 + Math.floor(Math.random() * 1000),
          timestamp: Math.floor(Date.now() / 1000) - 3600 * 24,
          tokenTransfers: [
            {
              contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              symbol: 'USDT',
              amount: '1000000000',
            },
          ],
        },
      ];
    } catch (error) {
      console.error('خطا در دریافت تراکنش از MetaMask:', error);
      return [];
    }
  }
}
