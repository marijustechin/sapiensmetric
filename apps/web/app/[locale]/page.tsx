import { getTranslations } from 'next-intl/server';
import { Link } from '../../shared/i18n/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-bold">Sapiens Metric</h1>
      <p className="mt-4">{t('description')}</p>
      <ul className="mt-6 flex flex-col gap-2">
        <li>
          <Link href="/auth/login">{nav('login')}</Link>
        </li>
        <li>
          <Link href="/auth/register">{nav('register')}</Link>
        </li>
        <li>
          <Link href="/auth/verify-email">{nav('verify')}</Link>
        </li>
        <li>
          <Link href="/auth/forgot-password">{nav('forgot')}</Link>
        </li>
        <li>
          <Link href="/account">{nav('account')}</Link>
        </li>
      </ul>
    </section>
  );
}
