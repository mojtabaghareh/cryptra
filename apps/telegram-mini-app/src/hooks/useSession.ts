import { useEffect } from 'react';
import { useTelegram } from '../telegram/telegram';
import { useSessionStore } from '../store/sessionStore';
import { authWithTelegram, fetchXpMe } from '../lib/api';

/**
 * Bootstrap session: read Telegram initData → POST /auth/telegram → store JWT.
 * Safe to call once at app root.
 */
export function useSessionBootstrap() {
  const { webApp, isReady } = useTelegram();
  const setSession = useSessionStore((s) => s.setSession);
  const setLoading = useSessionStore((s) => s.setLoading);
  const setError = useSessionStore((s) => s.setError);
  const setReady = useSessionStore((s) => s.setReady);
  const existingToken = useSessionStore((s) => s.token);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function run() {
      setLoading(true);

      const initData = webApp?.initData;

      // Outside Telegram: mark ready without auth
      if (!initData) {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await authWithTelegram(initData);
        if (cancelled) return;

        if (res.success && res.data.token) {
          setSession(res.data.token, res.data.user);

          // Refresh XP in background
          try {
            const xp = await fetchXpMe(res.data.token);
            if (xp.success && !cancelled) {
              setSession(res.data.token, {
                ...res.data.user,
                xp: xp.data.xp,
                level: xp.data.level,
                feeTier: xp.data.feeTier,
              });
            }
          } catch {
            // non-blocking
          }
        } else {
          setError('Auth failed');
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          // Keep cached token if network fails
          if (existingToken) {
            setReady(true);
            setLoading(false);
          } else {
            setError(err instanceof Error ? err.message : 'Auth error');
            setReady(true);
          }
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, webApp]);
}
