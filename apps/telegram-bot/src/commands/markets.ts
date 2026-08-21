import type { Context } from 'grammy';
import { marketDataService } from '@cryptra/market-data';

export async function handleMarkets(ctx: Context) {
  await ctx.reply('⏳ Fetching prices...');

  try {
    const prices = await marketDataService.getMajorPrices();

    const lines = Object.values(prices).map((p) => {
      const change =
        p.change24h != null
          ? ` (${p.change24h >= 0 ? '+' : ''}${p.change24h.toFixed(2)}%)`
          : '';
      return `• <b>${p.id}</b>: $${p.priceUsd.toLocaleString()}${change}`;
    });

    await ctx.reply(`📊 <b>Major Markets</b>\n\n${lines.join('\n')}`, {
      parse_mode: 'HTML',
    });
  } catch (err) {
    await ctx.reply('⚠️ Could not fetch market data right now. Try again later.');
  }
}
