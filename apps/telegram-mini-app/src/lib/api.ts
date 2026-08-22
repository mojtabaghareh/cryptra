/**
 * API client for serverless + future full backend.
 * Uses same-origin /api on Vercel, or VITE_API_URL override.
 */

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
    throw new Error((body as { error?: string }).error || res.statusText);
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
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function authWithTelegram(initData: string) {
  return apiPost<{
    success: boolean;
    data: {
      token: string;
      user: {
        telegramId: number;
        firstName: string | null;
        username: string | null;
      };
    };
  }>('/api/v1/auth/telegram', { initData });
}

export async function fetchMarketPrices() {
  return apiGet<{ success: boolean; data: Record<string, { usd: number; usd_24h_change?: number }> }>(
    '/api/v1/market/prices',
  );
}
