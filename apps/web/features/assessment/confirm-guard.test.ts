import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmThen } from './confirm-guard.ts';

/**
 * Confirmation guard behaviour (T-022 UX follow-up): cancellation preserves
 * state (no action) and confirmation executes the action exactly once.
 */

test('cancellation runs no action and reports not-confirmed', async () => {
  let calls = 0;
  let confirmed = 0;
  const result = await confirmThen(
    true,
    async () => {
      confirmed += 1;
      return false;
    },
    () => {
      calls += 1;
    },
  );
  assert.equal(result, false);
  assert.equal(confirmed, 1);
  assert.equal(calls, 0, 'action must not run when the confirm is cancelled');
});

test('confirmation executes the action exactly once', async () => {
  let calls = 0;
  const result = await confirmThen(
    true,
    async () => true,
    () => {
      calls += 1;
    },
  );
  assert.equal(result, true);
  assert.equal(calls, 1);
});

test('no pending work runs the action without prompting', async () => {
  let prompted = 0;
  let calls = 0;
  const result = await confirmThen(
    false,
    async () => {
      prompted += 1;
      return false;
    },
    () => {
      calls += 1;
    },
  );
  assert.equal(result, true);
  assert.equal(prompted, 0, 'no prompt when there is nothing to discard');
  assert.equal(calls, 1);
});

test('awaits an async action before resolving', async () => {
  let done = false;
  await confirmThen(
    true,
    async () => true,
    async () => {
      await Promise.resolve();
      done = true;
    },
  );
  assert.equal(done, true);
});
