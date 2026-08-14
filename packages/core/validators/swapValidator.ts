import { z } from 'zod';
import { isValidEvmAddress } from './walletValidator';

const rawIntegerString = z
  .string()
  .regex(/^[0-9]+$/, 'must be an integer string in the smallest unit');

export const swapQuoteRequestSchema = z.object({
  userId: z.string().min(1),
  networkId: z.union([z.number().int().positive(), z.literal('solana'), z.literal('ton')]),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amountInRaw: rawIntegerString,
  slippageBps: z.number().int().min(1).max(5000), // 0.01% .. 50%
});

export const swapExecutionConfirmSchema = z.object({
  userId: z.string().min(1),
  walletId: z.string().min(1),
  quoteId: z.string().min(1),
  signedTransaction: z.string().min(1).optional(),
});

export type SwapQuoteRequestSchema = z.infer<typeof swapQuoteRequestSchema>;
export type SwapExecutionConfirmSchema = z.infer<typeof swapExecutionConfirmSchema>;

export function validateSwapQuoteRequest(input: unknown): SwapQuoteRequestSchema {
  const parsed = swapQuoteRequestSchema.parse(input);

  if (
    typeof parsed.networkId === 'number' &&
    (!isValidEvmAddress(parsed.fromToken) || !isValidEvmAddress(parsed.toToken))
  ) {
    // Native asset sentinel addresses are valid 20-byte hex too, so this
    // check simply enforces well-formed EVM token addresses on EVM chains.
    throw new Error('fromToken/toToken must be valid EVM addresses for EVM networks');
  }

  return parsed;
}

export function validateSwapExecutionConfirm(input: unknown): SwapExecutionConfirmSchema {
  return swapExecutionConfirmSchema.parse(input);
}

