import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '../../../_components/auth-forms';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth.title' });

  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">{t('forgotPassword')}</h1>
      <ForgotPasswordForm />
    </section>
  );
}
