import { describe, it, expect, vi, afterEach } from 'vitest';
import { IpRateLimiter, IP_RATE_LIMITER_MAX_KEYS } from './ip-rate-limiter.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('IpRateLimiter memory bound', () => {
  it('documents the default distinct-key cap', () => {
    expect(IP_RATE_LIMITER_MAX_KEYS).toBe(10000);
  });

  it('expires stale keys instead of growing unboundedly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const limiter = new IpRateLimiter(10);

    expect(limiter.allow('a', 1, 1000)).toBe(true);
    expect(limiter.keyCount()).toBe(1);

    vi.setSystemTime(2000);
    expect(limiter.allow('b', 1, 1000)).toBe(true);
    expect(limiter.keyCount()).toBe(1);
  });

  it('rejects new keys at the cap without allocating, while evaluating existing keys', () => {
    const limiter = new IpRateLimiter(2);

    expect(limiter.allow('a', 2, 1000)).toBe(true);
    expect(limiter.allow('a', 2, 1000)).toBe(true);
    expect(limiter.allow('b', 1, 1000)).toBe(true);

    expect(limiter.allow('c', 1, 1000)).toBe(false);
    expect(limiter.keyCount()).toBe(2);

    // An existing key is still evaluated (max reached), not rejected as new.
    expect(limiter.allow('a', 2, 1000)).toBe(false);
  });
});
