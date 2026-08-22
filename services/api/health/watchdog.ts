import { runHealthChecks, alert } from '@cryptra/monitoring';

const INTERVAL_MS = Number(process.env.HEALTH_WATCHDOG_INTERVAL_MS ?? 60_000);
let timer: ReturnType<typeof setInterval> | null = null;
let lastStatus: string | null = null;

/**
 * Periodically run health checks and Telegram-alert admins on transition to unhealthy.
 */
export function startHealthWatchdog(): void {
  if (timer) return;
  if (process.env.HEALTH_WATCHDOG_DISABLED === '1') return;

  const tick = async () => {
    try {
      const report = await runHealthChecks();
      if (report.status === 'unhealthy' && lastStatus !== 'unhealthy') {
        const down = report.checks
          .filter((c) => c.status === 'down')
          .map((c) => `${c.name}: ${c.message ?? 'down'}`)
          .join('\n');
        await alert(
          'health:unhealthy',
          `Cryptra API is <b>unhealthy</b>\n${down}\nuptime=${Math.round(report.uptime)}s`,
          { force: true },
        );
      } else if (report.status === 'healthy' && lastStatus === 'unhealthy') {
        await alert('health:recovered', 'Cryptra API recovered to <b>healthy</b>', {
          force: true,
        });
      }
      lastStatus = report.status;
    } catch (err) {
      console.error('[watchdog] health tick failed', err);
    }
  };

  void tick();
  timer = setInterval(() => void tick(), INTERVAL_MS);
  // unref so it doesn't keep process alive unnecessarily in tests
  if (typeof timer === 'object' && 'unref' in timer) {
    (timer as NodeJS.Timeout).unref();
  }
}

export function stopHealthWatchdog(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
