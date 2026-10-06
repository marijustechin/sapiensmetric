/**
 * Browser-side API client for the T-017 assessment-attempt endpoints (T-019).
 *
 * Targets only the configured public API base URL (`NEXT_PUBLIC_API_BASE_URL`);
 * no host is hardcoded. The access token is supplied per call by the caller (the
 * auth provider keeps it in memory only) and is never persisted here. Request
 * bodies contain only the public item IDs and the participant's own responses —
 * no keys and no scoring logic.
 */

import type {
  AssessmentAttemptList,
  AssessmentAttemptView,
  AssessmentResultDto,
  SaveAnswersRequest,
} from './assessment-types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
);

/** Stable API error codes mirrored from `docs/assessments.md`. */
export type ApiErrorCode =
  | 'ASSESSMENT_NOT_AVAILABLE'
  | 'ATTEMPT_NOT_FOUND'
  | 'ATTEMPT_FINALISED'
  | 'REVISION_CONFLICT'
  | 'INVALID_ANSWERS'
  | 'ATTEMPT_NOT_FINALISED';

export type ApiOutcome<T> =
  | { kind: 'success'; status: number; data: T }
  | { kind: 'unauthorized' }
  | { kind: 'clientError'; status: number; code: ApiErrorCode | null }
  | { kind: 'serverError'; status: number }
  | { kind: 'networkError' };

/**
 * The operation surface the UI depends on. Declared as an interface so
 * behavioural tests can inject a fake API without a server.
 */
export interface AssessmentApi {
  start(accessToken: string): Promise<ApiOutcome<AssessmentAttemptView>>;
  list(accessToken: string): Promise<ApiOutcome<AssessmentAttemptList>>;
  getAttempt(
    accessToken: string,
    attemptId: string,
  ): Promise<ApiOutcome<AssessmentAttemptView>>;
  saveAnswers(
    accessToken: string,
    attemptId: string,
    body: SaveAnswersRequest,
  ): Promise<ApiOutcome<AssessmentAttemptView>>;
  submit(
    accessToken: string,
    attemptId: string,
  ): Promise<ApiOutcome<AssessmentResultDto>>;
  result(
    accessToken: string,
    attemptId: string,
  ): Promise<ApiOutcome<AssessmentResultDto>>;
}

function apiBaseUrl(): string {
  return API_BASE_URL;
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  accessToken: string,
  body?: unknown,
): Promise<ApiOutcome<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { kind: 'networkError' };
  }

  if (response.status === 401) {
    return { kind: 'unauthorized' };
  }

  if (!response.ok) {
    let code: ApiErrorCode | null = null;
    try {
      const parsed = (await response.json()) as { code?: unknown };
      if (typeof parsed.code === 'string') {
        code = parsed.code as ApiErrorCode;
      }
    } catch {
      // Non-JSON error body: keep the status, no code.
    }
    if (response.status >= 500) {
      return { kind: 'serverError', status: response.status };
    }
    return { kind: 'clientError', status: response.status, code };
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    return { kind: 'networkError' };
  }
  return { kind: 'success', status: response.status, data };
}

export const assessmentApi: AssessmentApi = {
  start: (accessToken) =>
    request('/assessments/attempts', 'POST', accessToken),
  list: (accessToken) => request('/assessments/attempts', 'GET', accessToken),
  getAttempt: (accessToken, attemptId) =>
    request(`/assessments/attempts/${attemptId}`, 'GET', accessToken),
  saveAnswers: (accessToken, attemptId, body) =>
    request(`/assessments/attempts/${attemptId}/answers`, 'PUT', accessToken, body),
  submit: (accessToken, attemptId) =>
    request(`/assessments/attempts/${attemptId}/submit`, 'POST', accessToken),
  result: (accessToken, attemptId) =>
    request(`/assessments/attempts/${attemptId}/result`, 'GET', accessToken),
};

export { apiBaseUrl };
