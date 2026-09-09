import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { APP_CONFIG, AppConfig, REFRESH_COOKIE_NAME } from '../../config/env.js';
import { PASSWORD_SERVICE, PasswordService } from './password.service.js';
import { SESSION_STORE, SessionStore } from './sessions/session-store.js';
import {
  USER_STORE,
  UserStore,
  isDuplicateEntryError,
} from '../users/user-store.js';
import { TOKEN_SERVICE, TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(USER_STORE) private readonly users: UserStore,
    @Inject(SESSION_STORE) private readonly sessions: SessionStore,
    @Inject(PASSWORD_SERVICE) private readonly passwords: PasswordService,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async register(email: string, password: string): Promise<void> {
    const normalized = this.normalizeEmail(email);
    const existing = await this.users.findByEmail(normalized);
    if (existing) {
      return;
    }
    const passwordHash = await this.passwords.hash(password);
    try {
      await this.users.create({ email: normalized, passwordHash });
    } catch (error) {
      // Concurrent registration of the same email: the unique constraint
      // winning is equivalent to "already exists" and returns the same 202.
      if (isDuplicateEntryError(error)) {
        return;
      }
      throw error;
    }
  }

  private assertOrigin(origin: string | undefined): void {
    if (origin !== this.config.cors.origin) {
      throw new UnauthorizedException();
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const normalized = this.normalizeEmail(email);
    const user = await this.users.findByEmail(normalized);
    if (!user) {
      throw new UnauthorizedException();
    }
    const valid = await this.passwords.verify(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException();
    }

    const refreshToken = this.tokens.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.config.auth.refreshSessionTtlMs);
    const session = await this.sessions.issueSession(
      user.id,
      {
        tokenHash: this.tokens.hashRefreshToken(refreshToken),
        expiresAt,
      },
      'login',
    );

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      sid: session.id,
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    refreshToken: string,
    origin: string | undefined,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.assertOrigin(origin);

    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const newRefreshToken = this.tokens.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.config.auth.refreshSessionTtlMs);

    const result = await this.sessions.rotate(tokenHash, {
      tokenHash: this.tokens.hashRefreshToken(newRefreshToken),
      expiresAt,
    });
    if (!result) {
      throw new UnauthorizedException();
    }

    const accessToken = this.tokens.signAccessToken({
      sub: result.session.userId,
      sid: result.session.id,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string, origin: string | undefined): Promise<void> {
    this.assertOrigin(origin);

    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    await this.sessions.revokeAllByToken(tokenHash, 'logout');
  }

  async me(userId: string): Promise<{ id: string; email: string } | null> {
    const user = await this.users.findById(userId);
    if (!user) {
      return null;
    }
    return { id: user.id, email: user.email };
  }

  cookieName(): string {
    return REFRESH_COOKIE_NAME;
  }

  cookiePath(): string {
    return '/auth';
  }

  cookieSecure(): boolean {
    return this.config.auth.cookieSecure;
  }

  cookieMaxAgeSeconds(): number {
    return this.config.auth.refreshSessionTtlSeconds;
  }
}
