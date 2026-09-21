import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Locale } from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig, REFRESH_COOKIE_NAME } from '../../config/env.js';
import { PASSWORD_SERVICE, PasswordService } from './password.service.js';
import { SESSION_STORE, SessionStore } from './sessions/session-store.js';
import {
  USER_STORE,
  UserStore,
  isDuplicateEntryError,
} from '../users/user-store.js';
import { TOKEN_SERVICE, TokenService } from './token.service.js';
import { ActionTokenService } from './action-token.service.js';
import { MAILER_SERVICE, Mailer } from '../mailer/mailer.service.js';
import { IpRateLimiter } from './ip-rate-limiter.js';

/** In-memory per-IP request limit (D-016): 3 calls per hour per endpoint. */
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_MAX_PER_IP = 3;

/**
 * In-memory per-IP limit for password-reset confirmation (D-016): 5 calls per
 * hour per IP. Applied before Argon2 hashing to protect against denial of
 * service.
 */
const RESET_CONFIRM_WINDOW_MS = 60 * 60 * 1000;
const RESET_CONFIRM_MAX_PER_IP = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(USER_STORE) private readonly users: UserStore,
    @Inject(SESSION_STORE) private readonly sessions: SessionStore,
    @Inject(PASSWORD_SERVICE) private readonly passwords: PasswordService,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(ActionTokenService) private readonly actionTokens: ActionTokenService,
    @Inject(MAILER_SERVICE) private readonly mailer: Mailer,
    @Inject(IpRateLimiter) private readonly limiter: IpRateLimiter,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private allowRequest(endpoint: string, ip: string): boolean {
    return this.limiter.allow(
      `${ip}|${endpoint}`,
      REQUEST_MAX_PER_IP,
      REQUEST_WINDOW_MS,
    );
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

  /**
   * Enforce the single explicit Origin rule. Both sides are canonical origins,
   * so a trailing slash in configuration cannot break the check.
   */
  assertOrigin(origin: string | undefined): void {
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
    // Access gate (D-016): an unverified user is treated exactly like invalid
    // credentials — no access token and no refresh cookie.
    if (!user.emailVerifiedAt) {
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
    const existing = await this.sessions.findByTokenHash(tokenHash);
    // Existing sessions must not bypass the verification access gate.
    const user = existing
      ? await this.users.findById(existing.userId)
      : null;
    if (!user || !user.emailVerifiedAt) {
      throw new UnauthorizedException();
    }

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
    if (!user || !user.emailVerifiedAt) {
      return null;
    }
    return { id: user.id, email: user.email };
  }

  // --- T-006: email verification and password reset -----------------------

  async requestEmailVerification(
    email: string,
    locale: Locale,
    ip: string,
  ): Promise<void> {
    if (!this.allowRequest('email-verification/request', ip)) {
      return;
    }
    const user = await this.users.findByEmail(this.normalizeEmail(email));
    if (!user || user.emailVerifiedAt) {
      return;
    }
    const issued = await this.actionTokens.issue(user.id, 'verify');
    if (issued.status === 'cooldown') {
      return;
    }
    try {
      await this.mailer.sendVerificationEmail(
        user.email,
        issued.rawToken,
        locale,
      );
    } catch {
      // Transport rejection before SMTP acceptance: remove the token so none is
      // usable, and leave the cooldown unconsumed. Log only a safe message.
      await this.actionTokens.revoke(issued.id);
      this.logger.warn('Email verification delivery failed.');
    }
  }

  async confirmEmailVerification(rawToken: string): Promise<void> {
    const consumed = await this.actionTokens.consumeVerification(rawToken);
    if (!consumed) {
      throw new BadRequestException();
    }
  }

  async requestPasswordReset(
    email: string,
    locale: Locale,
    ip: string,
  ): Promise<void> {
    if (!this.allowRequest('password-reset/request', ip)) {
      return;
    }
    const user = await this.users.findByEmail(this.normalizeEmail(email));
    if (!user) {
      return;
    }
    const issued = await this.actionTokens.issue(user.id, 'reset');
    if (issued.status === 'cooldown') {
      return;
    }
    try {
      await this.mailer.sendPasswordResetEmail(
        user.email,
        issued.rawToken,
        locale,
      );
    } catch {
      await this.actionTokens.revoke(issued.id);
      this.logger.warn('Password reset delivery failed.');
    }
  }

  async confirmPasswordReset(
    rawToken: string,
    password: string,
    ip: string,
  ): Promise<void> {
    // Applied before Argon2 hashing. A limited confirmation receives the same
    // generic 400 as any other invalid confirmation.
    const allowed = this.limiter.allow(
      `${ip}|password-reset/confirm`,
      RESET_CONFIRM_MAX_PER_IP,
      RESET_CONFIRM_WINDOW_MS,
    );
    if (!allowed) {
      throw new BadRequestException();
    }
    const passwordHash = await this.passwords.hash(password);
    const reset = await this.actionTokens.consumeForPasswordReset(
      rawToken,
      passwordHash,
    );
    if (!reset) {
      throw new BadRequestException();
    }
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
