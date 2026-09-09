import { describe, it, expect } from 'vitest';
import {
  registerRequestSchema,
  loginRequestSchema,
  registerResponseSchema,
  loginResponseSchema,
  meResponseSchema,
} from './auth';

describe('auth contracts', () => {
  it('accepts a valid register request', () => {
    expect(
      registerRequestSchema.parse({
        email: 'person@example.test',
        password: 'a-reasonable-password-123',
      }),
    ).toEqual({ email: 'person@example.test', password: 'a-reasonable-password-123' });
  });

  it('rejects a short password', () => {
    expect(() =>
      registerRequestSchema.parse({ email: 'a@b.cd', password: 'short' }),
    ).toThrow();
  });

  it('rejects an overlong email (register)', () => {
    const email = `${'a'.repeat(320)}@example.test`;
    expect(() =>
      registerRequestSchema.parse({ email, password: 'a-reasonable-password-123' }),
    ).toThrow();
  });

  it('rejects an overlong email (login)', () => {
    const email = `${'a'.repeat(320)}@example.test`;
    expect(() =>
      loginRequestSchema.parse({ email, password: 'a-reasonable-password-123' }),
    ).toThrow();
  });

  it('accepts a 320-character email at the boundary', () => {
    const local = 'a'.repeat(320 - '@example.test'.length);
    const email = `${local}@example.test`;
    expect(email.length).toBe(320);
    expect(
      registerRequestSchema.parse({
        email,
        password: 'a-reasonable-password-123',
      }).email,
    ).toBe(email);
  });

  it('accepts a register response', () => {
    expect(registerResponseSchema.parse({ status: 'accepted' })).toEqual({
      status: 'accepted',
    });
  });

  it('accepts a login response with an access token', () => {
    expect(loginResponseSchema.parse({ accessToken: 'x.y.z' })).toEqual({
      accessToken: 'x.y.z',
    });
  });

  it('accepts a me response', () => {
    expect(
      meResponseSchema.parse({
        id: '00000000-0000-4000-8000-000000000000',
        email: 'person@example.test',
      }),
    ).toMatchObject({ email: 'person@example.test' });
  });
});
