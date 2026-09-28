import { describe, it, expect } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard.js';
import type { TokenService } from './token.service.js';
import type { SessionStore, SessionRecord } from './sessions/session-store.js';
import type { UserStore, UserRecord } from '../users/user-store.js';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const VALID_PAYLOAD = { sub: 'user-1', sid: 'session-1' };

function makeGuard(options: {
  tokenValid?: boolean;
  session?: Partial<SessionRecord> | null;
  user?: Partial<UserRecord> | null;
}) {
  const tokens = {
    verifyAccessToken: () => {
      if (options.tokenValid === false) throw new Error('bad token');
      return VALID_PAYLOAD;
    },
  } as unknown as TokenService;

  const sessions = {
    findById: async () =>
      options.session === null
        ? null
        : ({
            id: 'session-1',
            userId: 'user-1',
            revokedAt: null,
            expiresAt: new Date(Date.now() + 60_000),
            ...options.session,
          } as SessionRecord),
  } as unknown as SessionStore;

  const users = {
    findById: async () =>
      options.user === null
        ? null
        : ({
            id: 'user-1',
            emailVerifiedAt: new Date(),
            status: 'active',
            ...options.user,
          } as UserRecord),
  } as unknown as UserStore;

  return new AccessTokenGuard(tokens, sessions, users);
}

async function run(guard: AccessTokenGuard, request: Record<string, unknown>) {
  return guard.canActivate(contextFor(request));
}

describe('AccessTokenGuard', () => {
  it('rejects a request with no bearer token (unauthenticated)', async () => {
    const guard = makeGuard({});
    await expect(run(guard, { headers: {} })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid access token', async () => {
    const guard = makeGuard({ tokenValid: false });
    await expect(
      run(guard, { headers: { authorization: 'Bearer bad' } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a revoked or expired session', async () => {
    const guard = makeGuard({ session: { revokedAt: new Date() } });
    await expect(
      run(guard, { headers: { authorization: 'Bearer ok' } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a suspended user', async () => {
    const guard = makeGuard({ user: { status: 'suspended' } });
    await expect(
      run(guard, { headers: { authorization: 'Bearer ok' } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unverified user', async () => {
    const guard = makeGuard({ user: { emailVerifiedAt: null } });
    await expect(
      run(guard, { headers: { authorization: 'Bearer ok' } }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid session and exposes the userId', async () => {
    const guard = makeGuard({});
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer ok' },
    };
    await expect(run(guard, request)).resolves.toBe(true);
    expect(request.userId).toBe('user-1');
    expect(request.sessionId).toBe('session-1');
  });
});
