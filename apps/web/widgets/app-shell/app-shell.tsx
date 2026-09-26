import type { ReactNode } from 'react';
import { AuthNav } from '../auth-nav/auth-nav';

/**
 * Application shell (widget).
 *
 * Composes the shared header/navigation and the main content region. It is
 * invoked by the localized root layout so `app/` stays route composition only.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AuthNav />
      <main className="p-8">{children}</main>
    </div>
  );
}
