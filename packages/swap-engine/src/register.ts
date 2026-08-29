import { swapService } from './service';
import { ALL_SWAP_ADAPTERS } from './adapters';

/** Call once at API startup. */
export function registerAllSwapAdapters(): void {
  for (const adapter of ALL_SWAP_ADAPTERS) {
    swapService.registerAdapter(adapter);
  }
}
