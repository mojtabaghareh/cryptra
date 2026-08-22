/**
 * Lightweight TON helpers for Mini App.
 * Full TonConnect UI can be added later; this covers inject + manual address.
 */

export interface TonInjected {
  send?: (method: string, params?: unknown) => Promise<unknown>;
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
}

export function getTonInjected(): TonInjected | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    ton?: TonInjected;
    tonkeeper?: { ton?: TonInjected };
  };
  return w.ton ?? w.tonkeeper?.ton ?? null;
}

export function isTonAvailable(): boolean {
  return Boolean(getTonInjected());
}

/** Very loose TON address check (UQ/EQ/0:… forms). */
export function isLikelyTonAddress(addr: string): boolean {
  const a = addr.trim();
  if (a.length < 20) return false;
  if (/^(EQ|UQ)[A-Za-z0-9_-]{46}$/.test(a)) return true;
  if (/^0:[a-fA-F0-9]{64}$/.test(a)) return true;
  return a.length >= 48;
}

export function buildTonLinkMessage(address: string): string {
  const ts = Math.floor(Date.now() / 1000);
  return [
    'Cryptra — link TON wallet',
    `Address: ${address}`,
    `Timestamp: ${ts}`,
    'Only sign this on official Cryptra Mini App.',
  ].join('\n');
}

/**
 * Try to read address from injected provider; otherwise caller supplies address.
 */
export async function tryConnectTonInjected(): Promise<string | null> {
  const ton = getTonInjected();
  if (!ton) return null;
  try {
    // Best-effort across wallets — not standardized
    if (ton.request) {
      const accounts = (await ton.request({ method: 'ton_requestAccounts' })) as string[];
      if (accounts?.[0]) return accounts[0];
    }
    if (ton.send) {
      const accounts = (await ton.send('ton_requestAccounts')) as string[];
      if (accounts?.[0]) return accounts[0];
    }
  } catch {
    // ignore
  }
  return null;
}
