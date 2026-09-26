import { useTranslations } from 'next-intl';
import type { UserRole } from '../model/types';

const STYLES: Record<UserRole, string> = {
  user: 'border-gray-300 text-gray-700',
  editor: 'border-blue-300 text-blue-700',
  admin: 'border-purple-300 text-purple-700',
};

export function RoleBadge({ role }: { role: UserRole }) {
  const t = useTranslations('Admin');
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STYLES[role]}`}
    >
      {t(`role.${role}`)}
    </span>
  );
}
