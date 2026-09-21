'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import * as authApi from '../../lib/auth-api';
import { sanitizeReturnTo } from '../../lib/auth-navigation';
import {
  registerFeedback,
  type RegisterFeedback,
} from '../../lib/register-feedback';
import { useAuth } from './auth-provider';
import type { Locale } from '../../lib/auth-types';

const COPY = {
  lt: {
    emailLabel: 'El. paštas',
    passwordLabel: 'Slaptažodis',
    newPassword: 'Naujas slaptažodis',
    login: 'Prisijungti',
    register: 'Registruotis',
    resend: 'Siųsti patvirtinimo nuorodą',
    verify: 'Patvirtinti el. pašto adresą',
    requestReset: 'Siųsti slaptažodžio atkūrimo nuorodą',
    confirmReset: 'Pakeisti slaptažodį',
    forgotLink: 'Pamiršau slaptažodį',
    registerLink: 'Sukurti paskyrą',
    loginLink: 'Grįžti į prisijungimą',
    generic: 'Jei paskyra atitinka sąlygas, netrukus gausite el. laišką.',
    verified: 'El. pašto adresas patvirtintas. Galite prisijungti.',
    resetDone: 'Slaptažodis pakeistas. Galite prisijungti.',
    invalidLink: 'Nuoroda netinkama arba pasibaigusi.',
    missingToken: 'Šiai nuorodai trūksta žymens.',
    invalidCredentials: 'Neteisingi prisijungimo duomenys.',
    invalidInput: 'Patikrinkite įvestus duomenis (slaptažodis 12–128 simbolių).',
    error: 'Nepavyko. Bandykite dar kartą.',
  },
  en: {
    emailLabel: 'Email',
    passwordLabel: 'Password',
    newPassword: 'New password',
    login: 'Sign in',
    register: 'Register',
    resend: 'Send verification link',
    verify: 'Verify email address',
    requestReset: 'Send password-reset link',
    confirmReset: 'Change password',
    forgotLink: 'Forgot password',
    registerLink: 'Create an account',
    loginLink: 'Back to sign in',
    generic: 'If the account is eligible, an email will arrive shortly.',
    verified: 'Email address verified. You can sign in.',
    resetDone: 'Password changed. You can sign in.',
    invalidLink: 'This link is invalid or has expired.',
    missingToken: 'This link is missing its token.',
    invalidCredentials: 'Invalid sign-in details.',
    invalidInput: 'Check the entered details (password must be 12–128 characters).',
    error: 'Something went wrong. Please try again.',
  },
} as const;

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

export function LoginForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];
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
  }, [locale]);

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
      setMessage(c.invalidCredentials);
      return;
    }
    if (result.kind === 'invalid-input') {
      setMessage(c.invalidInput);
      return;
    }
    setMessage(c.error);
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {c.emailLabel}
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
        {c.passwordLabel}
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
        {c.login}
      </button>
      {message ? <p role="alert">{message}</p> : null}
      <p className="flex gap-3 text-sm">
        <Link href={`/${locale}/auth/register`}>{c.registerLink}</Link>
        <Link href={`/${locale}/auth/forgot-password`}>{c.forgotLink}</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<RegisterFeedback | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 12 || password.length > 128) {
      setFeedback(registerFeedback(locale, 'invalid-input'));
      return;
    }
    setBusy(true);
    setFeedback(null);
    const result = await register(email, password, locale);
    setBusy(false);
    setFeedback(registerFeedback(locale, result.kind));
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {c.emailLabel}
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
        {c.passwordLabel}
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
        {c.register}
      </button>
      {feedback ? <p role="status">{feedback.message}</p> : null}
      {feedback && (feedback.showLogin || feedback.showResend || feedback.showForgot) ? (
        <p className="flex flex-wrap gap-3 text-sm">
          {feedback.showLogin ? (
            <Link href={`/${locale}/auth/login`}>{c.loginLink}</Link>
          ) : null}
          {feedback.showResend ? (
            <Link href={`/${locale}/auth/verify-email`}>{c.resend}</Link>
          ) : null}
          {feedback.showForgot ? (
            <Link href={`/${locale}/auth/forgot-password`}>{c.forgotLink}</Link>
          ) : null}
        </p>
      ) : null}
      {!feedback ? (
        <p className="flex gap-3 text-sm">
          <Link href={`/${locale}/auth/login`}>{c.loginLink}</Link>
        </p>
      ) : null}
    </form>
  );
}

export function VerifyEmailForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const { token, ready } = useFragmentToken();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onResend = async () => {
    setBusy(true);
    const result = await authApi.requestEmailVerification(email, locale);
    setBusy(false);
    setMessage(result.kind === 'success' ? c.generic : c.error);
  };

  const onConfirm = async () => {
    if (!token) {
      setMessage(c.missingToken);
      return;
    }
    setBusy(true);
    const result = await authApi.confirmEmailVerification(token);
    setBusy(false);
    setMessage(result.kind === 'success' ? c.verified : c.invalidLink);
  };

  if (!ready) {
    return null;
  }

  if (token) {
    return (
      <section className="flex max-w-sm flex-col gap-3">
        <button type="button" onClick={() => void onConfirm()} disabled={busy} className="border border-gray-500 px-3 py-1">
          {c.verify}
        </button>
        {message ? <p role="status">{message}</p> : null}
        <Link className="text-sm" href={`/${locale}/auth/login`}>
          {c.loginLink}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {c.emailLabel}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="button" onClick={() => void onResend()} disabled={busy} className="border border-gray-500 px-3 py-1">
        {c.resend}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <Link className="text-sm" href={`/${locale}/auth/login`}>
        {c.loginLink}
      </Link>
    </section>
  );
}

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await authApi.requestPasswordReset(email, locale);
    setBusy(false);
    setMessage(result.kind === 'success' ? c.generic : c.error);
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {c.emailLabel}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-gray-400 px-2 py-1"
        />
      </label>
      <button type="submit" disabled={busy} className="border border-gray-500 px-3 py-1">
        {c.requestReset}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <Link className="text-sm" href={`/${locale}/auth/login`}>
        {c.loginLink}
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const { token, ready } = useFragmentToken();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage(c.missingToken);
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setMessage(c.invalidInput);
      return;
    }
    setBusy(true);
    const result = await authApi.confirmPasswordReset(token, password);
    setBusy(false);
    setMessage(result.kind === 'success' ? c.resetDone : c.invalidLink);
  };

  if (!ready) {
    return null;
  }

  if (!token) {
    return <p>{c.missingToken}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1">
        {c.newPassword}
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
        {c.confirmReset}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <Link className="text-sm" href={`/${locale}/auth/login`}>
        {c.loginLink}
      </Link>
    </form>
  );
}
