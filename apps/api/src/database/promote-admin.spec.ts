import { describe, it, expect } from 'vitest';
import {
  decidePromotion,
  parseArgs,
  type PromoteTarget,
} from './promote-admin.logic.js';

function target(overrides: Partial<PromoteTarget> = {}): PromoteTarget {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'person@example.test',
    role: 'user',
    status: 'active',
    emailVerifiedAt: new Date(),
    ...overrides,
  };
}

describe('admin:promote argument parsing', () => {
  it('requires exactly one explicit target', () => {
    expect(parseArgs(['--email', 'a@example.test']).email).toBe('a@example.test');
    expect(parseArgs(['--id', 'x']).id).toBe('x');
    expect(parseArgs(['--email', 'a@example.test', '--apply']).apply).toBe(true);
    expect(parseArgs(['--help']).help).toBe(true);
  });

  it('ignores the pnpm/tsx script-argument separator', () => {
    expect(parseArgs(['--', '--email', 'a@example.test']).email).toBe(
      'a@example.test',
    );
  });

  it('rejects unknown arguments', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown argument/);
  });
});

describe('admin:promote decision', () => {
  it('fails clearly for an unverified account', () => {
    expect(() => decidePromotion(target({ emailVerifiedAt: null }), true)).toThrow(
      /not email-verified/,
    );
  });

  it('fails clearly for a suspended account', () => {
    expect(() =>
      decidePromotion(target({ status: 'suspended' }), true),
    ).toThrow(/suspended/);
  });

  it('is a safe no-op for an existing administrator', () => {
    expect(decidePromotion(target({ role: 'admin' }), false).kind).toBe(
      'already-admin',
    );
    expect(decidePromotion(target({ role: 'admin' }), true).kind).toBe(
      'already-admin',
    );
  });

  it('is a dry run without --apply and applies with --apply', () => {
    expect(decidePromotion(target(), false).kind).toBe('dry-run');
    expect(decidePromotion(target(), true).kind).toBe('apply');
  });
});
