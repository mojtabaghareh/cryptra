export { JupiterAdapter, jupiterAdapter } from './jupiter';
export { OneInchAdapter, oneInchAdapter } from './oneinch';
export { UniswapAdapter, uniswapAdapter } from './uniswap';
export { PancakeSwapAdapter, pancakeSwapAdapter } from './pancakeswap';
export { KyberAdapter, kyberAdapter } from './kyber';
export { StonfiAdapter, stonfiAdapter } from './stonfi';

import { jupiterAdapter } from './jupiter';
import { oneInchAdapter } from './oneinch';
import { uniswapAdapter } from './uniswap';
import { pancakeSwapAdapter } from './pancakeswap';
import { kyberAdapter } from './kyber';
import { stonfiAdapter } from './stonfi';
import type { ISwapAdapter } from '../types';

/** All production swap adapters (register on API boot). */
export const ALL_SWAP_ADAPTERS: ISwapAdapter[] = [
  jupiterAdapter,
  oneInchAdapter,
  uniswapAdapter,
  pancakeSwapAdapter,
  kyberAdapter,
  stonfiAdapter,
];
