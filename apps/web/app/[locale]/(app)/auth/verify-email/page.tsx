import { getTranslations } from 'next-intl/server';
import { VerifyEmailForm } from '../../../../../features/auth/auth-forms';
import { noindexMetadata } from '../../../../../shared/content/seo';
export const metadata = noindexMetadata('Verify email');

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.title' });

  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">{t('verifyEmail')}</h1>
      <VerifyEmailForm />
    </section>
  );
}
