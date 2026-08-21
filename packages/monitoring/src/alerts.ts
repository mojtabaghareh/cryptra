import { sendAdminAlert } from '@cryptra/notifications';

const recentAlerts = new Map<string, number>();
const ALERT_COOLDOWN_MS = 60_000; // 1 minute per key

/**
 * Send a Telegram alert to admins with basic deduplication.
 */
export async function alert(
  key: string,
  message: string,
  options?: { force?: boolean },
): Promise<void> {
  const now = Date.now();
  const last = recentAlerts.get(key) ?? 0;

  if (!options?.force && now - last < ALERT_COOLDOWN_MS) {
    return;
  }

  recentAlerts.set(key, now);

  try {
    await sendAdminAlert(`<b>${key}</b>\n${message}`);
  } catch (err) {
    console.error('[Monitoring] Failed to send alert:', err);
  }
}

export async function alertError(context: string, error: unknown): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error);
  await alert(`error:${context}`, msg);
}
