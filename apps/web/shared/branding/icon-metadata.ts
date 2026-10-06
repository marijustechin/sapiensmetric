import type { Metadata } from 'next';
import { ICONS } from './branding';

/**
 * Shared page/device icon metadata (T-018).
 *
 * Emitted by the Next.js Metadata API into the document `<head>` as:
 *   <link rel="icon" type="image/x-icon" href="/branding/favicon.ico">
 *   <link rel="icon" type="image/png" sizes="32x32" href="/branding/favicon-32x32.png">
 *   <link rel="icon" type="image/png" sizes="16x16" href="/branding/favicon-16x16.png">
 *   <link rel="icon" type="image/png" sizes="192x192" href="/branding/android-chrome-192x192.png">
 *   <link rel="apple-touch-icon" sizes="180x180" href="/branding/apple-touch-icon.png">
 *
 * Combined with `SITE_MANIFEST`, every root layout declares the same set, so the
 * root locale-redirect page, EN/LT public pages, authenticated app pages, and the
 * 404 page all carry it. The interim WebP favicon is intentionally not here.
 */
export const SITE_ICONS: NonNullable<Metadata['icons']> = {
  icon: [
    { url: ICONS.faviconIco, type: 'image/x-icon' },
    { url: ICONS.favicon32, type: 'image/png', sizes: '32x32' },
    { url: ICONS.favicon16, type: 'image/png', sizes: '16x16' },
    { url: ICONS.android192, type: 'image/png', sizes: '192x192' },
  ],
  apple: [{ url: ICONS.appleTouch, type: 'image/png', sizes: '180x180' }],
};

/** Web app manifest path, shared by both root layouts. */
export const SITE_MANIFEST = ICONS.manifest;
