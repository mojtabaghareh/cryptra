// packages/core/src/intelligence/DecisionEngine.ts

export interface TradeDecision {
  userId: string;
  type: 'BUY' | 'SELL' | 'SWAP' | 'HOLD';
  asset: string;
  amount: number;
  price: number;
  timestamp: Date;
}

export interface AnalysisResult {
  score: number;
  style: 'Conservative' | 'Balanced' | 'Aggressive';
  riskLevel: number;
  warnings: string[];
}

export class DecisionEngine {
  async analyze(history: TradeDecision[]): Promise<AnalysisResult> {
    // منطق موقتی
    const tradeCount = history.length;
    let score = 50;
    let style: 'Conservative' | 'Balanced' | 'Aggressive' = 'Balanced';
    let riskLevel = 0.5;
    const warnings: string[] = [];

    if (tradeCount > 10) {
      style = 'Aggressive';
      riskLevel = 0.8;
      warnings.push('شما تمایل به معاملات پرریسک دارید.');
    } else if (tradeCount < 3) {
      style = 'Conservative';
      riskLevel = 0.2;
      warnings.push('شما بسیار محتاط هستید، شاید فرصت‌ها را از دست می‌دهید.');
    }

    score = Math.max(0, 100 - riskLevel * 40);
    return { score, style, riskLevel, warnings };
  }
}