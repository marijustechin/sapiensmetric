import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  loginRequestSchema,
  registerRequestSchema,
  meResponseSchema,
  loginResponseSchema,
  registerResponseSchema,
} from '@sapiensmetric/contracts';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard, AuthenticatedRequest } from './access-token.guard.js';

type CookieReply = FastifyReply & {
  setCookie: (
    name: string,
    value: string,
    options: Record<string, unknown>,
  ) => FastifyReply;
  clearCookie: (name: string, options: Record<string, unknown>) => FastifyReply;
};

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  private cookieBase() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: this.auth.cookiePath(),
      secure: this.auth.cookieSecure(),
    };
  }

  private setRefreshCookie(reply: CookieReply, refreshToken: string): void {
    void reply.setCookie(this.auth.cookieName(), refreshToken, {
      ...this.cookieBase(),
      maxAge: this.auth.cookieMaxAgeSeconds(),
    });
  }

  private clearRefreshCookie(reply: CookieReply): void {
    void reply.clearCookie(this.auth.cookieName(), this.cookieBase());
  }

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  async register(
    @Body() body: unknown,
  ): Promise<typeof registerResponseSchema._type> {
    const parsed = registerRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException();
    }
    await this.auth.register(parsed.data.email, parsed.data.password);
    return registerResponseSchema.parse({ status: 'accepted' });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: CookieReply,
  ): Promise<typeof loginResponseSchema._type> {
    const parsed = loginRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException();
    }
    const { accessToken, refreshToken } = await this.auth.login(
      parsed.data.email,
      parsed.data.password,
    );
    this.setRefreshCookie(reply, refreshToken);
    return loginResponseSchema.parse({ accessToken });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ): Promise<typeof loginResponseSchema._type> {
    const cookies = (request as FastifyRequest & {
      cookies?: Record<string, string>;
    }).cookies;
    const refreshToken = cookies?.[this.auth.cookieName()];
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const result = await this.auth.refresh(refreshToken, request.headers.origin);
    this.setRefreshCookie(reply, result.refreshToken);
    return loginResponseSchema.parse({ accessToken: result.accessToken });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ): Promise<void> {
    const cookies = (request as FastifyRequest & {
      cookies?: Record<string, string>;
    }).cookies;
    const refreshToken = cookies?.[this.auth.cookieName()];
    if (refreshToken) {
      await this.auth.logout(refreshToken, request.headers.origin);
    }
    this.clearRefreshCookie(reply);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@Req() request: AuthenticatedRequest): Promise<typeof meResponseSchema._type> {
    const user = await this.auth.me(request.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return meResponseSchema.parse(user);
  }
}
