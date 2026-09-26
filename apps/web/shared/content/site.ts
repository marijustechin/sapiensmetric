/**
 * Site identity, navigation, source references, and shared public strings.
 * English/Lithuanian labels are provided as paired objects.
 */
import type { SourceRef } from './types';

export const SITE_ORIGIN = 'https://sapiensmetric.eu';

export const SITE_NAME = 'SapiensMetric';
export const PROJECT_NAME = 'Sapiens Metric';

/**
 * Confirmed public contact address (owner-verified mailbox). Single source of
 * truth for the public `mailto:` links on the Contact/Privacy pages and footer.
 * This is NOT the SMTP sender: transactional email uses `SMTP_FROM`
 * (`website@sapiensmetric.eu`) from the environment; do not change SMTP config.
 */
export const PUBLIC_CONTACT_EMAIL = 'info@sapiensmetric.eu';

export function mailtoHref(email: string = PUBLIC_CONTACT_EMAIL): string {
  return `mailto:${email}`;
}

/**
 * Public availability statement. SapiensMetric has no released assessments;
 * every public page repeats this honestly.
 */
export const AVAILABILITY_NOTE: Record<'en' | 'lt', string> = {
  en: 'SapiensMetric assessments are not available yet. This website currently offers educational material about assessments.',
  lt: 'SapiensMetric vertinimai dar neprieinami. Ši svetainė šiuo metu siūlo mokomąją medžiagą apie vertinimus.',
};

/**
 * Pre-publication inputs that are not yet confirmed (never invented).
 * The monitored public contact address is now confirmed
 * (`PUBLIC_CONTACT_EMAIL`); operator identity and retention/consent remain open.
 */
export const PRE_PUBLICATION_INPUTS: Record<'en' | 'lt', string[]> = {
  en: [
    'Operator identity and legal/registration details.',
    'Data-retention and consent specifics for account data (see Privacy).',
  ],
  lt: [
    'Operatoriaus tapatybė ir teisinė registracijos informacija.',
    'Duomenų saugojimo ir sutikimo detalės paskyros duomenims (žr. Privatumą).',
  ],
};

/** Reused, already-recorded authoritative sources (see docs/research-sources.md). */
export const SOURCES: Record<string, SourceRef> = {
  'S-001': {
    id: 'S-001',
    label:
      'AERA, APA & NCME (2014). Standards for Educational and Psychological Testing.',
    url: 'https://www.testingstandards.net/open-access-files.html',
    accessed: '2026-09-09',
  },
  'S-002': {
    id: 'S-002',
    label:
      'International Test Commission (2017). ITC Guidelines for Translating and Adapting Tests (2nd ed.).',
    url: 'https://www.intestcom.org/files/guideline_test_adaptation_2ed.pdf',
    accessed: '2026-09-09',
  },
  'S-004': {
    id: 'S-004',
    label:
      'McGrew, K. S. (2009). CHC theory and the human cognitive abilities project. Intelligence, 37(1), 1–10.',
    url: 'https://doi.org/10.1016/j.intell.2008.08.004',
    accessed: '2026-09-09',
  },
};

export interface NavItem {
  key: 'home' | 'assessmentGuide' | 'articles' | 'understandingResults' | 'about';
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', path: '' },
  { key: 'assessmentGuide', path: 'assessment-guide' },
  { key: 'articles', path: 'articles' },
  { key: 'understandingResults', path: 'understanding-results' },
  { key: 'about', path: 'about' },
];

export const NAV_LABELS: Record<'en' | 'lt', Record<NavItem['key'], string>> = {
  en: {
    home: 'Home',
    assessmentGuide: 'Assessment guide',
    articles: 'Articles',
    understandingResults: 'Understanding results',
    about: 'About',
  },
  lt: {
    home: 'Pradžia',
    assessmentGuide: 'Vertinimų vadovas',
    articles: 'Straipsniai',
    understandingResults: 'Kaip suprasti rezultatus',
    about: 'Apie',
  },
};

export const UI_STRINGS: Record<
  'en' | 'lt',
  {
    siteTagline: string;
    switchLocale: string;
    account: string;
    admin: string;
    contact: string;
    privacy: string;
    emailUs: string;
    footerIdentity: string;
    articles: string;
    articlesTitle: string;
    articlesDescription: string;
    related: string;
    sources: string;
    updated: string;
    notFoundTitle: string;
    notFoundIntro: string;
    backHome: string;
  }
> = {
  en: {
    siteTagline: 'Educational material about assessments',
    switchLocale: 'Lietuviškai',
    account: 'Account',
    admin: 'Admin',
    contact: 'Contact',
    privacy: 'Privacy',
    emailUs: 'Email us',
    footerIdentity:
      'SapiensMetric — a developing assessment project. No assessments are released yet.',
    articles: 'Articles',
    articlesTitle: 'Articles',
    articlesDescription:
      'Short, original explanations of assessment concepts that are easy to confuse.',
    related: 'Related',
    sources: 'Sources',
    updated: 'Last reviewed',
    notFoundTitle: 'Page not found',
    notFoundIntro:
      'The page you requested does not exist. Try the home page or the assessment guide.',
    backHome: 'Back to home',
  },
  lt: {
    siteTagline: 'Mokomoji medžiaga apie vertinimus',
    switchLocale: 'English',
    account: 'Paskyra',
    admin: 'Administravimas',
    contact: 'Kontaktai',
    privacy: 'Privatumas',
    emailUs: 'Rašykite mums',
    footerIdentity:
      'SapiensMetric — besivystantis vertinimo projektas. Vertinimai dar nepaleisti.',
    articles: 'Straipsniai',
    articlesTitle: 'Straipsniai',
    articlesDescription:
      'Trumpi, originalūs paaiškinimai apie vertinimų sąvokas, kurias lengva supainioti.',
    related: 'Susiję',
    sources: 'Šaltiniai',
    updated: 'Paskutinį kartą peržiūrėta',
    notFoundTitle: 'Puslapis nerastas',
    notFoundIntro:
      'Prašomas puslapis neegzistuoja. Bandykite pradžios puslapį arba vertinimų vadovą.',
    backHome: 'Atgal į pradžią',
  },
};

/** Public route paths per locale for sitemap/hreflang generation. */
export function publicPagePaths(): string[] {
  return ['', 'assessment-guide', 'understanding-results', 'about', 'contact', 'privacy'];
}
