/** Swap / DEX aggregation protocols integrated in packages/swap-engine. */
export const SWAP_PROTOCOLS = {
  oneInch: '1inch',
  jupiter: 'jupiter',
  uniswap: 'uniswap',
  pancakeswap: 'pancakeswap',
  curve: 'curve',
  stonfi: 'ston.fi',
} as const;

export type SwapProtocolId = (typeof SWAP_PROTOCOLS)[keyof typeof SWAP_PROTOCOLS];

/** Perpetual venues integrated in packages/perp-engine. Hyperliquid is first-class from day one. */
export const PERP_VENUES = {
  hyperliquid: 'hyperliquid',
  dydx: 'dydx',
  gmx: 'gmx',
  drift: 'drift',
} as const;

export type PerpVenueId = (typeof PERP_VENUES)[keyof typeof PERP_VENUES];

export const PRIMARY_PERP_VENUE: PerpVenueId = PERP_VENUES.hyperliquid;

