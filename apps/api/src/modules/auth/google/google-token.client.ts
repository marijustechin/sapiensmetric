import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../../config/env.js';

export const GOOGLE_TOKEN_CLIENT = Symbol('GOOGLE_TOKEN_CLIENT');

export interface GoogleTokenExchangeInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface GoogleTokenClient {
  exchangeCode(input: GoogleTokenExchangeInput): Promise<{ idToken: string }>;
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Authorization-code + PKCE exchange with Google's token endpoint. */
@Injectable()
export class GoogleOAuthTokenClient implements GoogleTokenClient {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async exchangeCode(
    input: GoogleTokenExchangeInput,
  ): Promise<{ idToken: string }> {
    const clientId = this.config.google.clientId;
    const clientSecret = this.config.google.clientSecret;
    if (!clientId || !clientSecret) {
      throw new Error('Google sign-in is not configured.');
    }
    const body = new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: input.codeVerifier,
    });
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      throw new Error('Google token exchange failed.');
    }
    const json = (await response.json()) as { id_token?: unknown };
    if (typeof json.id_token !== 'string' || json.id_token.length === 0) {
      throw new Error('Google token response is missing id_token.');
    }
    return { idToken: json.id_token };
  }
}
