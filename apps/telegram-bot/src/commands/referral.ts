import type { Context } from 'grammy';
import { ensureUser } from '../services/user-sync';
import { referralService } from '@cryptra/referral';
import { InlineKeyboard } from 'grammy';

export async function handleReferral(ctx: Context) {
  if (!ctx.from) return;

  const user = await ensureUser(ctx.from);
  const stats = await referralService.getStats(user.id);

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'Cryptrabot';
  const link = `https://t.me/${botUsername.replace(/^@/, '')}?start=${user.referralCode}`;

  const kb = new InlineKeyboard()
    .url('📤 Share link', `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join Cryptra — understand how you decide.')}`)
    .row()
    .text('« Back', 'home');

  await ctx.reply(
    `🔗 <b>Referral Program</b>\n\n` +
      `Your code: <code>${user.referralCode}</code>\n` +
      `Your link:\n${link}\n\n` +
      `📊 Stats\n` +
      `• Total: ${stats.total}\n` +
      `• Active: ${stats.active}\n` +
      `• Pending: ${stats.pending}\n\n` +
      `Invite friends. When they trade, you earn XP.`,
    {
      parse_mode: 'HTML',
      reply_markup: kb,
    },
  );
}
