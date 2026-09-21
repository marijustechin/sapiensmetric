import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { Argon2PasswordService, PASSWORD_SERVICE } from './password.service.js';
import { JwtTokenService, TOKEN_SERVICE } from './token.service.js';
import { ActionTokenService } from './action-token.service.js';
import { IpRateLimiter } from './ip-rate-limiter.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { ActionTokensModule } from './action-tokens/action-tokens.module.js';
import { MailerModule } from '../mailer/mailer.module.js';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    ActionTokensModule,
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    ActionTokenService,
    // Factory provider: the limiter takes an optional primitive capacity and
    // must not be constructor-reflected by Nest.
    { provide: IpRateLimiter, useFactory: () => new IpRateLimiter() },
    { provide: PASSWORD_SERVICE, useClass: Argon2PasswordService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [AuthService, AccessTokenGuard, ActionTokenService],
})
export class AuthModule {}
