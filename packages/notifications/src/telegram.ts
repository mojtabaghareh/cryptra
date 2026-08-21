import { getConfig } from '@cryptra/config';

/**
 * Send a message via Telegram Bot API.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: { parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2' },
): Promise<{ ok: boolean; messageId?: number }> {
  const config = getConfig();
  const token = config.TELEGRAM_BOT_TOKEN;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode ?? 'HTML',
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = (await res.json()) as {
    ok: boolean;
    result?: { message_id: number };
    description?: string;
  };

  if (!data.ok) {
    throw new Error(`Telegram sendMessage failed: ${data.description ?? res.status}`);
  }

  return { ok: true, messageId: data.result?.message_id };
}

/**
 * Send an alert to the admin chat (for monitoring).
 */
export async function sendAdminAlert(text: string): Promise<void> {
  const config = getConfig();
  const chatId = config.ADMIN_TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn('[Notifications] ADMIN_TELEGRAM_CHAT_ID not set, skipping alert');
    return;
  }
  await sendTelegramMessage(chatId, `🚨 <b>Cryptra Alert</b>\n\n${text}`);
}
