import { describe, it, expect } from 'vitest';
import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('accepts a valid health response', () => {
    const result = healthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it('rejects a non-ok status', () => {
    expect(() =>
      healthResponseSchema.parse({
        status: 'down',
        timestamp: new Date().toISOString(),
      }),
    ).toThrow();
  });
});
