export type OrderSide = 'LONG' | 'SHORT';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';

export interface PlaceOrderRequest {
  userId: string;
  protocol: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  size: string;
  price?: string;
  stopPrice?: string;
  leverage: number;
}

export interface PlaceOrderResult {
  orderId: string;
  status: string;
  externalId?: string;
}

/** Normalized market row from any official venue API */
export interface PerpMarketSnapshot {
  symbol: string;
  markPrice?: string;
  midPrice?: string;
  indexPrice?: string;
  fundingRate?: string;
  openInterest?: string;
  maxLeverage?: number;
  volume24h?: string;
  raw?: unknown;
}

export interface IPerpAdapter {
  readonly id: string;
  readonly name: string;

  isAvailable(): Promise<boolean>;

  placeOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    size: string;
    price?: string;
    stopPrice?: string;
    leverage: number;
    userAddress?: string;
  }): Promise<{ externalId: string; status: string; message?: string }>;

  cancelOrder?(externalId: string): Promise<void>;

  getPosition?(symbol: string, userAddress: string): Promise<unknown>;

  getMarkPrice?(symbol: string): Promise<string>;

  /** List markets from official venue API */
  listMarkets?(): Promise<PerpMarketSnapshot[]>;
}
