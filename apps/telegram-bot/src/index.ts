import 'dotenv/config';
import { Bot, session } from 'grammy';
import { loadConfig } from '@cryptra/config';
import { handleStart } from './commands/start';
import { handleProfile } from './commands/profile';
import { handleReferral } from './commands/referral';
import { handleHelp } from './commands/help';
import { handleMarkets } from './commands/markets';
import { openAppKeyboard, mainReplyKeyboard } from './keyboards/main';

async function main() {
  const config = loadConfig();
  const token = config.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is missing');
    process.exit(1);
  }

  const bot = new Bot(token);

  // Commands
  bot.command('start', handleStart);
  bot.command('profile', handleProfile);
  bot.command('referral', handleReferral);
  bot.command('help', handleHelp);
  bot.command('markets', handleMarkets);

  // Reply keyboard text handlers
  bot.hears('🏠 Home', handleStart);
  bot.hears('👤 Profile', handleProfile);
  bot.hears('🔗 Referral', handleReferral);
  bot.hears('📊 Markets', handleMarkets);
  bot.hears('ℹ️ Help', handleHelp);
  bot.hears('🎁 Rewards', async (ctx) => {
    await ctx.reply('🎁 Rewards are available inside the Mini App. Use /start to open it.');
  });

  // Inline callback queries
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
  bot.callbackQuery('rewards', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('🎁 Open the Mini App to claim rewards.');
  });

  bot.catch((err) => {
    console.error('[Bot] Error:', err.error);
  });

  // Set bot commands menu
  await bot.api.setMyCommands([
    { command: 'start', description: 'Open Cryptra' },
    { command: 'profile', description: 'Your XP & level' },
    { command: 'referral', description: 'Invite friends' },
    { command: 'markets', description: 'Major crypto prices' },
    { command: 'help', description: 'Help & about' },
  ]);

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
