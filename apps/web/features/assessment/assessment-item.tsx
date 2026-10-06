'use client';

import { useTranslations } from 'next-intl';
import {
  orderingFor,
  moveWithin,
  responseFor,
  type AnswerDraft,
} from './assessment-answers';
import type { ItemResponseDto, PublicAssessmentItem } from './assessment-types';

interface AssessmentItemProps {
  item: PublicAssessmentItem;
  index: number;
  draft: AnswerDraft;
  disabled: boolean;
  onAnswer: (itemId: string, response: ItemResponseDto) => void;
  onClear: (itemId: string) => void;
}

/**
 * Renders one browser-safe item. Only option IDs are known to the client (keys
 * are never sent), so synthetic items are labelled by their identifiers. All
 * controls are native form controls, so the whole runner is keyboard-operable —
 * ordering uses explicit Move up / Move down buttons rather than drag-and-drop.
 */
export function AssessmentItem({
  item,
  index,
  draft,
  disabled,
  onAnswer,
  onClear,
}: AssessmentItemProps) {
  const t = useTranslations('Assessment');
  const response = responseFor(draft, item);
  const optionIds = item.optionIds ?? [];
  const name = `item-${item.itemId}`;
  const heading = t('itemLabel', { index, id: item.itemId });

  const answered = response.kind !== 'skipped';

  return (
    <fieldset
      className="flex flex-col gap-2 rounded border border-gray-300 p-4"
      disabled={disabled}
    >
      <legend className="px-1 text-sm font-semibold">
        {heading}
        <span className="ml-2 font-normal text-gray-600">
          {t(`kind.${item.kind}`)}
        </span>
      </legend>
      <p className="text-xs text-gray-600">
        {t('objective', { id: item.objectiveId })}
      </p>

      {item.kind === 'single-answer' ? (
        <div className="flex flex-col gap-1">
          {optionIds.map((optionId) => (
            <label key={optionId} className="flex items-center gap-2">
              <input
                type="radio"
                name={name}
                value={optionId}
                checked={
                  response.kind === 'single-answer' &&
                  response.selectedOptionId === optionId
                }
                onChange={() =>
                  onAnswer(item.itemId, {
                    kind: 'single-answer',
                    selectedOptionId: optionId,
                  })
                }
              />
              <span className="font-mono">{optionId}</span>
            </label>
          ))}
        </div>
      ) : null}

      {item.kind === 'multiple-select' ? (
        <div className="flex flex-col gap-1">
          {optionIds.map((optionId) => {
            const selected =
              response.kind === 'multiple-select' &&
              response.selectedOptionIds.includes(optionId);
            return (
              <label key={optionId} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const current =
                      response.kind === 'multiple-select'
                        ? response.selectedOptionIds
                        : [];
                    const next = selected
                      ? current.filter((id) => id !== optionId)
                      : [...current, optionId];
                    if (next.length === 0) {
                      onClear(item.itemId);
                      return;
                    }
                    onAnswer(item.itemId, {
                      kind: 'multiple-select',
                      selectedOptionIds: next,
                    });
                  }}
                />
                <span className="font-mono">{optionId}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {item.kind === 'ordering'
        ? (() => {
            const order = orderingFor(draft, item);
            return (
              <ol className="flex flex-col gap-1">
                {order.map((optionId, position) => (
                  <li
                    key={optionId}
                    className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1"
                  >
                    <span className="w-6 text-xs text-gray-600">
                      {position + 1}
                    </span>
                    <span className="font-mono">{optionId}</span>
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        aria-label={t('moveUp', { id: optionId })}
                        disabled={position === 0}
                        onClick={() =>
                          onAnswer(item.itemId, {
                            kind: 'ordering',
                            orderedOptionIds: moveWithin(order, position, position - 1),
                          })
                        }
                        className="border border-gray-400 px-2 text-sm disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={t('moveDown', { id: optionId })}
                        disabled={position === order.length - 1}
                        onClick={() =>
                          onAnswer(item.itemId, {
                            kind: 'ordering',
                            orderedOptionIds: moveWithin(order, position, position + 1),
                          })
                        }
                        className="border border-gray-400 px-2 text-sm disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            );
          })()
        : null}

      {item.kind === 'numeric' ? (
        <label className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            className="w-40 border border-gray-400 px-2 py-1"
            value={response.kind === 'numeric' ? String(response.value) : ''}
            placeholder={t('numericPlaceholder')}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw.trim() === '') {
                onClear(item.itemId);
                return;
              }
              const value = Number(raw);
              if (!Number.isFinite(value)) return;
              onAnswer(item.itemId, { kind: 'numeric', value });
            }}
          />
          {item.unit ? (
            <span className="text-sm text-gray-600">
              {t('numericUnit', { unit: item.unit })}
            </span>
          ) : null}
        </label>
      ) : null}

      <div>
        <button
          type="button"
          onClick={() => onClear(item.itemId)}
          disabled={!answered}
          className="text-sm underline disabled:opacity-40"
        >
          {t('clear')}
        </button>
      </div>
    </fieldset>
  );
}
