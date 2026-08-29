export { HyperliquidAdapter, hyperliquidAdapter } from './hyperliquid';
export { DydxAdapter, dydxAdapter } from './dydx';
export { GmxAdapter, gmxAdapter } from './gmx';
export { DriftAdapter, driftAdapter } from './drift';

import { hyperliquidAdapter } from './hyperliquid';
import { dydxAdapter } from './dydx';
import { gmxAdapter } from './gmx';
import { driftAdapter } from './drift';
import type { IPerpAdapter } from '../types';

export const ALL_PERP_ADAPTERS: IPerpAdapter[] = [
  hyperliquidAdapter,
  dydxAdapter,
  gmxAdapter,
  driftAdapter,
];
