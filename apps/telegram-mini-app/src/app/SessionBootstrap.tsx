import { useSessionBootstrap } from '../hooks/useSession';

/** Mount-only component that runs session auth once. */
export function SessionBootstrap() {
  useSessionBootstrap();
  return null;
}
