/**
 * Browser-side API client for the existing credentials auth endpoints.
 *
 * It targets only the configured public API base URL
 * (`NEXT_PUBLIC_API_BASE_URL`); no host is hardcoded. It always sends
 * `credentials: 'include'` so the HttpOnly refresh cookie is used, and it never
 * stores an access token itself — callers (the auth provider) keep it in memory
 * only.
 *
 * Request/response shapes mirror `packages/contracts/src/auth.ts`.
 */

import type { Locale } from './auth-types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
);

export type FetchOutcome<T> =
  | { kind: 'success'; status: number; data: T }
  | { kind: 'unauthorized'; status: 401 }
  | { kind: 'httpError'; status: number }
  | { kind: 'networkError' };

interface RequestOptions {
  method: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string;
}

async function request<T>(
  path: string,
  options: RequestOptions,
): Promise<FetchOutcome<T>> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    return { kind: 'networkError' };
  }

  if (response.status === 401) {
    return { kind: 'unauthorized', status: 401 };
  }
  if (!response.ok) {
    return { kind: 'httpError', status: response.status };
  }
  if (response.status === 204) {
    return { kind: 'success', status: 204, data: undefined as T };
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    return { kind: 'networkError' };
  }
  return { kind: 'success', status: response.status, data };
}

export function apiBaseUrl(): string {
  return API_BASE_URL;
}

export function googleStatus(): Promise<FetchOutcome<{ available: boolean }>> {
  return request('/auth/google/status', { method: 'GET' });
}

export interface AcceptedResponse {
  status: 'accepted';
}

export interface AccessTokenResponse {
  accessToken: string;
}

export function register(
  email: string,
  password: string,
  locale: Locale,
): Promise<FetchOutcome<AcceptedResponse>> {
  return request('/auth/register', {
    method: 'POST',
    body: { email, password, locale },
  });
}

export function login(
  email: string,
  password: string,
): Promise<FetchOutcome<AccessTokenResponse>> {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

export function refresh(): Promise<FetchOutcome<AccessTokenResponse>> {
  return request('/auth/refresh', { method: 'POST' });
}

export function logout(): Promise<FetchOutcome<void>> {
  return request('/auth/logout', { method: 'POST' });
}

export function me(
  accessToken: string,
): Promise<FetchOutcome<{ id: string; email: string }>> {
  return request('/auth/me', { method: 'GET', accessToken });
}

export function requestEmailVerification(
  email: string,
  locale: Locale,
): Promise<FetchOutcome<AcceptedResponse>> {
  return request('/auth/email-verification/request', {
    method: 'POST',
    body: { email, locale },
  });
}

export function confirmEmailVerification(
  token: string,
): Promise<FetchOutcome<{ status: 'verified' }>> {
  return request('/auth/email-verification/confirm', {
    method: 'POST',
    body: { token },
  });
}

export function requestPasswordReset(
  email: string,
  locale: Locale,
): Promise<FetchOutcome<AcceptedResponse>> {
  return request('/auth/password-reset/request', {
    method: 'POST',
    body: { email, locale },
  });
}

export function confirmPasswordReset(
  token: string,
  password: string,
): Promise<FetchOutcome<{ status: 'reset' }>> {
  return request('/auth/password-reset/confirm', {
    method: 'POST',
    body: { token, password },
  });
}
