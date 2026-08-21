import type { Context } from 'grammy';

export async function handleHelp(ctx: Context) {
  await ctx.reply(
    `ℹ️ <b>Cryptra Help</b>\n\n` +
      `<b>Commands</b>\n` +
      `/start — Open the bot & Mini App\n` +
      `/profile — Your XP, level, fee tier\n` +
      `/referral — Your invite link & stats\n` +
      `/markets — Major crypto prices\n` +
      `/help — This message\n\n` +
      `<b>What is Cryptra?</b>\n` +
      `A Financial Intelligence Layer.\n` +
      `We help you understand how you decide — not just how you trade.\n\n` +
      `Open the Mini App from /start to connect wallet, swap and trade.`,
    { parse_mode: 'HTML' },
  );
}
