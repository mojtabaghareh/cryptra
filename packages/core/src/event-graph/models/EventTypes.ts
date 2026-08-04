// ============================================================
// EventTypes.ts
// این فایل تمام انواع رویدادهای مالی کاربر را تعریف می‌کند.
// این فایل قلب غیرقابل تغییر پروژه Cryptra است.
// ============================================================

export enum EventType {
  // معاملات
  BUY = 'BUY',
  SELL = 'SELL',
  SWAP = 'SWAP',
  
  // استیکینگ و دیفای
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  
  // وام و قرض
  BORROW = 'BORROW',
  REPAY = 'REPAY',
  LEND = 'LEND',
  
  // بریج و انتقال
  BRIDGE = 'BRIDGE',
  TRANSFER = 'TRANSFER',
  
  // سایر رویدادها
  CLAIM = 'CLAIM',
  LIQUIDATION = 'LIQUIDATION',
  NFT = 'NFT',
  AIRDROP = 'AIRDROP',
  LIQUIDITY = 'LIQUIDITY',
}

export interface BaseEvent {
  id: string;
  userId: string;
  type: EventType;
  timestamp: number;
  chain: string;
  walletAddress: string;
  txHash?: string;
  amount?: number;
  tokenSymbol?: string;
  tokenAddress?: string;
  price?: number;
  valueUsd?: number;
}

export interface TradeEvent extends BaseEvent {
  type: EventType.BUY | EventType.SELL | EventType.SWAP;
  pair: string;
  price: number;
  amount: number;
  total: number;
  fee: number;
  platform: string;
}

export interface StakeEvent extends BaseEvent {
  type: EventType.STAKE | EventType.UNSTAKE;
  protocol: string;
  apr: number;
}

export interface BridgeEvent extends BaseEvent {
  type: EventType.BRIDGE;
  sourceChain: string;
  destinationChain: string;
  bridgeProtocol: string;
}

export interface TransferEvent extends BaseEvent {
  type: EventType.TRANSFER;
  recipientAddress: string;
}

// نوع اتحاد (Union Type) برای تمام رویدادها
export type FinancialEvent = 
  | TradeEvent 
  | StakeEvent 
  | BridgeEvent 
  | TransferEvent 
  | BaseEvent;
