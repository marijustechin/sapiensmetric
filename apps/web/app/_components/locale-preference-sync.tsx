'use client';

import { useEffect } from 'react';
import { persistLocalePreference } from '../../lib/locale-preference';

/**
 * Persist the active locale as the local preference whenever a locale-prefixed
 * page is entered — including a direct visit to `/lt/` or `/en/`, which counts
 * as selecting that language. Client-only, localStorage only; no cookies,
 * server state, or tracking.
 */
export function LocalePreferenceSync({ locale }: { locale: string }) {
  useEffect(() => {
    try {
      persistLocalePreference(window.localStorage, locale);
    } catch {
      // localStorage unavailable; the preference is simply not persisted.
    }
  }, [locale]);

  return null;
}
