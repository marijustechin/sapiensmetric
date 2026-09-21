import type { ReactNode } from 'react';
import { AuthNav } from '../_components/auth-nav';

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AuthNav locale="lt" />
      <main className="p-8">{children}</main>
    </div>
  );
}
