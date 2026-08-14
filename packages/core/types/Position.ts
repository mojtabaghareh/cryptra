import type { PerpVenueId } from '../constants/protocols';
import type { OrderSide } from './Order';

export type PositionStatus = 'open' | 'closed' | 'liquidated';

/** An open (or historical) perpetual position on a given venue. */
export interface Position {
  id: string;
  userId: string;
  walletId: string;
  venue: PerpVenueId;
  symbol: string;
  side: OrderSide;
  sizeRaw: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice: string | null;
  leverage: number;
  marginRaw: string;
  isIsolatedMargin: boolean;
  unrealizedPnlRaw: string;
  realizedPnlRaw: string;
  fundingPaidRaw: string;
  status: PositionStatus;
  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
}

export interface FundingPayment {
  positionId: string;
  venue: PerpVenueId;
  symbol: string;
  fundingRate: string; // decimal string, e.g. "0.0001"
  amountRaw: string;
  paidAt: string;
}

