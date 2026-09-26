import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  AccessTokenGuard,
  AuthenticatedRequest,
} from '../auth/access-token.guard.js';
import { SESSION_STORE, SessionStore } from '../auth/sessions/session-store.js';
import { TOKEN_SERVICE, TokenService } from '../auth/token.service.js';
import { USER_STORE, UserStore } from '../users/user-store.js';

/**
 * Administrator guard (T-012).
 *
 * Reuses `AccessTokenGuard` (JWT + session validity + email-verified + active
 * status, all re-read from the database on every request), then requires the
 * current role to be `admin`. Because the role is read from the database rather
 * than from the JWT, a demotion removes admin access on the very next request.
 *
 * An authenticated but non-admin caller receives 403; an invalid/expired or
 * suspended/unverified caller receives the underlying 401.
 */
@Injectable()
export class AdminGuard extends AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) tokens: TokenService,
    @Inject(SESSION_STORE) sessions: SessionStore,
    @Inject(USER_STORE) private readonly adminUsers: UserStore,
  ) {
    super(tokens, sessions, adminUsers);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.adminUsers.findById(request.userId);
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Administrator access required.');
    }
    return true;
  }
}
