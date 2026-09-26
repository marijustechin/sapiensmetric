'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/auth-provider';
import { loginHref } from '../auth/auth-navigation';
import { adminApi } from './admin-api';
import { decideAdminEntry, probeFromOutcome, type AdminProbe } from './admin-access';
import {
  ADMIN_PAGE_SIZE,
  buildUserListQuery,
  changeFilter,
  createDebouncedRunner,
  createRequestGate,
  initialFilterState,
  resetFilterState,
  SEARCH_DEBOUNCE_MS,
  type AdminFilterState,
  type DebouncedRunner,
} from './admin-filters';
import { RoleBadge } from '../../entities/user/ui/role-badge';
import { StatusBadge } from '../../entities/user/ui/status-badge';
import { VerifiedBadge } from '../../entities/user/ui/verified-badge';
import { LoadingScreen } from '../../shared/ui/loading-screen';
import type { AppLocale } from '../../shared/lib/locale-navigation';
import type {
  AuditEntry,
  UserDetail,
  UserList,
  UserSummary,
  UserSummaryCounts,
} from '../../entities/user/model/types';

export function AdminScreen() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const { status, getAccessToken, retryBootstrap } = useAuth();

  const [probe, setProbe] = useState<AdminProbe>('pending');
  const [filterState, setFilterState] = useState<AdminFilterState>(initialFilterState);
  const [summary, setSummary] = useState<UserSummaryCounts | null>(null);
  const [list, setList] = useState<UserList | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  const gate = useRef(createRequestGate());
  const debouncer = useRef<DebouncedRunner | null>(null);
  if (debouncer.current === null) {
    debouncer.current = createDebouncedRunner(
      {
        setTimeout: (fn, ms) => window.setTimeout(fn, ms),
        clearTimeout: (id) => window.clearTimeout(id),
      },
      SEARCH_DEBOUNCE_MS,
    );
  }

  const load = useCallback(
    async (filters: AdminFilterState): Promise<void> => {
      const token = getAccessToken();
      if (status !== 'authenticated' || !token) {
        return;
      }
      const id = gate.current.begin();
      const summaryRes = await adminApi.summary(token);
      if (!gate.current.isCurrent(id)) return; // stale: a newer request won
      if (summaryRes.kind !== 'success') {
        setProbe(probeFromOutcome(summaryRes.kind));
        return;
      }
      const listRes = await adminApi.listUsers(
        token,
        buildUserListQuery(filters.filters, filters.page, ADMIN_PAGE_SIZE),
      );
      if (!gate.current.isCurrent(id)) return; // stale response, do not apply
      if (listRes.kind !== 'success') {
        setProbe(probeFromOutcome(listRes.kind));
        return;
      }
      setSummary(summaryRes.data);
      setList(listRes.data);
      setProbe('success');
      setNotice('');
    },
    [getAccessToken, status],
  );

  // Session bootstrap: wait for it to resolve, then probe admin access.
  useEffect(() => {
    if (status === 'authenticated') {
      setProbe('pending');
      void load(initialFilterState());
    }
  }, [status, load]);

  const appLocale = locale as AppLocale;
  const decision = decideAdminEntry({ authStatus: status, probe, locale: appLocale });
  const redirectTarget =
    decision.kind === 'sign-in'
      ? loginHref(appLocale, decision.returnTo)
      : decision.kind === 'redirect-account'
        ? decision.path
        : null;
  const lastRedirect = useRef<string | null>(null);
  useEffect(() => {
    if (redirectTarget && lastRedirect.current !== redirectTarget) {
      lastRedirect.current = redirectTarget;
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  const applyImmediately = (next: AdminFilterState) => {
    debouncer.current?.cancel();
    setFilterState(next);
    void load(next);
  };

  const onSearchChange = (value: string) => {
    const next = changeFilter(filterState, { search: value });
    setFilterState(next);
    debouncer.current?.schedule(() => {
      void load(next);
    });
  };

  const onReset = () => {
    applyImmediately(resetFilterState());
  };

  const applyAction = async (
    action: () => Promise<{ kind: string }>,
    successKey: string,
  ) => {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setNotice('');
    setNoticeIsError(false);
    const result = await action();
    setBusy(false);
    if (result.kind === 'forbidden') {
      setProbe('forbidden'); // access lost -> Account (navigation, not enforcement)
      return;
    }
    if (result.kind === 'unauthorized') {
      setProbe('unauthorized'); // invalid session -> existing login recovery
      return;
    }
    if (result.kind === 'success') {
      setNotice(t(successKey));
      await refreshDetail();
      await load(filterState);
      return;
    }
    // Action-level validation/conflict (400/409) or a transient failure: show a
    // message and keep the screen usable. Never a permission redirect.
    setNoticeIsError(true);
    setNotice(t('actionError'));
  };

  const refreshDetail = async () => {
    const token = getAccessToken();
    if (!token || !detail) return;
    const [detailRes, auditRes] = await Promise.all([
      adminApi.getUser(token, detail.id),
      adminApi.audit(token, detail.id),
    ]);
    if (detailRes.kind === 'success') setDetail(detailRes.data);
    if (auditRes.kind === 'success') setAudit(auditRes.data.items);
  };

  const selectUser = async (user: UserSummary) => {
    const token = getAccessToken();
    if (!token) return;
    setNotice('');
    const id = gate.current.begin();
    const [detailRes, auditRes] = await Promise.all([
      adminApi.getUser(token, user.id),
      adminApi.audit(token, user.id),
    ]);
    if (!gate.current.isCurrent(id)) return;
    if (detailRes.kind === 'success') setDetail(detailRes.data);
    if (auditRes.kind === 'success') setAudit(auditRes.data.items);
  };

  if (decision.kind === 'waiting' || decision.kind === 'sign-in' || decision.kind === 'redirect-account') {
    return <LoadingScreen />;
  }

  if (decision.kind === 'session-error') {
    return (
      <section className="flex max-w-md flex-col gap-3">
        <p role="alert">{t('sessionError')}</p>
        <button
          type="button"
          className="self-start rounded border border-gray-500 px-3 py-1"
          onClick={retryBootstrap}
        >
          {t('retry')}
        </button>
      </section>
    );
  }

  if (decision.kind === 'probe-error') {
    return (
      <section className="flex max-w-md flex-col gap-3">
        <p role="alert">{t('error')}</p>
        <button
          type="button"
          className="self-start rounded border border-gray-500 px-3 py-1"
          onClick={() => void load(filterState)}
        >
          {t('retry')}
        </button>
      </section>
    );
  }

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-gray-600">{t('subtitle')}</p>
      </header>

      {summary ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label={t('summary.total')} value={summary.totalUsers} />
          <SummaryCard label={t('summary.verified')} value={summary.verifiedUsers} />
          <SummaryCard label={t('summary.unverified')} value={summary.unverifiedUsers} />
          <SummaryCard label={t('summary.active')} value={summary.activeUsers} />
          <SummaryCard label={t('summary.suspended')} value={summary.suspendedUsers} />
          <SummaryCard label={t('summary.admins')} value={summary.adminUsers} />
        </dl>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('filters.search')}
          <input
            type="search"
            value={filterState.filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded border border-gray-400 px-2 py-1 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </label>
        <FilterSelect
          label={t('filters.role')}
          value={filterState.filters.role}
          onChange={(value) =>
            applyImmediately(changeFilter(filterState, { role: value as never }))
          }
          options={[
            { value: 'user', label: t('role.user') },
            { value: 'editor', label: t('role.editor') },
            { value: 'admin', label: t('role.admin') },
          ]}
          allLabel={t('filters.all')}
        />
        <FilterSelect
          label={t('filters.status')}
          value={filterState.filters.status}
          onChange={(value) =>
            applyImmediately(changeFilter(filterState, { status: value as never }))
          }
          options={[
            { value: 'active', label: t('status.active') },
            { value: 'suspended', label: t('status.suspended') },
          ]}
          allLabel={t('filters.all')}
        />
        <FilterSelect
          label={t('filters.verified')}
          value={filterState.filters.verified}
          onChange={(value) =>
            applyImmediately(changeFilter(filterState, { verified: value as never }))
          }
          options={[
            { value: 'true', label: t('verified.yes') },
            { value: 'false', label: t('verified.no') },
          ]}
          allLabel={t('filters.all')}
        />
        <button
          type="button"
          className="rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          onClick={onReset}
        >
          {t('filters.reset')}
        </button>
      </div>

      {notice ? (
        <p role={noticeIsError ? 'alert' : 'status'} className="text-sm">
          {notice}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-4">{t('table.email')}</th>
              <th className="py-2 pr-4">{t('table.role')}</th>
              <th className="py-2 pr-4">{t('table.status')}</th>
              <th className="py-2 pr-4">{t('table.verified')}</th>
              <th className="py-2 pr-4">{t('table.created')}</th>
              <th className="py-2">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {list && list.items.length > 0 ? (
              list.items.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{user.email}</td>
                  <td className="py-2 pr-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="py-2 pr-4">
                    <VerifiedBadge verified={user.emailVerified} />
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="rounded border border-gray-400 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                      onClick={() => void selectUser(user)}
                    >
                      {t('table.view')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 text-gray-600" colSpan={6}>
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {list ? (
        <nav className="flex items-center gap-3 text-sm">
          <button
            type="button"
            disabled={filterState.page <= 1}
            className="rounded border border-gray-400 px-3 py-1 disabled:opacity-50"
            onClick={() => {
              const next = { ...filterState, page: Math.max(1, filterState.page - 1) };
              applyImmediately(next);
            }}
          >
            {t('pagination.previous')}
          </button>
          <span>{t('pagination.page', { page: filterState.page, total: totalPages })}</span>
          <button
            type="button"
            disabled={filterState.page >= totalPages}
            className="rounded border border-gray-400 px-3 py-1 disabled:opacity-50"
            onClick={() => {
              const next = {
                ...filterState,
                page: Math.min(totalPages, filterState.page + 1),
              };
              applyImmediately(next);
            }}
          >
            {t('pagination.next')}
          </button>
        </nav>
      ) : null}

      {detail ? (
        <section className="flex max-w-2xl flex-col gap-3 rounded border border-gray-200 p-4">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t('detail.title')}</h2>
            <button type="button" className="text-sm underline" onClick={() => setDetail(null)}>
              {t('detail.close')}
            </button>
          </header>
          <p className="font-mono text-sm">{detail.email}</p>
          <p className="flex flex-wrap items-center gap-2">
            <RoleBadge role={detail.role} />
            <StatusBadge status={detail.status} />
            <VerifiedBadge verified={detail.emailVerified} />
          </p>
          <p className="text-sm text-gray-600">
            {t('detail.providers')}:{' '}
            {detail.providers.length > 0 ? detail.providers.join(', ') : t('detail.none')}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">
              {t('actions.changeRole')}
              <select
                value={detail.role}
                disabled={busy}
                className="ml-2 rounded border border-gray-400 px-2 py-1"
                onChange={(e) => {
                  const role = e.target.value as UserDetail['role'];
                  if (!window.confirm(t('actions.confirmRole', { role }))) return;
                  void applyAction(
                    () => adminApi.changeRole(getAccessToken()!, detail.id, role),
                    'actions.roleUpdated',
                  );
                }}
              >
                <option value="user">{t('role.user')}</option>
                <option value="editor">{t('role.editor')}</option>
                <option value="admin">{t('role.admin')}</option>
              </select>
            </label>
            {detail.status === 'active' ? (
              <button
                type="button"
                disabled={busy}
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-700"
                onClick={() => {
                  if (!window.confirm(t('actions.confirmSuspend'))) return;
                  void applyAction(
                    () => adminApi.changeStatus(getAccessToken()!, detail.id, 'suspended'),
                    'actions.suspended',
                  );
                }}
              >
                {t('actions.suspend')}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                className="rounded border border-green-300 px-3 py-1 text-sm text-green-700"
                onClick={() =>
                  void applyAction(
                    () => adminApi.changeStatus(getAccessToken()!, detail.id, 'active'),
                    'actions.reactivated',
                  )
                }
              >
                {t('actions.reactivate')}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              className="rounded border border-gray-400 px-3 py-1 text-sm"
              onClick={() => {
                if (!window.confirm(t('actions.confirmRevoke'))) return;
                void applyAction(
                  () => adminApi.revokeSessions(getAccessToken()!, detail.id),
                  'actions.revoked',
                );
              }}
            >
              {t('actions.revokeSessions')}
            </button>
          </div>

          <div>
            <h3 className="mt-2 font-semibold">{t('audit.title')}</h3>
            {audit.length > 0 ? (
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {audit.map((entry) => (
                  <li key={entry.id} className="border-b border-gray-100 py-1">
                    <span className="font-medium">{entry.action}</span>{' '}
                    <span className="text-gray-600">
                      {new Date(entry.createdAt).toLocaleString()} · {entry.actorType}
                      {entry.actorUserId ? `:${entry.actorUserId}` : ''}
                      {entry.actorLabel ? ` (${entry.actorLabel})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">{t('audit.empty')}</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gray-200 p-3">
      <dt className="text-xs text-gray-600">{label}</dt>
      <dd className="text-xl font-semibold">{value}</dd>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-gray-400 px-2 py-1 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
