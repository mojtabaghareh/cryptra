/**
 * End-to-end real swap execution for Cryptra Mini App.
 * Flow: API quote → API build → wallet sign/send → API execute (record + XP)
 */

import {
  requestSwapQuote,
  buildSwapTx,
  executeSwap,
  type SwapQuoteResult,
} from './api';
import { sendEvmSwapTransaction } from './ethereum';
import { signAndSendJupiterSwap } from './solana';

const EVM_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  base: 8453,
};

export interface ExecuteSwapParams {
  token: string;
  walletAddress: string;
  /** metamask | phantom | trust | ton | demo */
  walletProvider: string | null;
  fromToken: string;
  toToken: string;
  /** amount in human units (e.g. "0.1") — converted with decimals */
  fromAmountHuman: string;
  decimals: number;
  fromChain: string;
  toChain: string;
  slippageBps?: number;
  onStatus?: (step: string) => void;
}

export interface ExecuteSwapResult {
  quote: SwapQuoteResult;
  txHash: string;
  swapId: string;
  protocol: string;
  status: string;
}

function toRawAmount(human: string, decimals: number): string {
  const n = Number(human);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount');
  // Avoid float issues for common decimals
  const [intPart, frac = ''] = human.trim().split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const raw = BigInt(intPart || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0');
  if (raw <= 0n) throw new Error('Amount too small');
  return raw.toString();
}

export async function executeSwapEndToEnd(params: ExecuteSwapParams): Promise<ExecuteSwapResult> {
  const {
    token,
    walletAddress,
    walletProvider,
    fromToken,
    toToken,
    fromAmountHuman,
    decimals,
    fromChain,
    toChain,
    slippageBps = 50,
    onStatus,
  } = params;

  if (!token) throw new Error('Login via Telegram first (session required)');
  if (!walletAddress) throw new Error('Connect a wallet first');
  if (walletProvider === 'demo') {
    throw new Error('Demo wallet cannot sign real swaps. Connect MetaMask or Phantom.');
  }

  const fromAmount = toRawAmount(fromAmountHuman, decimals);

  onStatus?.('Fetching best quote…');
  const quoteRes = await requestSwapQuote(token, {
    fromToken,
    toToken,
    fromAmount,
    fromChain,
    toChain,
    slippageBps,
  });
  if (!quoteRes.success || !quoteRes.data) throw new Error('Quote failed');
  const quote = quoteRes.data;

  onStatus?.(`Building tx (${quote.protocol})…`);
  const buildRes = await buildSwapTx(token, {
    quoteId: quote.quoteId,
    userAddress: walletAddress,
  });
  if (!buildRes.success || !buildRes.data?.transaction) {
    throw new Error('Build transaction failed');
  }

  const protocol = (buildRes.data.protocol || quote.protocol || '').toLowerCase();
  const chain = (buildRes.data.chain || fromChain).toLowerCase();
  const built = buildRes.data.transaction;

  onStatus?.('Confirm in your wallet…');
  let txHash: string;

  if (protocol === 'jupiter' || chain === 'solana') {
    if (walletProvider !== 'phantom') {
      throw new Error('Solana/Jupiter swaps require Phantom');
    }
    txHash = await signAndSendJupiterSwap(built);
  } else if (protocol === 'stonfi' || chain === 'ton') {
    throw new Error(
      'TON/STON.fi: open Tonkeeper, sign the transfer from simulate payload (TonConnect wiring next).',
    );
  } else {
    // EVM: 1inch, uniswap, pancakeswap, kyber
    if (walletProvider !== 'metamask' && walletProvider !== 'trust' && walletProvider !== 'walletconnect') {
      // Still try injected ethereum
      if (typeof window !== 'undefined' && !(window as unknown as { ethereum?: unknown }).ethereum) {
        throw new Error('EVM swap needs MetaMask, Trust, or WalletConnect');
      }
    }
    const expectedChainId = EVM_CHAIN_IDS[chain];
    txHash = await sendEvmSwapTransaction(built, walletAddress, expectedChainId);
  }

  onStatus?.('Recording on Cryptra…');
  const execRes = await executeSwap(token, {
    quoteId: quote.quoteId,
    txHash,
    // idempotency helps double-taps
  } as { quoteId: string; txHash?: string });

  return {
    quote,
    txHash,
    swapId: execRes.data?.swapId ?? quote.quoteId,
    protocol,
    status: execRes.data?.status ?? 'SUBMITTED',
  };
}
