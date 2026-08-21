import { InlineKeyboard, Keyboard } from 'grammy';

export function mainReplyKeyboard() {
  return new Keyboard()
    .text('🏠 Home')
    .text('👤 Profile')
    .row()
    .text('🔗 Referral')
    .text('📊 Markets')
    .row()
    .text('🎁 Rewards')
    .text('ℹ️ Help')
    .resized()
    .persistent();
}

export function openAppKeyboard(miniAppUrl?: string) {
  const kb = new InlineKeyboard();
  if (miniAppUrl) {
    kb.webApp('🚀 Open Cryptra', miniAppUrl);
  }
  kb.row().text('👤 Profile', 'profile').text('🔗 Referral', 'referral');
  return kb;
}

export function profileKeyboard() {
  return new InlineKeyboard()
    .text('🔗 My Referral', 'referral')
    .text('🎁 Rewards', 'rewards')
    .row()
    .text('« Back', 'home');
}
