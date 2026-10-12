import { describe, it, expect } from 'vitest';
import {
  assertPasswordAcceptable,
  generatePassword,
  isValidEmail,
  parseProvisionArgs,
} from './provision-owner.logic.js';

describe('provision-owner argument parsing (T-023)', () => {
  it('parses the owner-provision flags', () => {
    expect(
      parseProvisionArgs([
        '--email',
        'Owner@Example.org',
        '--password-stdin',
        '--apply',
      ]),
    ).toEqual({
      email: 'Owner@Example.org',
      passwordStdin: true,
      grantReview: false,
      apply: true,
      help: false,
    });
  });

  it('parses the grant-review mode', () => {
    const args = parseProvisionArgs(['--email', 'a@b.co', '--grant-review', '--apply']);
    expect(args.grantReview).toBe(true);
    expect(args.apply).toBe(true);
    expect(args.passwordStdin).toBe(false);
  });

  it('rejects unknown arguments', () => {
    expect(() => parseProvisionArgs(['--nope'])).toThrow(/Unknown argument/);
  });
});

describe('provision-owner validation (T-023)', () => {
  it('validates mailboxes', () => {
    expect(isValidEmail('owner@example.org')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('generates a strong, URL-safe password of 12-128 characters', () => {
    const password = generatePassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
    expect(password.length).toBeLessThanOrEqual(128);
    expect(password).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(generatePassword()).not.toBe(password);
  });

  it('rejects short or over-long passwords', () => {
    expect(() => assertPasswordAcceptable('short')).toThrow(/12-128/);
    expect(() => assertPasswordAcceptable('x'.repeat(129))).toThrow(/12-128/);
    expect(() => assertPasswordAcceptable('x'.repeat(12))).not.toThrow();
  });
});
