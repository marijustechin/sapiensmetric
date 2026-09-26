import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '../shared/content/site';

// Required for `output: 'export'` metadata routes.
export const dynamic = 'force-static';

/**
 * robots.txt (T-013).
 *
 * Crawling is allowed so that crawlers can read the `noindex` metadata on
 * auth/account/admin pages; robots.txt is NOT used as a substitute for
 * `noindex`, and those routes are simply absent from the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
