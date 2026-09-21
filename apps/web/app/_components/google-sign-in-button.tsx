'use client';

import { useEffect, useState } from 'react';
import * as authApi from '../../lib/auth-api';
import {
  googleButtonLabel,
  googleStartUrl,
  googleUnavailableNote,
} from '../../lib/google-auth';
import type { Locale } from '../../lib/auth-types';

/**
 * Navigates to the API Google start endpoint. The button is hidden while the
 * availability check is in flight and shows a clear note when Google is not
 * configured, so password authentication is never blocked by it.
 */
export function GoogleSignInButton({
  locale,
  returnTo,
}: {
  locale: Locale;
  returnTo?: string;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void authApi.googleStatus().then((result) => {
      if (active) {
        setAvailable(result.kind === 'success' ? result.data.available : false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (available === null) {
    return null;
  }

  if (!available) {
    return (
      <p className="text-sm text-gray-600">{googleUnavailableNote(locale)}</p>
    );
  }

  return (
    <a
      href={googleStartUrl(authApi.apiBaseUrl(), locale, returnTo)}
      className="border border-gray-500 px-3 py-1 text-center"
    >
      {googleButtonLabel(locale)}
    </a>
  );
}
