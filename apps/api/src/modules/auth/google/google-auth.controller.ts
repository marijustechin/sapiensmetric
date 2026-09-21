import {
  Controller,
  Get,
  Inject,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Locale } from '@sapiensmetric/contracts';
import {
  googleStatusResponseSchema,
  googleUnavailableResponseSchema,
} from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig, REFRESH_COOKIE_NAME } from '../../../config/env.js';
import { GoogleAuthService } from './google-auth.service.js';
import { OAuthTransactionService } from './oauth-transaction.service.js';

type CookieReply = FastifyReply & {
  setCookie: (
    name: string,
    value: string,
    options: Record<string, unknown>,
  ) => FastifyReply;
  clearCookie: (name: string, options: Record<string, unknown>) => FastifyReply;
};

type SessionRequest = FastifyRequest & {
  cookies?: Record<string, string>;
};

@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(GoogleAuthService) private readonly google: GoogleAuthService,
    @Inject(OAuthTransactionService)
    private readonly transactions: OAuthTransactionService,
  ) {}

  @Get('status')
  status(): ReturnType<typeof googleStatusResponseSchema.parse> {
    return googleStatusResponseSchema.parse({ available: this.google.isEnabled() });
  }

  @Get('start')
  async start(
    @Query('returnTo') returnTo: string | undefined,
    @Query('locale') locale: string | undefined,
    @Res() reply: CookieReply,
  ): Promise<CookieReply> {
    if (!this.google.isEnabled()) {
      throw new ServiceUnavailableException(
        googleUnavailableResponseSchema.parse({
          statusCode: 503,
          code: 'GOOGLE_OAUTH_UNAVAILABLE',
          message: 'Google sign-in is not configured.',
        }),
      );
    }
    const resolvedLocale: Locale = locale === 'lt' ? 'lt' : 'en';
    const { cookieValue, redirectUrl } = this.google.start(
      returnTo,
      resolvedLocale,
    );
    void reply.setCookie(
      this.transactions.cookieName(),
      cookieValue,
      this.transactions.setCookieOptions() as unknown as Record<string, unknown>,
    );
    return reply.redirect(redirectUrl, 302);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() request: SessionRequest,
    @Res() reply: CookieReply,
  ): Promise<CookieReply> {
    const txCookie = request.cookies?.[this.transactions.cookieName()];
    const transaction = this.transactions.verify(txCookie);
    const locale: Locale = transaction?.locale ?? 'en';

    void reply.clearCookie(
      this.transactions.cookieName(),
      this.transactions.clearCookieOptions() as unknown as Record<string, unknown>,
    );

    if (error) {
      return reply.redirect(this.loginErrorUrl(locale, 'cancelled'), 302);
    }

    const result = await this.google.complete({ code, state, txCookie });
    if (result.outcome === 'error') {
      return reply.redirect(
        this.loginErrorUrl(result.locale, result.reason),
        302,
      );
    }

    void reply.setCookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/auth',
      secure: this.config.auth.cookieSecure,
      maxAge: this.config.auth.refreshSessionTtlSeconds,
    });
    return reply.redirect(`${this.config.publicAppUrl}${result.returnTo}`, 302);
  }

  private loginErrorUrl(locale: Locale, reason: string): string {
    return `${this.config.publicAppUrl}/${locale}/auth/login?googleError=${encodeURIComponent(reason)}`;
  }
}
