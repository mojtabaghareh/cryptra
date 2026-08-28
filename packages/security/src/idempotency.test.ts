import { describe, it, expect } from 'vitest';
import {
  claimIdempotencyKey,
  completeIdempotencyKey,
  releaseIdempotencyKey,
} from './idempotency';

describe('idempotency without Redis', () => {
  it('returns unavailable when REDIS_URL is missing', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    const claim = await claimIdempotencyKey('test', 'key-1');
    expect(claim.status).toBe('unavailable');
    if (prev) process.env.REDIS_URL = prev;
  });

  it('complete/release no-op without redis', async () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    await expect(completeIdempotencyKey('test', 'k', '{}')).resolves.toBeUndefined();
    await expect(releaseIdempotencyKey('test', 'k')).resolves.toBeUndefined();
    if (prev) process.env.REDIS_URL = prev;
  });
});
