import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { Inject } from '@nestjs/common';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.accessTokenTtlSeconds,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, this.config.jwt.secret);
    if (typeof decoded === 'string') {
      throw new Error('invalid access token payload');
    }
    return { sub: decoded.sub as string, sid: decoded.sid as string };
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
