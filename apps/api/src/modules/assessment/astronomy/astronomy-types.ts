/**
 * Astronomy draft-bank types (T-022).
 *
 * Server-only. The bank is a repository-managed, bilingual (EN/LT) set of
 * **draft** items that extends the four response kinds supported by
 * `@sapiensmetric/assessment`. Client-safe projections are produced elsewhere
 * (`astronomy-feedback.ts`) and never include answer keys for in-progress work.
 */

export interface LocalizedText {
  en: string;
  lt: string;
}

export type BankItemKind =
  | 'single-answer'
  | 'multiple-select'
  | 'ordering'
  | 'numeric';

/** Editorial difficulty estimate — NOT a calibrated measurement. */
export type EditorialDifficulty = 'foundational' | 'intermediate' | 'advanced';

export type ReviewOutcome = 'unreviewed' | 'approved' | 'invalidated';

export interface BankOption {
  id: string;
  text: LocalizedText;
}

export interface DistractorRationale {
  optionId: string;
  reason: LocalizedText;
}

/**
 * Independent review evidence. An approval is bound to the exact content it
 * reviewed via `contentHash`; if the reviewable content later changes, the
 * approval is no longer current (see `astronomy-review.ts`).
 */
export interface ReviewEvidence {
  reviewer: string;
  role: 'content' | 'language';
  date: string;
  scope: string;
  reference: string;
  contentHash: string;
}

export interface BankProvenance {
  author: string;
  rights: string;
  notes: string;
}

export interface BankItem {
  itemId: string;
  itemVersion: string;
  /** Owner topic number (1-25). */
  topic: number;
  topicSlug: string;
  objectiveId: string;
  kind: BankItemKind;
  languageScope: 'neutral' | 'en' | 'lt';
  translationVersion: string;
  difficulty: EditorialDifficulty;
  /** Why understanding this subject helps make sense of the world. */
  relevance: LocalizedText;
  prompt: LocalizedText;
  options: BankOption[];
  /** Correct option id (single-answer and multiple-select handling). */
  correctOptionIds: string[];
  explanation: LocalizedText;
  distractorRationales: DistractorRationale[];
  /** Source ids resolved from `ASTRONOMY_SOURCES`. */
  sources: string[];
  provenance: BankProvenance;
  reviewStatus: { content: ReviewOutcome; language: ReviewOutcome };
  reviews: { content: ReviewEvidence | null; language: ReviewEvidence | null };
}

export interface BankObjective {
  objectiveId: string;
  title: LocalizedText;
  /** Topic numbers mapped to this objective. */
  topics: number[];
}

export interface BankSource {
  id: string;
  label: string;
  url: string;
  accessed: string;
  /** Whether the drafting session actually opened this source. */
  checked: boolean;
}
