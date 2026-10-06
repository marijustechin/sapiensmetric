'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Client-side selection of the active attempt via the `?attempt=<id>` query
 * parameter, without `useSearchParams` (which would force a Suspense boundary in
 * the prerendered static export). The value is read on mount and on `popstate`;
 * `selectAttempt` updates the URL with `history.replaceState`, preserving the
 * locale prefix and any other parameters.
 *
 * No attempt identifier is ever read by analytics: the authenticated app area
 * does not load GTM/GA4, and the analytics helpers sanitise query strings.
 */
export function useAttemptParam(): {
  attemptId: string | null;
  selectAttempt: (id: string | null) => void;
} {
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search);
      const value = params.get('attempt');
      setAttemptId(value && value.length > 0 ? value : null);
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const selectAttempt = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set('attempt', id);
    } else {
      url.searchParams.delete('attempt');
    }
    window.history.replaceState(window.history.state, '', url.toString());
    setAttemptId(id);
  }, []);

  return { attemptId, selectAttempt };
}
