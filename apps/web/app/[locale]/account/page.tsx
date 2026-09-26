import { getTranslations } from 'next-intl/server';
import { AccountView } from '../../../features/auth/account-view';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.title' });

  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">{t('account')}</h1>
      <AccountView />
    </section>
  );
}
