import { perpService } from './service';
import { ALL_PERP_ADAPTERS } from './adapters';

/** Call once at API startup. */
export function registerAllPerpAdapters(): void {
  for (const adapter of ALL_PERP_ADAPTERS) {
    if (typeof (perpService as { registerAdapter?: (a: unknown) => void }).registerAdapter === 'function') {
      (perpService as { registerAdapter: (a: unknown) => void }).registerAdapter(adapter);
    }
  }
}

export { ALL_PERP_ADAPTERS };
