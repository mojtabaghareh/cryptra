import type { Context } from 'grammy';
import { leaderboardService } from '@cryptra/leaderboard';

export async function handleLeaderboard(ctx: Context) {
  await ctx.reply('⏳ Loading leaderboard...');

  try {
    const top = await leaderboardService.byXp(10);

    if (top.length === 0) {
      await ctx.reply('No rankings yet. Be the first to earn XP!');
      return;
    }

    const lines = top.map((e) => {
      const name = e.username ? `@${e.username}` : e.firstName || e.userId.slice(0, 8);
      const medal =
        e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `${e.rank}.`;
      return `${medal} <b>${name}</b> — ${e.value} XP · L${e.level ?? 1}`;
    });

    await ctx.reply(`🏆 <b>XP Leaderboard</b>\n\n${lines.join('\n')}`, {
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('[bot] leaderboard error', err);
    await ctx.reply('⚠️ Could not load leaderboard right now.');
  }
}
