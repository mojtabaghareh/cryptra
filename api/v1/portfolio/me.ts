import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless portfolio stub — returns empty portfolio until DB is wired on serverless.
 * Auth: Bearer JWT from /api/v1/auth/telegram
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  return res.status(200).json({
    success: true,
    data: {
      totalValueUsd: 0,
      assets: [],
      openPositions: 0,
      recentSwaps: 0,
      updatedAt: new Date().toISOString(),
      note: 'Connect Neon/Postgres + full API for live balances',
    },
  });
}
