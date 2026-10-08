import { BRANDING } from '../branding/branding';

/**
 * Brand mark for the approved WebP asset set (see `shared/branding/branding.ts`).
 *
 * The current app shell background is light, so the `dark` variant is used.
 * The asset is served from its stable public path and is not transformed.
 *
 * Pass `alt=""` when the mark sits next to a visible product name (or inside a
 * labelled link), so screen readers do not announce it twice.
 */
export function BrandMark({
  className = 'h-8 w-8',
  alt = 'Sapiens Metric',
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={BRANDING.dark}
      alt={alt}
      width={512}
      height={512}
      className={className}
    />
  );
}
