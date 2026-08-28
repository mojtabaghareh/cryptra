/**
 * Fail fast in production if secrets are missing or look like placeholders.
 */
const WEAK = [
  'your-super-secret-jwt-key-at-least-32-chars',
  'your_telegram_bot_token',
  'change-me',
  'secret',
  'your-admin-api-key',
];

export function assertProductionSecurity(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const errors: string[] = [];

  const jwt = process.env.JWT_SECRET ?? '';
  if (jwt.length < 32) errors.push('JWT_SECRET must be >= 32 chars');
  if (WEAK.some((w) => jwt === w || jwt.includes('your-super-secret'))) {
    errors.push('JWT_SECRET is a placeholder');
  }

  const bot = process.env.TELEGRAM_BOT_TOKEN ?? '';
  if (!bot || bot.includes('your_telegram')) {
    errors.push('TELEGRAM_BOT_TOKEN missing or placeholder');
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL required');
  }

  if (!process.env.REDIS_URL) {
    errors.push('REDIS_URL recommended for rate-limit/idempotency (set redis://redis:6379 in compose)');
  }

  if (errors.length > 0) {
    console.error('[security] Production boot refused:\n - ' + errors.join('\n - '));
    process.exit(1);
  }
}
