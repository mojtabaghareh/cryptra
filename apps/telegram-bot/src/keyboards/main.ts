import { InlineKeyboard, Keyboard } from 'grammy';

export function mainReplyKeyboard() {
  return new Keyboard()
    .text('🏠 Home')
    .text('👤 Profile')
    .row()
    .text('🔗 Referral')
    .text('📊 Markets')
    .row()
    .text('🏆 Leaderboard')
    .text('🎁 Rewards')
    .row()
    .text('ℹ️ Help')
    .resized()
    .persistent();
}

export function openAppKeyboard(miniAppUrl?: string) {
  const kb = new InlineKeyboard();
  if (miniAppUrl) {
    kb.webApp('🚀 Open Cryptra', miniAppUrl);
  } else {
    kb.text('⚠️ Set TELEGRAM_MINI_APP_URL', 'home');
  }
  kb.row().text('👤 Profile', 'profile').text('🔗 Referral', 'referral');
  kb.row().text('🏆 Leaderboard', 'leaderboard');
  return kb;
}

export function profileKeyboard() {
  return new InlineKeyboard()
    .text('🔗 My Referral', 'referral')
    .text('🎁 Rewards', 'rewards')
    .row()
    .text('« Back', 'home');
}
