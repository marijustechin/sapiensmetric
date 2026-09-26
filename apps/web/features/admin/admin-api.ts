/**
 * Admin API client (feature: admin).
 *
 * Calls `/admin/*` with the in-memory bearer token. Distinguishes 401
 * (expired/invalid session) from 403 (authenticated but not an administrator)
 * so the screen can render the right state. The web package mirrors the API
 * contract shapes in `entities/user/model/types.ts`.
 */
import { apiBaseUrl } from '../auth/auth-api';
import type {
  AuditEntry,
  UserDetail,
  UserList,
  UserListQuery,
  UserRole,
  UserStatus,
  UserSummaryCounts,
} from '../../entities/user/model/types';

export type AdminOutcome<T> =
  | { kind: 'success'; data: T }
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' }
  | { kind: 'httpError'; status: number }
  | { kind: 'networkError' };

async function request<T>(
  path: string,
  token: string,
  init?: { method?: 'GET' | 'PATCH' | 'POST'; body?: unknown },
): Promise<AdminOutcome<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: init?.method ?? 'GET',
      headers,
      credentials: 'include',
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    return { kind: 'networkError' };
  }
  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status === 403) return { kind: 'forbidden' };
  if (!response.ok) return { kind: 'httpError', status: response.status };
  try {
    return { kind: 'success', data: (await response.json()) as T };
  } catch {
    return { kind: 'networkError' };
  }
}

function toQuery(params: UserListQuery): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.role) search.set('role', params.role);
  if (params.status) search.set('status', params.status);
  if (params.verified) search.set('verified', params.verified);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.sort) search.set('sort', params.sort);
  if (params.order) search.set('order', params.order);
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const adminApi = {
  summary(token: string): Promise<AdminOutcome<UserSummaryCounts>> {
    return request('/admin/summary', token);
  },
  listUsers(token: string, params: UserListQuery): Promise<AdminOutcome<UserList>> {
    return request(`/admin/users${toQuery(params)}`, token);
  },
  getUser(token: string, id: string): Promise<AdminOutcome<UserDetail>> {
    return request(`/admin/users/${id}`, token);
  },
  changeRole(
    token: string,
    id: string,
    role: UserRole,
  ): Promise<AdminOutcome<UserDetail>> {
    return request(`/admin/users/${id}/role`, token, {
      method: 'PATCH',
      body: { role },
    });
  },
  changeStatus(
    token: string,
    id: string,
    status: UserStatus,
  ): Promise<AdminOutcome<UserDetail>> {
    return request(`/admin/users/${id}/status`, token, {
      method: 'PATCH',
      body: { status },
    });
  },
  revokeSessions(token: string, id: string): Promise<AdminOutcome<UserDetail>> {
    return request(`/admin/users/${id}/revoke-sessions`, token, { method: 'POST' });
  },
  audit(token: string, targetUserId?: string): Promise<AdminOutcome<{ items: AuditEntry[] }>> {
    const suffix = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
    return request(`/admin/audit${suffix}`, token);
  },
};
