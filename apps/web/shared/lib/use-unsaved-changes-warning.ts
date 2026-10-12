'use client';

import { useEffect } from 'react';

/**
 * Native browser warning for closing or reloading a tab with unsaved work
 * (T-022 UX follow-up).
 *
 * A custom in-page dialog **cannot** intercept tab close/reload, so this keeps
 * the browser's own `beforeunload` prompt as the last-resort protection. In-page
 * confirmations (discard/reload/merge/submission) use `shared/ui/confirm-dialog`
 * instead; this hook only covers the browser-level navigation case.
 */
export function useUnsavedChangesWarning(active: boolean): void {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const handler = (event: BeforeUnloadEvent) => {
      // Most browsers ignore the custom text but require returnValue to be set.
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
