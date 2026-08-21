import type { Context } from 'grammy';
import { ensureUser } from '../services/user-sync';
import { mainReplyKeyboard, openAppKeyboard } from '../keyboards/main';
import { getConfig } from '@cryptra/config';
import { referralService } from '@cryptra/referral';

export async function handleStart(ctx: Context) {
  if (!ctx.from) return;

  const user = await ensureUser(ctx.from);

  // Deep-link referral: /start REFCODE
  const payload = ctx.match;
  if (typeof payload === 'string' && payload.length >= 4 && !user.referredById) {
    try {
      await referralService.applyCode(user.id, payload);
      await ctx.reply(`✅ Referral code <b>${payload.toUpperCase()}</b> applied!`, {
        parse_mode: 'HTML',
      });
    } catch {
      // ignore invalid codes on start
    }
  }

  let miniAppUrl: string | undefined;
  try {
    miniAppUrl = getConfig().TELEGRAM_MINI_APP_URL;
  } catch {
    miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;
  }

  const name = user.firstName || user.username || 'Trader';

  await ctx.reply(
    `👋 Welcome to <b>Cryptra</b>, ${name}!\n\n` +
      `We don’t help you trade.\n` +
      `We help you understand <i>how you decide</i>.\n\n` +
      `🎯 Level <b>${user.level}</b> · XP <b>${user.xp}</b>\n` +
      `🔗 Your code: <code>${user.referralCode}</code>\n\n` +
      `Open the Mini App to connect wallet, swap & trade.`,
    {
      parse_mode: 'HTML',
      reply_markup: openAppKeyboard(miniAppUrl),
    },
  );

  await ctx.reply('Use the menu below anytime:', {
    reply_markup: mainReplyKeyboard(),
  });
}
