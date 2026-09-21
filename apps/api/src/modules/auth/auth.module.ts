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
import { IdentitiesModule } from './identities/identities.module.js';
import { MailerModule } from '../mailer/mailer.module.js';
import { GoogleAuthController } from './google/google-auth.controller.js';
import { GoogleAuthService } from './google/google-auth.service.js';
import { OAuthTransactionService } from './google/oauth-transaction.service.js';
import {
  GOOGLE_JWKS,
  GoogleJwksClient,
} from './google/google-jwks.client.js';
import {
  GOOGLE_ID_TOKEN_VERIFIER,
  GoogleIdTokenService,
} from './google/google-id-token.service.js';
import {
  GOOGLE_TOKEN_CLIENT,
  GoogleOAuthTokenClient,
} from './google/google-token.client.js';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    ActionTokensModule,
    IdentitiesModule,
    MailerModule,
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    ActionTokenService,
    OAuthTransactionService,
    GoogleAuthService,
    GoogleJwksClient,
    GoogleIdTokenService,
    GoogleOAuthTokenClient,
    // Factory provider: the limiter takes an optional primitive capacity and
    // must not be constructor-reflected by Nest.
    { provide: IpRateLimiter, useFactory: () => new IpRateLimiter() },
    { provide: PASSWORD_SERVICE, useClass: Argon2PasswordService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: GOOGLE_JWKS, useExisting: GoogleJwksClient },
    { provide: GOOGLE_ID_TOKEN_VERIFIER, useExisting: GoogleIdTokenService },
    { provide: GOOGLE_TOKEN_CLIENT, useExisting: GoogleOAuthTokenClient },
  ],
  exports: [AuthService, AccessTokenGuard, ActionTokenService],
})
export class AuthModule {}
