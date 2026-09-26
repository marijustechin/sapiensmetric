import type { ReactNode } from 'react';
import { AuthProvider } from '../../../features/auth/auth-provider';
import { AppShell } from '../../../widgets/app-shell/app-shell';

/**
 * Authenticated application area (auth, account, admin). Public content pages
 * live in the `(site)` group and do not need the auth provider or the app shell.
 */
export default function AppAreaLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
