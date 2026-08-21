export type BehaviorPattern =
  | 'HIGH_FREQUENCY'
  | 'FOMO_ENTRY'
  | 'PANIC_EXIT'
  | 'REVENGE_TRADE'
  | 'OVERLEVERAGE'
  | 'CONSISTENT'
  | 'INACTIVE'
  | 'IMPROVING';

export interface PatternHit {
  pattern: BehaviorPattern;
  severity: 'low' | 'medium' | 'high';
  message: string;
  evidence: Record<string, unknown>;
}

export interface ReflectionReport {
  userId: string;
  periodDays: number;
  swapCount: number;
  orderCount: number;
  patterns: PatternHit[];
  summary: string;
  generatedAt: Date;
}

/**
 * Heuristic detectors — pure functions over activity counts / timing.
 * Can later be replaced with Event Graph / Neo4j queries.
 */
export function detectPatterns(input: {
  swaps: Array<{ createdAt: Date; status: string }>;
  orders: Array<{ createdAt: Date; leverage: number | null; status: string }>;
  periodDays: number;
}): PatternHit[] {
  const hits: PatternHit[] = [];
  const { swaps, orders, periodDays } = input;

  const totalTrades = swaps.length + orders.length;

  if (totalTrades === 0) {
    hits.push({
      pattern: 'INACTIVE',
      severity: 'low',
      message: 'No trading activity in this period.',
      evidence: { periodDays },
    });
    return hits;
  }

  // High frequency: more than 10 trades/day average
  const perDay = totalTrades / Math.max(periodDays, 1);
  if (perDay >= 10) {
    hits.push({
      pattern: 'HIGH_FREQUENCY',
      severity: 'medium',
      message: `High trade frequency (~${perDay.toFixed(1)} trades/day). Consider slowing down.`,
      evidence: { totalTrades, perDay },
    });
  }

  // Overleverage
  const highLev = orders.filter((o) => (o.leverage ?? 0) >= 20);
  if (highLev.length >= 3) {
    hits.push({
      pattern: 'OVERLEVERAGE',
      severity: 'high',
      message: `${highLev.length} orders with leverage ≥ 20x. Elevated liquidation risk.`,
      evidence: { count: highLev.length },
    });
  }

  // Revenge trade heuristic: multiple orders within 15 minutes
  const sortedOrders = [...orders].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  let rapidBursts = 0;
  for (let i = 1; i < sortedOrders.length; i++) {
    const delta =
      sortedOrders[i].createdAt.getTime() - sortedOrders[i - 1].createdAt.getTime();
    if (delta < 15 * 60 * 1000) rapidBursts += 1;
  }
  if (rapidBursts >= 3) {
    hits.push({
      pattern: 'REVENGE_TRADE',
      severity: 'medium',
      message: 'Several trades placed within minutes of each other — possible emotional trading.',
      evidence: { rapidBursts },
    });
  }

  if (hits.length === 0) {
    hits.push({
      pattern: 'CONSISTENT',
      severity: 'low',
      message: 'Activity looks measured in this period. Keep reflecting weekly.',
      evidence: { totalTrades },
    });
  }

  return hits;
}

export function buildSummary(patterns: PatternHit[], totalTrades: number): string {
  if (totalTrades === 0) {
    return 'No activity to reflect on this week. When you trade, Cryptra will help you see your decision patterns.';
  }
  const high = patterns.filter((p) => p.severity === 'high');
  if (high.length > 0) {
    return high.map((p) => p.message).join(' ');
  }
  return patterns.map((p) => p.message).join(' ');
}
