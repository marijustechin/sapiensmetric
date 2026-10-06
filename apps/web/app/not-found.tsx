import Link from 'next/link';
import { ICONS } from '../shared/branding/branding';

/**
 * Static 404 page (T-013). Kept dependency-free (no locale/i18n context here)
 * and honest about the project's status.
 *
 * It sits outside both route groups (there is intentionally no `app/layout.tsx`;
 * see D-022), so the shared `metadata` icon set does not reach it. The page/device
 * icon and manifest links are therefore declared explicitly here (T-018), from the
 * same shared constants. React hoists these `<link>` elements into the document
 * `<head>`.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href={ICONS.faviconIco} />
        <link rel="icon" type="image/png" sizes="32x32" href={ICONS.favicon32} />
        <link rel="icon" type="image/png" sizes="16x16" href={ICONS.favicon16} />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href={ICONS.android192}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={ICONS.appleTouch}
        />
        <link rel="manifest" href={ICONS.manifest} />
      </head>
      <body>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-slate-700">
            The page you requested does not exist. SapiensMetric is a developing
            assessment project; the public site currently offers educational
            material about assessments.
          </p>
          <nav className="flex gap-4 text-sm">
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
