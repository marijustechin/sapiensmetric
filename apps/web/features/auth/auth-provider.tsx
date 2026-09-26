'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from './auth-api';
import { createSingleFlight } from '../../shared/lib/single-flight';
import type { AuthUser, Locale } from './auth-types';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export type LoginResult =
  | { kind: 'success' }
  | { kind: 'invalid-credentials' }
  | { kind: 'invalid-input' }
  | { kind: 'error' };

export type RegisterResult =
  | { kind: 'success' }
  | { kind: 'already-registered' }
  | { kind: 'delivery-failed' }
  | { kind: 'invalid-input' }
  | { kind: 'error' };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Current in-memory access token, or null. Never persisted. */
  getAccessToken: () => string | null;
  retryBootstrap: () => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (
    email: string,
    password: string,
    locale: Locale,
  ) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  // The access token is held in memory only. It is never persisted to storage,
  // written to the URL, logged, or rendered.
  const accessTokenRef = useRef<string | null>(null);

  const runBootstrap = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setUser(null);

    const refreshed = await authApi.refresh();
    if (refreshed.kind === 'unauthorized') {
      accessTokenRef.current = null;
      setStatus('unauthenticated');
      return;
    }
    if (refreshed.kind !== 'success') {
      // Network failure or non-401 HTTP error: recoverable, not a redirect.
      accessTokenRef.current = null;
      setStatus('error');
      return;
    }

    accessTokenRef.current = refreshed.data.accessToken;
    const who = await authApi.me(refreshed.data.accessToken);
    if (who.kind === 'success') {
      setUser(who.data);
      setStatus('authenticated');
      return;
    }
    accessTokenRef.current = null;
    setUser(null);
    setStatus(who.kind === 'unauthorized' ? 'unauthenticated' : 'error');
  }, []);

  // Single-flight bootstrap: a double-invoked mount effect (React dev
  // StrictMode after the full-page Google callback redirect) must not fire two
  // concurrent refreshes. Two refreshes race on the rotating refresh cookie,
  // one returns 401, and the account gate would then bounce an authenticated
  // user to the login form. Coalescing keeps the route correct.
  const singleFlightRef = useRef<
    ((run: () => Promise<void>) => Promise<void>) | null
  >(null);
  if (singleFlightRef.current === null) {
    singleFlightRef.current = createSingleFlight<void>();
  }
  const bootstrap = useCallback(
    () => singleFlightRef.current?.(runBootstrap) ?? runBootstrap(),
    [runBootstrap],
  );

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await authApi.login(email, password);
      if (result.kind === 'success') {
        accessTokenRef.current = result.data.accessToken;
        const who = await authApi.me(result.data.accessToken);
        if (who.kind === 'success') {
          setUser(who.data);
          setStatus('authenticated');
          return { kind: 'success' };
        }
        accessTokenRef.current = null;
        setUser(null);
        setStatus(who.kind === 'unauthorized' ? 'unauthenticated' : 'error');
        return { kind: 'error' };
      }
      if (result.kind === 'unauthorized') {
        // Invalid credentials and unverified accounts are indistinguishable by
        // design (generic 401); the caller shows the same generic message.
        return { kind: 'invalid-credentials' };
      }
      if (result.kind === 'httpError' && result.status === 400) {
        return { kind: 'invalid-input' };
      }
      return { kind: 'error' };
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      locale: Locale,
    ): Promise<RegisterResult> => {
      const result = await authApi.register(email, password, locale);
      if (result.kind === 'success') {
        return { kind: 'success' };
      }
      if (result.kind === 'httpError') {
        if (result.status === 409) {
          return { kind: 'already-registered' };
        }
        if (result.status === 502) {
          return { kind: 'delivery-failed' };
        }
        if (result.status === 400) {
          return { kind: 'invalid-input' };
        }
      }
      return { kind: 'error' };
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      accessTokenRef.current = null;
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      getAccessToken: () => accessTokenRef.current,
      retryBootstrap: () => {
        void bootstrap();
      },
      login,
      register,
      logout,
    }),
    [status, user, bootstrap, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
