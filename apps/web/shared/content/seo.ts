/**
 * SEO metadata builder for public content pages (T-013).
 *
 * Canonical URLs are always the production origin `https://sapiensmetric.eu`
 * (never localhost/preview). Each page declares a self-referencing canonical and
 * reciprocal EN/LT `hreflang` alternates.
 */
import type { Metadata } from 'next';
import type { PageContent } from './types';
import { SITE_ORIGIN } from './site';
import { LOCALES, DEFAULT_LOCALE, type AppLocale } from '../lib/locale-navigation';

export function canonicalUrl(locale: AppLocale, path: string): string {
  const suffix = path.length > 0 ? `/${path}/` : '/';
  return `${SITE_ORIGIN}/${locale}${suffix}`;
}

export function localizedPath(locale: AppLocale, path: string): string {
  const suffix = path.length > 0 ? `/${path}/` : '/';
  return `/${locale}${suffix}`;
}

export interface MetadataInput {
  /** Route path under the locale (e.g. `articles` or `articles/<slug>`). */
  path: string;
  title: string;
  description: string;
}

/** Build canonical/hreflang/OpenGraph metadata for a public route. */
export function buildMetadataFor(
  input: MetadataInput,
  locale: AppLocale,
): Metadata {
  const languages: Record<string, string> = {};
  for (const code of LOCALES) {
    languages[code] = canonicalUrl(code, input.path);
  }
  languages['x-default'] = canonicalUrl(DEFAULT_LOCALE, input.path);

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl(locale, input.path),
      languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl(locale, input.path),
      siteName: 'SapiensMetric',
      locale: locale === 'lt' ? 'lt_LT' : 'en_GB',
      type: 'website',
      // Absolute production URL (never localhost/preview).
      images: [{ url: `${SITE_ORIGIN}/branding/sapiens-metric-logo-dark.webp` }],
    },
  };
}

export function buildPageMetadata(
  page: PageContent,
  locale: AppLocale,
): Metadata {
  return buildMetadataFor(
    { path: page.path, title: page.title, description: page.description },
    locale,
  );
}

/** Metadata marking a non-public route as non-indexable (belt-and-braces). */
export function noindexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}
