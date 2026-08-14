import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppError, ErrorCodes } from '@cryptra/core';

export interface RateLimitOptions {
  /** Requests allowed per window. Default per Master Specification §25: 10/minute per user. */
  max?: number;
  timeWindowMs?: number;
}

const DEFAULT_MAX_REQUESTS_PER_MINUTE = 10;
const DEFAULT_TIME_WINDOW_MS = 60_000;

function resolveRateLimitKey(request: FastifyRequest): string {
  return request.user?.userId ?? `ip:${request.ip}`;
}

/**
 * Registers the global Cryptra rate limiter. Default: 10 requests/minute
 * per authenticated user, falling back to per-IP limiting for unauthenticated
 * requests.
 */
export const registerRateLimit = fp(async function registerRateLimitPlugin(
  app: FastifyInstance,
  options: RateLimitOptions = {},
) {
  await app.register(rateLimit, {
    max: options.max ?? DEFAULT_MAX_REQUESTS_PER_MINUTE,
    timeWindow: options.timeWindowMs ?? DEFAULT_TIME_WINDOW_MS,
    keyGenerator: resolveRateLimitKey,
    errorResponseBuilder: (_request, context) => {
      const error = new AppError({
        code: ErrorCodes.RATE_LIMITED,
        message: `Rate limit exceeded: max ${context.max} requests per ${Math.round(
          Number(context.after.replace('ms', '')) / 1000 || 60,
        )}s.`,
        statusCode: 429,
        details: { max: context.max },
      });
      return error.toJSON();
    },
  });
});

