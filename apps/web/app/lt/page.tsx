import Link from 'next/link';

export default function Page() {
  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-bold">Sapiens Metric</h1>
      <p className="mt-4">
        Lokalus autentifikavimo testavimo priekis. Vertinimas kol kas
        nesiūlomas.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        <li>
          <Link href="/lt/auth/login">Prisijungti</Link>
        </li>
        <li>
          <Link href="/lt/auth/register">Registruotis</Link>
        </li>
        <li>
          <Link href="/lt/auth/verify-email">Patvirtinti el. paštą</Link>
        </li>
        <li>
          <Link href="/lt/auth/forgot-password">Pamiršau slaptažodį</Link>
        </li>
        <li>
          <Link href="/lt/account">Paskyra</Link>
        </li>
      </ul>
    </section>
  );
}
