'use client';

import { useEffect } from 'react';
import { resolveRootTargetFromStorage } from '../../shared/lib/locale-preference';
import { LoadingScreen } from '../../shared/ui/loading-screen';

/**
 * Root-route locale redirect (feature).
 *
 * On a JavaScript-enabled first paint it reads the local language preference
 * (localStorage) and replaces the location with the matching locale route:
 * a stored `lt` -> `/lt/`, a stored `en` -> `/en/`, and no stored preference
 * -> `/en/` (the default).
 *
 * A zero-delay meta refresh is deliberately **not** used as the normal
 * mechanism: it would always win with `/en/` and defeat a remembered `lt`
 * preference. There is no language chooser and no visible placeholder copy —
 * only the shared centred loading state. With JavaScript disabled that state
 * remains, plus a documented English fallback link.
 */
export function RootLocaleRedirect() {
  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    window.location.replace(resolveRootTargetFromStorage(storage));
  }, []);

  return (
    <LoadingScreen>
      <noscript>
        <p className="text-sm text-gray-600">
          JavaScript is disabled.{' '}
          <a className="underline" href="/en/">
            Continue in English
          </a>
          .
        </p>
      </noscript>
    </LoadingScreen>
  );
}
