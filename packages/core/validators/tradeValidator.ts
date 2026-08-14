import { z } from 'zod';

const rawIntegerString = z.string().regex(/^[0-9]+$/, 'must be an integer string');
const decimalString = z.string().regex(/^-?[0-9]+(\.[0-9]+)?$/, 'must be a decimal string');

export const orderCreateSchema = z.object({
  userId: z.string().min(1),
  walletId: z.string().min(1),
  venue: z.enum(['hyperliquid', 'dydx', 'gmx', 'drift']),
  symbol: z.string().regex(/^[A-Z0-9]{2,15}-PERP$/, 'symbol must look like "BTC-PERP"'),
  side: z.enum(['long', 'short']),
  type: z.enum(['market', 'limit', 'stop_market', 'stop_limit', 'take_profit']),
  sizeRaw: rawIntegerString,
  limitPrice: decimalString.nullable(),
  triggerPrice: decimalString.nullable(),
  leverage: z.number().min(1).max(125),
  reduceOnly: z.boolean(),
  postOnly: z.boolean(),
});

export const positionCloseSchema = z.object({
  userId: z.string().min(1),
  positionId: z.string().min(1),
  sizeRaw: rawIntegerString.optional(), // omitted = close entire position
});

export type OrderCreateSchema = z.infer<typeof orderCreateSchema>;
export type PositionCloseSchema = z.infer<typeof positionCloseSchema>;

export function validateOrderCreate(input: unknown): OrderCreateSchema {
  const parsed = orderCreateSchema.parse(input);

  if (parsed.type === 'limit' || parsed.type === 'stop_limit') {
    if (!parsed.limitPrice) {
      throw new Error(`limitPrice is required for order type "${parsed.type}"`);
    }
  }
  if (parsed.type === 'stop_market' || parsed.type === 'stop_limit' || parsed.type === 'take_profit') {
    if (!parsed.triggerPrice) {
      throw new Error(`triggerPrice is required for order type "${parsed.type}"`);
    }
  }

  return parsed;
}

export function validatePositionClose(input: unknown): PositionCloseSchema {
  return positionCloseSchema.parse(input);
}

