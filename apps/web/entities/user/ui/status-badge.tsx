import { useTranslations } from 'next-intl';
import type { UserStatus } from '../model/types';

const STYLES: Record<UserStatus, string> = {
  active: 'border-green-300 text-green-700',
  suspended: 'border-red-300 text-red-700',
};

export function StatusBadge({ status }: { status: UserStatus }) {
  const t = useTranslations('Admin');
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
