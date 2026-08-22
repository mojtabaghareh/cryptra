import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless market prices — CoinGecko proxy (no API key required for basic tier).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const ids =
      (req.query.ids as string) ||
      'bitcoin,ethereum,solana,toncoin,binancecoin,ripple';

    const url =
      `https://api.coingecko.com/api/v3/simple/price` +
      `?ids=${encodeURIComponent(ids)}` +
      `&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: 'Upstream market data failed',
      });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
