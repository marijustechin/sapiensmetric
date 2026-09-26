import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUserListQuery,
  changeFilter,
  createDebouncedRunner,
  createRequestGate,
  initialFilterState,
  resetFilterState,
  type Scheduler,
} from './admin-filters.ts';

test('initial filter state is empty on page 1', () => {
  const state = initialFilterState();
  assert.deepEqual(state.filters, { search: '', role: '', status: '', verified: '' });
  assert.equal(state.page, 1);
});

test('applying any filter resets pagination to page 1', () => {
  const onPage3 = { ...initialFilterState(), page: 3 };
  for (const patch of [
    { search: 'a' },
    { role: 'admin' as const },
    { status: 'suspended' as const },
    { verified: 'true' as const },
  ]) {
    const next = changeFilter(onPage3, patch);
    assert.equal(next.page, 1, `patch ${JSON.stringify(patch)} must reset page`);
  }
  assert.equal(changeFilter(onPage3, { role: 'editor' }).filters.role, 'editor');
});

test('reset clears all filters and pending search state', () => {
  const dirty = {
    filters: { search: 'x', role: 'admin' as const, status: 'suspended' as const, verified: 'false' as const },
    page: 4,
  };
  assert.deepEqual(resetFilterState(), initialFilterState());
  assert.equal(resetFilterState().page, 1);
  assert.notDeepEqual(resetFilterState().filters, dirty.filters);
});

test('buildUserListQuery trims search and carries filters/pagination', () => {
  const query = buildUserListQuery(
    { search: '  ann  ', role: 'user', status: 'active', verified: 'true' },
    2,
    10,
  );
  assert.equal(query.search, 'ann');
  assert.equal(query.role, 'user');
  assert.equal(query.status, 'active');
  assert.equal(query.verified, 'true');
  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 10);
  assert.equal(query.sort, 'createdAt');
  assert.equal(query.order, 'desc');
});

test('the request gate discards stale responses', () => {
  const gate = createRequestGate();
  const first = gate.begin();
  assert.equal(gate.isCurrent(first), true);
  const second = gate.begin();
  assert.equal(gate.isCurrent(first), false, 'older request must be stale');
  assert.equal(gate.isCurrent(second), true);
});

function fakeScheduler() {
  let nextId = 1;
  const timers = new Map<number, () => void>();
  const scheduler: Scheduler = {
    setTimeout(fn) {
      const id = nextId++;
      timers.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  return {
    scheduler,
    runAll() {
      const fns = [...timers.values()];
      timers.clear();
      for (const fn of fns) fn();
    },
    cancelCount() {
      return timers.size;
    },
  };
}

test('debounced runner only executes the latest scheduled call', () => {
  const fake = fakeScheduler();
  const runner = createDebouncedRunner(fake.scheduler, 300);
  const calls: string[] = [];
  runner.schedule(() => calls.push('first'));
  runner.schedule(() => calls.push('second'));
  assert.equal(runner.isPending(), true);
  assert.equal(fake.cancelCount(), 1, 'the first timer must have been cleared');
  fake.runAll();
  assert.deepEqual(calls, ['second']);
  assert.equal(runner.isPending(), false);
});

test('debounced runner cancel clears the pending call', () => {
  const fake = fakeScheduler();
  const runner = createDebouncedRunner(fake.scheduler, 300);
  let called = false;
  runner.schedule(() => {
    called = true;
  });
  runner.cancel();
  assert.equal(runner.isPending(), false);
  fake.runAll();
  assert.equal(called, false);
});
