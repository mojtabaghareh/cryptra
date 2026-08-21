import { config as loadDotenv } from 'dotenv';
import { envSchema, type Env } from './schema';

let cached: Env | null = null;

/**
 * Load and validate environment variables.
 * Throws a clear error if any required variable is missing or invalid.
 */
export function loadConfig(options?: { path?: string; override?: boolean }): Env {
  if (cached && !options?.override) {
    return cached;
  }

  loadDotenv({ path: options?.path });

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  cached = parsed.data;
  return cached;
}

/**
 * Get the already loaded config (must call loadConfig first).
 */
export function getConfig(): Env {
  if (!cached) {
    return loadConfig();
  }
  return cached;
}

export type { Env };
export { envSchema };
