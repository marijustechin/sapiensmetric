import Link from 'next/link';

/**
 * Static 404 page (T-013). Kept dependency-free (no locale/i18n context here)
 * and honest about the project's status.
 */
export default function NotFound() {
  return (
    <html lang="en">
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
