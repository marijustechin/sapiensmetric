import Link from 'next/link';

export default function Page() {
  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-bold">Sapiens Metric</h1>
      <p className="mt-4">
        Local authentication test frontend. No assessment is offered yet.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        <li>
          <Link href="/en/auth/login">Sign in</Link>
        </li>
        <li>
          <Link href="/en/auth/register">Register</Link>
        </li>
        <li>
          <Link href="/en/auth/verify-email">Verify email</Link>
        </li>
        <li>
          <Link href="/en/auth/forgot-password">Forgot password</Link>
        </li>
        <li>
          <Link href="/en/account">Account</Link>
        </li>
      </ul>
    </section>
  );
}
