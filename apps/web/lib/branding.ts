/**
 * Branding asset interface.
 *
 * The four approved WebP assets are used exactly as supplied: no conversion,
 * recolouring, renaming, or recreation. The filenames and the `/branding/...`
 * public paths below are a **stable interface**: future visual tone adjustments
 * may replace the file contents, but must preserve these exact filenames and
 * paths.
 *
 * Variant policy — pick the variant for the *actual* background it sits on:
 * - `dark`   — dark strokes, for light backgrounds (the current app shell).
 * - `light`  — light strokes, for dark backgrounds (reserved; not used yet).
 * - `middle` — mid-gray strokes, for mid-tone backgrounds (reserved).
 * - `favicon`— the supplied favicon mark, registered as the web app icon.
 */
export const BRANDING = {
  dark: '/branding/sapiens-metric-logo-dark.webp',
  light: '/branding/sapiens-metric-logo-light.webp',
  middle: '/branding/sapiens-metric-logo-middle.webp',
  favicon: '/branding/sapiens-metric-logo-favicon.webp',
} as const;
