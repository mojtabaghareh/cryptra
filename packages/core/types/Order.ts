import type { PerpVenueId } from '../constants/protocols';

export type OrderSide = 'long' | 'short';
export type OrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit' | 'take_profit';
export type OrderStatus =
  | 'pending'
  | 'open'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

/** A perpetual order, submitted to a Perpetual Venue (packages/perp-engine). */
export interface Order {
  id: string;
  userId: string;
  walletId: string;
  venue: PerpVenueId;
  symbol: string; // e.g. "BTC-PERP"
  side: OrderSide;
  type: OrderType;
  sizeRaw: string; // contract size in venue's base precision
  limitPrice: string | null;
  triggerPrice: string | null;
  leverage: number;
  reduceOnly: boolean;
  postOnly: boolean;
  status: OrderStatus;
  filledSizeRaw: string;
  avgFillPrice: string | null;
  venueOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderCreateInput = Omit<
  Order,
  | 'id'
  | 'status'
  | 'filledSizeRaw'
  | 'avgFillPrice'
  | 'venueOrderId'
  | 'createdAt'
  | 'updatedAt'
>;

