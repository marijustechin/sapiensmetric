import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answeredCount,
  clearAnswer,
  dirtyEntries,
  hasPendingChanges,
  moveWithin,
  orderingFor,
  pendingEntries,
  sameResponse,
  setAnswer,
  toDraft,
} from './assessment-answers.ts';
import type {
  ItemResponseDto,
  PublicAssessmentItem,
} from './assessment-types.ts';

test('toDraft drops skipped entries and keeps answers', () => {
  const draft = toDraft([
    { itemId: 'a', response: { kind: 'single-answer', selectedOptionId: 's1' } },
    { itemId: 'b', response: { kind: 'skipped' } },
  ]);
  assert.deepEqual(Object.keys(draft), ['a']);
  assert.equal(draft.a.kind, 'single-answer');
});

test('sameResponse is key-order independent for multiple-select and ordering', () => {
  assert.ok(
    sameResponse(
      { kind: 'multiple-select', selectedOptionIds: ['a', 'b'] },
      { kind: 'multiple-select', selectedOptionIds: ['b', 'a'] },
    ),
  );
  assert.ok(
    sameResponse(
      { kind: 'ordering', orderedOptionIds: ['p', 'q', 'r'] },
      { kind: 'ordering', orderedOptionIds: ['p', 'q', 'r'] },
    ),
  );
  assert.equal(
    sameResponse(
      { kind: 'ordering', orderedOptionIds: ['p', 'q', 'r'] },
      { kind: 'ordering', orderedOptionIds: ['r', 'p', 'q'] },
    ),
    false,
  );
});

test('dirtyEntries expresses a cleared answer as skipped and ignores unchanged/existing-skipped', () => {
  const saved = toDraft([
    { itemId: 'a', response: { kind: 'single-answer', selectedOptionId: 's1' } },
  ]);
  const cleared = clearAnswer(saved, 'a');
  assert.deepEqual(dirtyEntries(cleared, saved), [
    { itemId: 'a', response: { kind: 'skipped' } },
  ]);

  // Clearing an item that was never answered is not a change.
  assert.deepEqual(
    dirtyEntries(clearAnswer({}, 'z'), {}),
    [],
  );
});

test('pendingEntries only includes participant-edited items', () => {
  const saved = toDraft([
    { itemId: 'a', response: { kind: 'single-answer', selectedOptionId: 's1' } },
  ]);
  let draft = setAnswer(saved, 'a', {
    kind: 'single-answer',
    selectedOptionId: 's2',
  });
  draft = setAnswer(draft, 'b', { kind: 'numeric', value: 42 });
  // Both differ from `saved`, but only `a` was actually edited by the user.
  assert.deepEqual(pendingEntries(draft, saved, ['a']), [
    { itemId: 'a', response: { kind: 'single-answer', selectedOptionId: 's2' } },
  ]);
  assert.equal(hasPendingChanges(draft, saved, ['a']), true);
  assert.equal(hasPendingChanges(saved, saved, ['a']), false);
});

test('answeredCount counts concrete answers only', () => {
  const draft = {
    a: { kind: 'single-answer', selectedOptionId: 's1' } as ItemResponseDto,
    b: { kind: 'skipped' } as ItemResponseDto,
  };
  assert.equal(answeredCount(draft), 1);
});

test('orderingFor defaults to the served option order', () => {
  const item: PublicAssessmentItem = {
    itemId: 'o',
    itemVersion: '1',
    objectiveId: 'obj',
    languageScope: 'neutral',
    translationVersion: '1',
    kind: 'ordering',
    optionIds: ['p', 'q', 'r'],
  };
  assert.deepEqual(orderingFor({}, item), ['p', 'q', 'r']);
  assert.deepEqual(
    orderingFor({ o: { kind: 'ordering', orderedOptionIds: ['r', 'p', 'q'] } }, item),
    ['r', 'p', 'q'],
  );
});

test('moveWithin reorders without mutating the input', () => {
  const list = ['a', 'b', 'c'];
  assert.deepEqual(moveWithin(list, 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(moveWithin(list, 2, 1), ['a', 'c', 'b']);
  assert.deepEqual(list, ['a', 'b', 'c']);
  assert.deepEqual(moveWithin(list, 5, 0), list);
});
