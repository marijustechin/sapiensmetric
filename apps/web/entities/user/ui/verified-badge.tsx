import { useTranslations } from 'next-intl';

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const t = useTranslations('Admin');
  return (
    <span className="text-xs text-gray-600">
      {t(verified ? 'verified.yes' : 'verified.no')}
    </span>
  );
}
