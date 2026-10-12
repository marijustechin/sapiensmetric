import type { ReactNode } from 'react';
import { AuthNav } from '../auth-nav/auth-nav';
import { AppBackToTop } from './app-back-to-top';
import { ConfirmProvider } from '../../shared/ui/confirm-dialog';
import { ToastProvider } from '../../shared/ui/toast';

/**
 * Application shell (widget).
 *
 * Composes the shared header/navigation and the main content region, and
 * provides the reusable confirm-dialog and toast providers for the
 * authenticated area. It is invoked by the localized root layout so `app/` stays
 * route composition only.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div id="app-shell-root" className="min-h-screen">
          <AuthNav />
          <main className="p-8">{children}</main>
          <AppBackToTop />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
