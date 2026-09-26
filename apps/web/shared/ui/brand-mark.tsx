import { BRANDING } from '../branding/branding';

/**
 * Brand mark for the approved WebP asset set (see `lib/branding.ts`).
 *
 * The current app shell background is light, so the `dark` variant is used.
 * The asset is served from its stable public path and is not transformed.
 */
export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img
      src={BRANDING.dark}
      alt="Sapiens Metric"
      width={512}
      height={512}
      className={className}
    />
  );
}
