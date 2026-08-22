const BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  '';

export async function apiGet<T = unknown>(
  path: string,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string; error?: string }).message ||
        (body as { error?: string }).error ||
        res.statusText,
    );
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string; error?: string }).message ||
        (data as { error?: string }).error ||
        res.statusText,
    );
  }
  return res.json() as Promise<T>;
}

export async function authWithTelegram(initData: string) {
  return apiPost<{
    success: boolean;
    data: {
      token: string;
      isNewUser: boolean;
      user: {
        id: string;
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        languageCode: string | null;
        xp: number;
        level: number;
        feeTier: number;
        referralCode: string;
      };
    };
  }>('/api/v1/auth/telegram', { initData });
}

export async function fetchXpMe(token: string) {
  return apiGet<{
    success: boolean;
    data: {
      xp: number;
      level: number;
      feeTier: number;
      progress: {
        currentLevelXp: number;
        nextLevelXp: number;
        progressPercent: number;
      };
    };
  }>('/api/v1/xp/me', token);
}

export async function fetchMarketPrices() {
  return apiGet<{
    success: boolean;
    data: Record<string, { usd: number; usd_24h_change?: number }>;
  }>('/api/v1/market/prices');
}

export async function fetchPortfolioMe(token: string) {
  return apiGet<{ success: boolean; data: unknown }>('/api/v1/portfolio/me', token);
}

export interface SwapQuoteResult {
  quoteId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain: string;
  toChain: string;
  protocol: string;
  feePercent: number;
  feeAmount: string;
  priceImpactBps?: number;
  estimatedGas?: string;
  expiresAt: string;
}

export async function requestSwapQuote(
  token: string,
  body: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromChain: string;
    toChain: string;
    slippageBps?: number;
  },
) {
  return apiPost<{ success: boolean; data: SwapQuoteResult }>(
    '/api/v1/swaps/quote',
    body,
    token,
  );
}

export async function executeSwap(
  token: string,
  body: { quoteId: string; txHash?: string },
) {
  return apiPost<{ success: boolean; data: { swapId: string; status: string; txHash?: string } }>(
    '/api/v1/swaps/execute',
    body,
    token,
  );
}

export async function placeOrder(
  token: string,
  body: {
    protocol?: string;
    symbol: string;
    side: 'LONG' | 'SHORT';
    type?: 'MARKET' | 'LIMIT';
    size: string;
    price?: string;
    leverage?: number;
  },
) {
  return apiPost<{ success: boolean; data: unknown }>('/api/v1/orders', body, token);
}
