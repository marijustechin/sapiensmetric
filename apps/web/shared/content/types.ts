/**
 * Repository-managed public content model (T-013).
 *
 * Content is plain typed data checked into the repository (no CMS/database).
 * Each public page/article has an English and a Lithuanian variant. A future
 * session edits these files and follows `docs/content.md`.
 */
import type { AppLocale } from '../lib/locale-navigation';

export type Locale = AppLocale;

export interface SourceRef {
  /** Stable id, e.g. `S-001` (see `docs/research-sources.md`). */
  id: string;
  label: string;
  url: string;
  accessed: string;
}

export interface ContentBlock {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PageContent {
  /** Route segment under the locale; empty string for the locale home. */
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  blocks: ContentBlock[];
  /** ISO date of the last editorial review. */
  updated: string;
  sources?: SourceRef[];
  /** True when the page must carry the "assessments not available" note. */
  availabilityNote?: boolean;
}

export interface ArticleContent extends PageContent {
  /** URL slug, shared across locales (see docs/content.md). */
  slug: string;
}

export type LocalizedRecord<T> = Record<Locale, T>;
