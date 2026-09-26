/**
 * Pure admin filter/pagination helpers (T-012 UX follow-up).
 *
 * Kept dependency-free (type-only imports) so they run under the built-in Node
 * test runner: automatic filter application, page reset, reset semantics, a
 * stale-response request gate, and a debounced runner.
 */
import type {
  UserListQuery,
  UserRole,
  UserStatus,
} from '../../entities/user/model/types';

export const SEARCH_DEBOUNCE_MS = 300;
export const ADMIN_PAGE_SIZE = 10;

export interface AdminFilterValues {
  search: string;
  role: UserRole | '';
  status: UserStatus | '';
  verified: '' | 'true' | 'false';
}

export interface AdminFilterState {
  filters: AdminFilterValues;
  page: number;
}

export const INITIAL_ADMIN_FILTERS: AdminFilterValues = {
  search: '',
  role: '',
  status: '',
  verified: '',
};

export function initialFilterState(): AdminFilterState {
  return { filters: { ...INITIAL_ADMIN_FILTERS }, page: 1 };
}

/** Apply a filter patch immediately and reset pagination to page 1. */
export function changeFilter(
  state: AdminFilterState,
  patch: Partial<AdminFilterValues>,
): AdminFilterState {
  return { filters: { ...state.filters, ...patch }, page: 1 };
}

/** Clear all filters and return to the first page. */
export function resetFilterState(): AdminFilterState {
  return initialFilterState();
}

export function buildUserListQuery(
  filters: AdminFilterValues,
  page: number,
  pageSize: number = ADMIN_PAGE_SIZE,
): UserListQuery {
  return {
    search: filters.search.trim(),
    role: filters.role,
    status: filters.status,
    verified: filters.verified,
    page,
    pageSize,
    sort: 'createdAt',
    order: 'desc',
  };
}

/**
 * Monotonic request gate: only the most recently begun request may apply its
 * result, so a slow response cannot overwrite newer filter results.
 */
export interface RequestGate {
  begin(): number;
  isCurrent(id: number): boolean;
}

export function createRequestGate(): RequestGate {
  let latest = 0;
  return {
    begin(): number {
      latest += 1;
      return latest;
    },
    isCurrent(id: number): boolean {
      return id === latest;
    },
  };
}

export interface Scheduler {
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface DebouncedRunner {
  schedule(fn: () => void): void;
  cancel(): void;
  isPending(): boolean;
}

/** Debounce helper; the scheduler is injected so it is unit-testable. */
export function createDebouncedRunner(
  scheduler: Scheduler,
  delayMs: number,
): DebouncedRunner {
  let handle: number | null = null;
  return {
    schedule(fn: () => void): void {
      if (handle !== null) {
        scheduler.clearTimeout(handle);
      }
      handle = scheduler.setTimeout(() => {
        handle = null;
        fn();
      }, delayMs);
    },
    cancel(): void {
      if (handle !== null) {
        scheduler.clearTimeout(handle);
        handle = null;
      }
    },
    isPending(): boolean {
      return handle !== null;
    },
  };
}
