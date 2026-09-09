import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { SESSION_STORE, SessionStore } from './sessions/session-store.js';
import { TOKEN_SERVICE, TokenService } from './token.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  userId: string;
  sessionId: string;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(SESSION_STORE) private readonly sessions: SessionStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.slice('Bearer '.length).trim();

    let payload;
    try {
      payload = this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException();
    }

    const session = await this.sessions.findById(payload.sid);
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() < Date.now() ||
      session.userId !== payload.sub
    ) {
      throw new UnauthorizedException();
    }

    request.userId = payload.sub;
    request.sessionId = payload.sid;
    return true;
  }
}
