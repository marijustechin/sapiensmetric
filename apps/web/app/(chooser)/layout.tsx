import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import messages from '../../messages/en.json';
import '../globals.css';

/**
 * Root layout for the non-localized language chooser at `/`.
 *
 * The localized surface lives under `app/[locale]/` with its own root layout
 * (so `<html lang>` can follow the active locale). This app intentionally has
 * no `app/layout.tsx`.
 */
export const metadata: Metadata = {
  title: 'Sapiens Metric',
  description: messages.Chooser.prompt,
};

export default function ChooserLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
