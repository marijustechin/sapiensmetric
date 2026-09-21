'use client';

import { useEffect, useState } from 'react';

export type FormLocale = 'lt' | 'en';

const COPY = {
  lt: {
    emailLabel: 'El. paštas',
    resend: 'Siųsti patvirtinimo nuorodą',
    verify: 'Patvirtinti el. pašto adresą',
    requestReset: 'Siųsti slaptažodžio atkūrimo nuorodą',
    newPassword: 'Naujas slaptažodis',
    confirmReset: 'Pakeisti slaptažodį',
    generic: 'Jei paskyra atitinka sąlygas, netrukus gausite el. laišką.',
    verified: 'El. pašto adresas patvirtintas. Galite prisijungti.',
    resetDone: 'Slaptažodis pakeistas. Galite prisijungti.',
    invalidLink: 'Nuoroda netinkama arba pasibaigusi.',
    missingToken: 'Šiai nuorodai trūksta žymens.',
    error: 'Nepavyko. Bandykite dar kartą.',
  },
  en: {
    emailLabel: 'Email',
    resend: 'Send verification link',
    verify: 'Verify email address',
    requestReset: 'Send password-reset link',
    newPassword: 'New password',
    confirmReset: 'Change password',
    generic: 'If the account is eligible, an email will arrive shortly.',
    verified: 'Email address verified. You can log in.',
    resetDone: 'Password changed. You can log in.',
    invalidLink: 'This link is invalid or has expired.',
    missingToken: 'This link is missing its token.',
    error: 'Something went wrong. Please try again.',
  },
} as const;

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
}

/** Read the token from the URL fragment only; never from a query string. */
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

async function postJson(path: string, body: unknown): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function VerifyEmailForm({ locale }: { locale: FormLocale }) {
  const c = COPY[locale];
  const { token, ready } = useFragmentToken();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onResend = async () => {
    setBusy(true);
    const ok = await postJson('/auth/email-verification/request', {
      email,
      locale,
    });
    setBusy(false);
    setMessage(ok ? c.generic : c.error);
  };

  const onConfirm = async () => {
    if (!token) {
      setMessage(c.missingToken);
      return;
    }
    setBusy(true);
    const ok = await postJson('/auth/email-verification/confirm', { token });
    setBusy(false);
    setMessage(ok ? c.verified : c.invalidLink);
  };

  if (!ready) {
    return null;
  }

  if (token) {
    return (
      <section>
        <button type="button" onClick={onConfirm} disabled={busy}>
          {c.verify}
        </button>
        {message ? <p>{message}</p> : null}
      </section>
    );
  }

  return (
    <section>
      <label>
        {c.emailLabel}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <button type="button" onClick={onResend} disabled={busy}>
        {c.resend}
      </button>
      {message ? <p>{message}</p> : null}
    </section>
  );
}

export function ForgotPasswordForm({ locale }: { locale: FormLocale }) {
  const c = COPY[locale];
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    const ok = await postJson('/auth/password-reset/request', { email, locale });
    setBusy(false);
    setMessage(ok ? c.generic : c.error);
  };

  return (
    <section>
      <label>
        {c.emailLabel}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <button type="button" onClick={onSubmit} disabled={busy}>
        {c.requestReset}
      </button>
      {message ? <p>{message}</p> : null}
    </section>
  );
}

export function ResetPasswordForm({ locale }: { locale: FormLocale }) {
  const c = COPY[locale];
  const { token, ready } = useFragmentToken();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!token) {
      setMessage(c.missingToken);
      return;
    }
    setBusy(true);
    const ok = await postJson('/auth/password-reset/confirm', {
      token,
      password,
    });
    setBusy(false);
    setMessage(ok ? c.resetDone : c.invalidLink);
  };

  if (!ready) {
    return null;
  }

  if (!token) {
    return <p>{c.missingToken}</p>;
  }

  return (
    <section>
      <label>
        {c.newPassword}
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="button" onClick={onSubmit} disabled={busy}>
        {c.confirmReset}
      </button>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
