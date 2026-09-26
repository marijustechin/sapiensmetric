import type { Metadata } from 'next';
import { ContentPage } from '../../../../shared/ui/content-page';
import { ArticleList } from '../../../../shared/ui/article-list';
import { PAGES } from '../../../../shared/content/pages';
import { buildPageMetadata } from '../../../../shared/content/seo';
import type { AppLocale } from '../../../../shared/lib/locale-navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(
    PAGES[locale as AppLocale]['assessment-guide'],
    locale as AppLocale,
  );
}

export default async function AssessmentGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  return (
    <ContentPage page={PAGES[appLocale]['assessment-guide']} locale={appLocale}>
      <ArticleList locale={appLocale} />
    </ContentPage>
  );
}
