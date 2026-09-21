import Link from 'next/link';
import messages from '../../messages/en.json';

/**
 * Static language chooser at `/`.
 *
 * It is intentionally bilingual and stays outside the `[locale]` segment; no
 * runtime browser-language detection is performed and no cookie is set.
 */
const copy = messages.Chooser;

export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Sapiens Metric</h1>
      <p className="mt-4">{copy.prompt}</p>
      <ul className="mt-4 flex gap-6">
        <li>
          <Link href="/lt">{copy.lithuanian}</Link>
        </li>
        <li>
          <Link href="/en">{copy.english}</Link>
        </li>
      </ul>
      <p className="mt-8 text-sm text-gray-600">{copy.note}</p>
    </main>
  );
}
