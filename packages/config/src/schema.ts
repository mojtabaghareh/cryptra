import { z } from 'zod';

export const envSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NEO4J_URI: z.string().optional(),
  NEO4J_USER: z.string().optional(),
  NEO4J_PASSWORD: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  TELEGRAM_MINI_APP_URL: z.string().url().optional(),
  ADMIN_TELEGRAM_CHAT_ID: z.string().optional(),

  // Fees
  BASE_FEE_PERCENT: z.coerce.number().default(0.088),
  MIN_FEE_PERCENT: z.coerce.number().default(0.033),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ENABLE_METRICS: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),
  METRICS_PORT: z.coerce.number().default(9090),

  // External APIs
  HYPERLIQUID_API_URL: z.string().url().default('https://api.hyperliquid.xyz'),
  HYPERLIQUID_WS_URL: z.string().default('wss://api.hyperliquid.xyz/ws'),
  ONEINCH_API_KEY: z.string().optional(),
  JUPITER_API_URL: z.string().url().default('https://quote-api.jup.ag/v6'),
  COINGECKO_API_KEY: z.string().optional(),
  BIRDEYE_API_KEY: z.string().optional(),

  // Wallet / RPC
  WALLETCONNECT_PROJECT_ID: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  HELIUS_API_KEY: z.string().optional(),
  SOLANA_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),
  TON_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
