import { useCallback, useState } from 'react';
import type { Token, SwapQuote } from '../types';
import { useWallet } from './useWallet';

interface UseSwapReturn {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  quote: SwapQuote | null;
  isQuoting: boolean;
  isSwapping: boolean;
  error: string | null;
  tokens: Token[];
  isLoadingTokens: boolean;
  setFromToken: (token: Token | null) => void;
  setToToken: (token: Token | null) => void;
  setFromAmount: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  switchTokens: () => void;
  fetchQuote: () => Promise<void>;
  executeSwap: () => Promise<void>;
  fetchTokens: () => Promise<void>;
}

export function useSwap(): UseSwapReturn {
  const { address, isConnected } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async (): Promise<void> => {
    setIsLoadingTokens(true);
    try {
      const res = await fetch('/api/v1/tokens?chainId=1');
      if (!res.ok) throw new Error('Failed to fetch tokens');
      const data: Token[] = await res.json();
      setTokens(data);
      if (data.length >= 2) {
        setFromToken(data[0]);
        setToToken(data[1]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setIsLoadingTokens(false);
    }
  }, []);

  const fetchQuote = useCallback(async (): Promise<void> => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0 || !isConnected) {
      setQuote(null);
      return;
    }
    setIsQuoting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: fromToken.id,
          toToken: toToken.id,
          fromAmount: parseFloat(fromAmount),
          slippage,
          address,
        }),
      });
      if (!res.ok) throw new Error('Quote failed');
      const data: SwapQuote = await res.json();
      setQuote(data);
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : 'Quote failed');
    } finally {
      setIsQuoting(false);
    }
  }, [fromToken, toToken, fromAmount, slippage, address, isConnected]);

  const executeSwap = useCallback(async (): Promise<void> => {
    if (!quote || !fromToken || !toToken || !isConnected) {
      throw new Error('Invalid swap state');
    }
    setIsSwapping(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: fromToken.id,
          toToken: toToken.id,
          fromAmount: parseFloat(fromAmount),
          slippage,
          address,
        }),
      });
      if (!res.ok) throw new Error('Swap execution failed');
      setFromAmount('');
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, [quote, fromToken, toToken, fromAmount, slippage, address, isConnected]);

  const switchTokens = useCallback((): void => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setQuote(null);
  }, [fromToken, toToken]);

  const toAmount = quote ? String(quote.toAmount) : '';

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    quote,
    isQuoting,
    isSwapping,
    error,
    tokens,
    isLoadingTokens,
    setFromToken,
    setToToken,
    setFromAmount,
    setSlippage,
    switchTokens,
    fetchQuote,
    executeSwap,
    fetchTokens,
  };
}

