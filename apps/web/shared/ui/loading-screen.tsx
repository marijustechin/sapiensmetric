import type { ReactNode } from 'react';

/**
 * Full-page, centred loading state (shared UI).
 *
 * Visually a simple unobtrusive spinner; accessible via a polite live `status`
 * with a visually hidden "Loading" label. `children` may carry additional
 * fallback content (e.g. a `<noscript>` link) below the spinner.
 */
export function LoadingScreen({ children }: { children?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <span
          aria-hidden="true"
          className="block h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
        />
      </div>
      {children}
    </main>
  );
}
