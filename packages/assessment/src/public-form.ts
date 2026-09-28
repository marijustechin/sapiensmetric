/**
 * Browser-safe projection of a keyed form (T-016).
 *
 * `KeyedFormSnapshot` is internal/confidential; `PublicFormSnapshot` is the
 * subset that is safe to hand to a client: option **IDs** (already shown to the
 * participant), the numeric **unit**, and version/identity metadata. It strips
 * every answer key and numeric answer.
 *
 * This is a projection helper only. Persisting, transporting, and access-control
 * for the keyed form remain the caller's responsibility.
 */

import { validateKeyedFormSnapshot } from './scoring';
import type { ItemDefinition, KeyedFormSnapshot, LanguageScope, ObjectiveDefinition } from './types';

export interface PublicItemDefinition {
  itemId: string;
  itemVersion: string;
  objectiveId: string;
  languageScope: LanguageScope;
  translationVersion: string;
  kind: ItemDefinition['kind'];
  /** Present for choice/ordering items; the IDs are shown to participants. */
  optionIds?: string[];
  /** Present for numeric items; the answer value and tolerance are omitted. */
  unit?: string;
}

export interface PublicFormSnapshot {
  assessmentId: string;
  assessmentVersion: string;
  formId: string;
  formVersion: string;
  languageScope: LanguageScope;
  translationVersion: string;
  scoringRuleVersion: string;
  objectives: ObjectiveDefinition[];
  items: PublicItemDefinition[];
}

function toPublicItem(item: ItemDefinition): PublicItemDefinition {
  const base = {
    itemId: item.itemId,
    itemVersion: item.itemVersion,
    objectiveId: item.objectiveId,
    languageScope: item.languageScope,
    translationVersion: item.translationVersion,
  };
  switch (item.kind) {
    case 'single-answer':
      return { ...base, kind: item.kind, optionIds: [...item.optionIds] };
    case 'multiple-select':
      return { ...base, kind: item.kind, optionIds: [...item.optionIds] };
    case 'ordering':
      return { ...base, kind: item.kind, optionIds: [...item.optionIds] };
    case 'numeric':
      return { ...base, kind: item.kind, unit: item.unit };
  }
}

/** Validate the keyed form and return a browser-safe projection (no answer keys). */
export function toPublicForm(form: KeyedFormSnapshot): PublicFormSnapshot {
  validateKeyedFormSnapshot(form);
  return {
    assessmentId: form.assessmentId,
    assessmentVersion: form.assessmentVersion,
    formId: form.formId,
    formVersion: form.formVersion,
    languageScope: form.languageScope,
    translationVersion: form.translationVersion,
    scoringRuleVersion: form.scoringRuleVersion,
    objectives: form.objectives.map((objective) => ({ objectiveId: objective.objectiveId })),
    items: form.items.map(toPublicItem),
  };
}
