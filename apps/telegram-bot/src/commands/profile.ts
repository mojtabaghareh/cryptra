import type { Context } from 'grammy';
import { ensureUser } from '../services/user-sync';
import { levelService } from '@cryptra/levels';
import { profileKeyboard } from '../keyboards/main';
import { referralService } from '@cryptra/referral';

export async function handleProfile(ctx: Context) {
  if (!ctx.from) return;

  const user = await ensureUser(ctx.from);
  const progress = levelService.getProgress(user.xp, user.level);
  const refStats = await referralService.getStats(user.id);

  const barFilled = Math.round(progress.progressPercent / 10);
  const bar = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled);

  await ctx.reply(
    `👤 <b>Your Profile</b>\n\n` +
      `Name: ${user.firstName ?? '—'} ${user.lastName ?? ''}\n` +
      `Username: @${user.username ?? '—'}\n\n` +
      `🎯 Level: <b>${user.level}</b>\n` +
      `⭐ XP: <b>${user.xp}</b>\n` +
      `📊 Progress: [${bar}] ${progress.progressPercent}%\n` +
      `   Next level at ${progress.nextLevelXp} XP\n\n` +
      `💰 Fee tier: ${user.feeTier}\n` +
      `🔗 Referral code: <code>${user.referralCode}</code>\n` +
      `👥 Referrals: ${refStats.active} active / ${refStats.total} total`,
    {
      parse_mode: 'HTML',
      reply_markup: profileKeyboard(),
    },
  );
}
