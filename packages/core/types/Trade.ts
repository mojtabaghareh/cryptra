import type { NetworkId } from '../constants/chains';

export type TradeKind = 'swap' | 'perp_open' | 'perp_close' | 'perp_liquidation';

/**
 * Unified, immutable record of any executed trade (swap or perpetual),
 * used as the raw input for the Reflection Engine / Persona / Replay.
 * This is an append-only audit record — never mutated after confirmation.
 */
export interface Trade {
  id: string;
  userId: string;
  walletId: string;
  kind: TradeKind;
  networkId: NetworkId | null; // null for perp trades that are venue-native (e.g. Hyperliquid L1)
  refId: string; // SwapExecution.id or Order.id / Position.id
  symbolOrPair: string;
  sizeUsd: string;
  feePercent: string;
  feeAmountUsd: string;
  pnlUsd: string | null;
  executedAt: string;
  metadata: Record<string, unknown>;
}

