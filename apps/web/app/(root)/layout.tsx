import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_ICONS, SITE_MANIFEST } from '../../shared/branding/icon-metadata';
import '../globals.css';

/**
 * Root layout for the non-localized root route `/`.
 *
 * `/` is a redirect to the default locale (`en/`), not a chooser. The localized
 * surface lives under `app/[locale]/` with its own root layout (so `<html lang>`
 * follows the active locale). This app intentionally has no `app/layout.tsx`.
 */
export const metadata: Metadata = {
  title: 'Sapiens Metric',
  description: 'Sapiens Metric',
  // Browser/device icon set + manifest, from their stable public paths (T-018).
  icons: SITE_ICONS,
  manifest: SITE_MANIFEST,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
