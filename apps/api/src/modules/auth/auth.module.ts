import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { Argon2PasswordService, PASSWORD_SERVICE } from './password.service.js';
import { JwtTokenService, TOKEN_SERVICE } from './token.service.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from './sessions/sessions.module.js';

@Module({
  imports: [UsersModule, SessionsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    { provide: PASSWORD_SERVICE, useClass: Argon2PasswordService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
