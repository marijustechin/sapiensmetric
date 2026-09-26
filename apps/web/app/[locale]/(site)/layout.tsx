import type { ReactNode } from 'react';
import { SiteShell } from '../../../widgets/site-shell/site-shell';
import type { AppLocale } from '../../../shared/lib/locale-navigation';

/**
 * Public site area: educational pages and articles. The route `locale` param is
 * passed explicitly to the shell because, with `output: 'export'` and no
 * proxy/middleware, server-side locale lookups fall back to the default.
 */
export default async function SiteAreaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SiteShell locale={locale as AppLocale}>{children}</SiteShell>;
}
