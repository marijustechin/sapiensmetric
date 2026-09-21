import { Injectable } from '@nestjs/common';

/** Documented small bound on distinct in-memory limiter keys. */
export const IP_RATE_LIMITER_MAX_KEYS = 10000;

/**
 * Small in-memory per-IP limiter. Defense-in-depth for the single-process
 * bootstrap phase only: it is not a distributed production rate limiter and
 * introduces no Redis or new data store. Every limited request still returns
 * the same generic response.
 *
 * Memory is bounded: stale entries expire on access, and the number of
 * distinct keys is capped at `maxKeys`. When the cap is reached, new keys are
 * rejected without being allocated, while existing keys continue to be
 * evaluated.
 */
@Injectable()
export class IpRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxKeys: number = IP_RATE_LIMITER_MAX_KEYS,
  ) {}

  private evictStale(now: number, windowMs: number): void {
    for (const [key, timestamps] of this.hits) {
      const recent = timestamps.filter((at) => now - at < windowMs);
      if (recent.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, recent);
      }
    }
  }

  allow(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    this.evictStale(now, windowMs);

    const existing = this.hits.get(key);
    if (!existing) {
      if (this.hits.size >= this.maxKeys) {
        // Reject a new key without allocating it.
        return false;
      }
      this.hits.set(key, [now]);
      return true;
    }

    const recent = existing.filter((at) => now - at < windowMs);
    if (recent.length >= max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  /** Number of distinct tracked keys (used to verify the memory bound). */
  keyCount(): number {
    return this.hits.size;
  }
}
