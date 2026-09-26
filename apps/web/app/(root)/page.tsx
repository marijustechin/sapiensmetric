'use client';

import { useEffect } from 'react';
import { resolveRootTargetFromStorage } from '../../lib/locale-preference';

/**
 * Root route `/`.
 *
 * On a JavaScript-enabled first paint it reads the local language preference
 * (localStorage) and replaces the location with the matching locale route:
 * a stored `lt` -> `/lt/`, a stored `en` -> `/en/`, and no stored preference
 * -> `/en/` (the default).
 *
 * A zero-delay meta refresh is deliberately **not** used as the normal
 * mechanism: it would always win with `/en/` and defeat a remembered `lt`
 * preference. There is no language chooser and no visible placeholder copy —
 * only a full-page, centred loading state. With JavaScript disabled that state
 * remains, plus a documented English fallback link.
 */
export default function RootRedirectPage() {
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <span
          aria-hidden="true"
          className="block h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
        />
      </div>
      <noscript>
        <p className="text-sm text-gray-600">
          JavaScript is disabled.{' '}
          <a className="underline" href="/en/">
            Continue in English
          </a>
          .
        </p>
      </noscript>
    </main>
  );
}
