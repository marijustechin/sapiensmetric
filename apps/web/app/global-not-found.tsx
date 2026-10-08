import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SITE_ICONS, SITE_MANIFEST } from '../shared/branding/icon-metadata';

/**
 * Global 404 page (T-013; icons T-018; valid document T-020).
 *
 * This app intentionally has no `app/layout.tsx`: the localized surface uses two
 * root layouts (`app/[locale]` and `app/(root)`), so an ordinary
 * `app/not-found.tsx` was rendered *inside* Next.js's default document while also
 * emitting its own `<html>/<head>/<body>` — a nested, invalid document. For a
 * multi-root-layout app the documented mechanism is `app/global-not-found.tsx`
 * (enabled via `experimental.globalNotFound`), which must return the complete
 * document. The page/device icon set and manifest come from the shared constants,
 * so the 404 carries the same icons as the rest of the site.
 *
 * Kept dependency-free (no locale/i18n context) and honest about the project's
 * status; the copy is intentionally bilingual.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'The page you requested does not exist. SapiensMetric is a developing assessment project.',
  icons: SITE_ICONS,
  manifest: SITE_MANIFEST,
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-slate-700">
            The page you requested does not exist. SapiensMetric is a developing
            assessment project; the public site currently offers educational
            material about assessments.
          </p>
          <nav aria-label="Page not found links" className="flex flex-wrap gap-4 text-sm">
            <Link className="underline" href="/">
              Home / language chooser
            </Link>
            <Link className="underline" href="/en/">
              English
            </Link>
            <Link className="underline" href="/lt/">
              Lietuvių
            </Link>
          </nav>
          <p className="text-sm text-slate-500">
            Puslapis nerastas. Grįžkite į pradžią arba pasirinkite kalbą.
          </p>
        </main>
      </body>
    </html>
  );
}
