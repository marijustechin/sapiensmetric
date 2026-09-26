import test from 'node:test';
import assert from 'node:assert/strict';
import { createSingleFlight } from './single-flight.ts';

test('coalesces concurrent runs into one invocation', async () => {
  const single = createSingleFlight<number>();
  let calls = 0;
  const run = () => {
    calls += 1;
    return new Promise<number>((resolve) => setTimeout(() => resolve(7), 10));
  };
  const [a, b] = await Promise.all([single(run), single(run)]);
  assert.equal(a, 7);
  assert.equal(b, 7);
  assert.equal(calls, 1);
});

test('starts a fresh run after completion', async () => {
  const single = createSingleFlight<string>();
  let calls = 0;
  const run = () => {
    calls += 1;
    return Promise.resolve(`run-${calls}`);
  };
  assert.equal(await single(run), 'run-1');
  assert.equal(await single(run), 'run-2');
  assert.equal(calls, 2);
});

test('clears after rejection so a retry can run', async () => {
  const single = createSingleFlight<void>();
  let calls = 0;
  const failing = () => {
    calls += 1;
    return Promise.reject(new Error('boom'));
  };
  await assert.rejects(single(failing));
  await assert.rejects(single(failing));
  assert.equal(calls, 2);
});
