import 'dotenv/config';
import { Bot } from 'grammy';
import { loadConfig } from '@cryptra/config';
import { handleStart } from './commands/start';
import { handleProfile } from './commands/profile';
import { handleReferral } from './commands/referral';
import { handleHelp } from './commands/help';
import { handleMarkets } from './commands/markets';
import { handleLeaderboard } from './commands/leaderboard';

async function main() {
  const config = loadConfig();
  const token = config.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is missing');
    process.exit(1);
  }

  const bot = new Bot(token);

  bot.command('start', handleStart);
  bot.command('profile', handleProfile);
  bot.command('referral', handleReferral);
  bot.command('help', handleHelp);
  bot.command('markets', handleMarkets);
  bot.command('leaderboard', handleLeaderboard);

  bot.hears('🏠 Home', handleStart);
  bot.hears('👤 Profile', handleProfile);
  bot.hears('🔗 Referral', handleReferral);
  bot.hears('📊 Markets', handleMarkets);
  bot.hears('ℹ️ Help', handleHelp);
  bot.hears('🏆 Leaderboard', handleLeaderboard);
  bot.hears('🎁 Rewards', async (ctx) => {
    await ctx.reply('🎁 Rewards are inside the Mini App. Tap Open Cryptra after /start.');
  });

  bot.callbackQuery('home', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleStart(ctx);
  });
  bot.callbackQuery('profile', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProfile(ctx);
  });
  bot.callbackQuery('referral', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleReferral(ctx);
  });
  bot.callbackQuery('leaderboard', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleLeaderboard(ctx);
  });
  bot.callbackQuery('rewards', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('🎁 Open the Mini App to claim rewards.');
  });

  bot.catch((err) => {
    console.error('[Bot] Error:', err.error);
  });

  await bot.api.setMyCommands([
    { command: 'start', description: 'Open Cryptra' },
    { command: 'profile', description: 'Your XP & level' },
    { command: 'referral', description: 'Invite friends' },
    { command: 'markets', description: 'Major crypto prices' },
    { command: 'leaderboard', description: 'XP rankings' },
    { command: 'help', description: 'Help & about' },
  ]);

  // Auto-configure menu button when HTTPS mini app URL is set
  const miniUrl = config.TELEGRAM_MINI_APP_URL;
  if (miniUrl && miniUrl.startsWith('https://')) {
    try {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Open Cryptra',
          web_app: { url: miniUrl },
        },
      });
      console.log('📌 Menu button →', miniUrl);
    } catch (e) {
      console.warn('Could not set menu button:', e);
    }
  } else {
    console.warn(
      '⚠️ TELEGRAM_MINI_APP_URL missing or not https — Mini App button will not open inside Telegram',
    );
  }

  console.log('🤖 Cryptrabot starting...');
  await bot.start({
    onStart: (info) => {
      console.log(`✅ @${info.username} is running`);
    },
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
