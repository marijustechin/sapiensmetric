import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BRANDING } from '../../shared/branding/branding';
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
  // Supplied favicon asset, registered from its stable public path.
  icons: [{ url: BRANDING.favicon, type: 'image/webp' }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
