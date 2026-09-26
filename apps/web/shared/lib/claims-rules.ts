/**
 * Claim-screening rules (T-013).
 *
 * Two distinct rule sets, because product copy and educational content need
 * different treatment:
 *
 * - `PRODUCT_COPY_RULES` guards product UI copy (message catalogues). Product
 *   copy must not use IQ/percentile vocabulary at all.
 * - `EDUCATIONAL_CONTENT_RULES` guards public educational content. It ALLOWS
 *   accurate educational discussion of IQ and percentiles, and flags only
 *   unsupported *product* claims or invented social proof.
 *
 * These are heuristic text checks, not proof of scientific accuracy; they are a
 * safety net alongside human review.
 */

export interface ClaimRule {
  pattern: RegExp;
  reason: string;
  /** When the text matches this, the claim is treated as a negated disclaimer. */
  allowIf?: RegExp;
}

/** Strict rules for product UI copy. */
export const PRODUCT_COPY_RULES: ClaimRule[] = [
  { pattern: /\bIQ\b/i, reason: 'IQ claim — prohibited in product copy' },
  {
    pattern: /intelligence quotient/i,
    reason: 'IQ claim — prohibited in product copy',
  },
  {
    pattern: /\bpercentiles?\b/i,
    reason: 'norm-referenced claim — prohibited in product copy',
  },
  {
    pattern: /better than \d+\s?%/i,
    reason: 'norm-referenced comparison',
  },
  {
    pattern: /top \d+\s?%/i,
    reason: 'norm-referenced comparison',
  },
  {
    pattern: /\bdiagnos(e|es|ed|is|tic)\b/i,
    reason: 'clinical/diagnostic claim — prohibited',
  },
  {
    pattern: /hiring recommendation|employment recommendation|job recommendation/i,
    reason: 'hiring/selection claim',
  },
  {
    pattern: /predicts? (your |academic|job|career|work|employment|school)/i,
    reason: 'predictive validity claim',
  },
  {
    pattern: /measures? (your )?(intelligence|cognitive ability)/i,
    reason: 'construct-measurement claim',
  },
  {
    pattern: /scientifically (validated|proven)/i,
    reason: 'validation claim — prohibited until validation and norming exist',
    allowIf: /\b(not|never)\b|pre-?validation|unvalidated/i,
  },
  {
    pattern: /clinically (validated|proven)/i,
    reason: 'clinical validation claim — prohibited',
    allowIf: /\b(not|never)\b|pre-?validation|unvalidated/i,
  },
];

/**
 * Adjusted rules for educational content. Bare "IQ"/"percentile" are allowed;
 * only unsupported product claims and invented social proof are flagged.
 */
export const EDUCATIONAL_CONTENT_RULES: ClaimRule[] = [
  {
    pattern:
      /SapiensMetric[^.\n]{0,80}\b(IQ|intelligence)\b[^.\n]{0,40}\b(score|measure|estimate)\b/i,
    reason: 'product IQ/measurement claim',
  },
  {
    pattern: /\b(we|our)\b[^.\n]{0,40}\bmeasur(e|es|ing)\b[^.\n]{0,30}\b(intelligence|IQ|cognitive ability)\b/i,
    reason: 'product measurement claim',
    allowIf: /\b(not|never|no)\b/i,
  },
  {
    pattern: /\b(our|this) (assessment|test|product)[^.\n]{0,60}\b(estimates?|scores?)\b[^.\n]{0,30}\b(intelligence|IQ)\b/i,
    reason: 'product score claim',
    allowIf: /\b(not|never)\b/i,
  },
  {
    pattern: /scientifically (validated|proven)/i,
    reason: 'validation claim',
    allowIf: /\b(not|never)\b|pre-?validation|unvalidated/i,
  },
  {
    pattern: /clinically (validated|proven)/i,
    reason: 'clinical validation claim',
    allowIf: /\b(not|never)\b|pre-?validation|unvalidated/i,
  },
  {
    pattern: /\bdiagnos(e|es|ed|is|tic)\b/i,
    reason: 'clinical/diagnostic claim',
    allowIf: /\b(not|never|no)\b/i,
  },
  {
    pattern: /hiring recommendation|employment (decision|recommendation)|for recruitment/i,
    reason: 'hiring/selection claim',
  },
  {
    pattern: /\btestimonial|\btrusted by\b/i,
    reason: 'invented social proof',
  },
  {
    pattern: /\blaunch(es|ed)? on\b/i,
    reason: 'invented launch date',
  },
];

/** Returns the matched rules for a piece of text (empty when clean). */
export function evaluateClaims(text: string, rules: ClaimRule[]): ClaimRule[] {
  return rules.filter(
    (rule) => rule.pattern.test(text) && !(rule.allowIf?.test(text) ?? false),
  );
}
