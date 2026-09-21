import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Sapiens Metric</h1>
      <p className="mt-4">Choose a language / Pasirinkite kalbą</p>
      <ul className="mt-4 flex gap-6">
        <li>
          <Link href="/lt">Lietuvių</Link>
        </li>
        <li>
          <Link href="/en">English</Link>
        </li>
      </ul>
      <p className="mt-8 text-sm text-gray-600">
        Local development authentication frontend. No assessment is offered yet.
      </p>
    </main>
  );
}
