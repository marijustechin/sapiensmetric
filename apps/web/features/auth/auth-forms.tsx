'use client';

import { Link } from '../../shared/i18n/navigation';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import * as authApi from './auth-api';
import { sanitizeReturnTo } from './auth-navigation';
import type { AppLocale } from '../../shared/lib/locale-navigation';
import {
  registerFeedback,
  type RegisterFeedback,
} from './register-feedback';
import { useAuth } from './auth-provider';
import { GoogleSignInButton } from './google-sign-in-button';

/** Read the action token from the URL fragment only; never from a query string. */
function useFragmentToken(): { token: string | null; ready: boolean } {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const match = /(?:^#|&)token=([^&]+)/.exec(window.location.hash);
    if (match) {
      setToken(decodeURIComponent(match[1]));
      // Remove the historical record of the fragment; do NOT consume here.
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
    }
    setReady(true);
  }, []);

  return { token, ready };
}

export function LoginForm() {
  const t = useTranslations('Auth');
  const locale = useLocale() as AppLocale;
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [returnTo, setReturnTo] = useState(`/${locale}/account`);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReturnTo(
      sanitizeReturnTo(
        params.get('returnTo'),
        window.location.origin,
        `/${locale}/account`,
      ),
    );
    if (params.get('googleError')) {
      setMessage(t('googleError'));
    }
  }, [locale, t]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = await login(email, password);
    setBusy(false);
    if (result.kind === 'success') {
      router.replace(returnTo);
      return;
    }
    if (result.kind === 'invalid-credentials') {
      setMessage(t('invalidCredentials'));
      return;
    }
    if (result.kind === 'invalid-input') {
      setMessage(t('invalidInput'));
      return;
    }
    setMessage(t('error'));
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {t('emailLabel')}
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        {t('passwordLabel')}
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="submit" disabled={busy} className="border border-gray-500 px-3 py-1">
        {t('login')}
      </button>
      {message ? <p role="alert">{message}</p> : null}
      <p className="flex gap-3 text-sm">
        <Link href="/auth/register">{t('registerLink')}</Link>
        <Link href="/auth/forgot-password">{t('forgotLink')}</Link>
      </p>
      <GoogleSignInButton returnTo={returnTo} />
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations('Auth');
  const feedbackT = useTranslations('RegisterFeedback');
  const locale = useLocale() as AppLocale;
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<RegisterFeedback | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 12 || password.length > 128) {
      setFeedback(registerFeedback('invalid-input'));
      return;
    }
    setBusy(true);
    setFeedback(null);
    const result = await register(email, password, locale);
    setBusy(false);
    setFeedback(registerFeedback(result.kind));
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {t('emailLabel')}
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        {t('passwordLabel')}
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="submit" disabled={busy} className="border border-gray-500 px-3 py-1">
        {t('register')}
      </button>
      {feedback ? (
        <p role="status">{feedbackT(feedback.messageKey)}</p>
      ) : null}
      {feedback && (feedback.showLogin || feedback.showResend || feedback.showForgot) ? (
        <p className="flex flex-wrap gap-3 text-sm">
          {feedback.showLogin ? (
            <Link href="/auth/login">{t('loginLink')}</Link>
          ) : null}
          {feedback.showResend ? (
            <Link href="/auth/verify-email">{t('resend')}</Link>
          ) : null}
          {feedback.showForgot ? (
            <Link href="/auth/forgot-password">{t('forgotLink')}</Link>
          ) : null}
        </p>
      ) : null}
      {!feedback ? (
        <p className="flex gap-3 text-sm">
          <Link href="/auth/login">{t('loginLink')}</Link>
        </p>
      ) : null}
      <GoogleSignInButton />
    </form>
  );
}

export function VerifyEmailForm() {
  const t = useTranslations('Auth');
  const locale = useLocale() as AppLocale;
  const { token, ready } = useFragmentToken();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onResend = async () => {
    setBusy(true);
    const result = await authApi.requestEmailVerification(email, locale);
    setBusy(false);
    setMessage(result.kind === 'success' ? t('generic') : t('error'));
  };

  const onConfirm = async () => {
    if (!token) {
      setMessage(t('missingToken'));
      return;
    }
    setBusy(true);
    const result = await authApi.confirmEmailVerification(token);
    setBusy(false);
    setMessage(result.kind === 'success' ? t('verified') : t('invalidLink'));
  };

  if (!ready) {
    return null;
  }

  if (token) {
    return (
      <section className="flex max-w-sm flex-col gap-3">
        <button type="button" onClick={() => void onConfirm()} disabled={busy} className="border border-gray-500 px-3 py-1">
          {t('verify')}
        </button>
        {message ? <p role="status">{message}</p> : null}
        <Link className="text-sm" href="/auth/login">
          {t('loginLink')}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {t('emailLabel')}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="button" onClick={() => void onResend()} disabled={busy} className="border border-gray-500 px-3 py-1">
        {t('resend')}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <Link className="text-sm" href="/auth/login">
        {t('loginLink')}
      </Link>
    </section>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const locale = useLocale() as AppLocale;
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await authApi.requestPasswordReset(email, locale);
    setBusy(false);
    setMessage(result.kind === 'success' ? t('generic') : t('error'));
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {t('emailLabel')}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="submit" disabled={busy} className="border border-gray-500 px-3 py-1">
        {t('requestReset')}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <Link className="text-sm" href="/auth/login">
        {t('loginLink')}
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations('Auth');
  const { token, ready } = useFragmentToken();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage(t('missingToken'));
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setMessage(t('invalidInput'));
      return;
    }
    setBusy(true);
    const result = await authApi.confirmPasswordReset(token, password);
    setBusy(false);
    setMessage(result.kind === 'success' ? t('resetDone') : t('invalidLink'));
  };

  if (!ready) {
    return null;
  }

  if (!token) {
    return <p>{t('missingToken')}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {t('newPassword')}
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="submit" disabled={busy} className="border border-gray-500 px-3 py-1">
        {t('confirmReset')}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <Link className="text-sm" href="/auth/login">
        {t('loginLink')}
      </Link>
    </form>
  );
}
