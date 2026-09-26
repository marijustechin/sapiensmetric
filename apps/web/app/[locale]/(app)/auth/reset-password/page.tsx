import { getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '../../../../../features/auth/auth-forms';
import { noindexMetadata } from '../../../../../shared/content/seo';
export const metadata = noindexMetadata('Reset password');

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.title' });

  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">{t('resetPassword')}</h1>
      <ResetPasswordForm />
    </section>
  );
}
