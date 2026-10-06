import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '../shared/content/site';

// Required for `output: 'export'` metadata routes.
export const dynamic = 'force-static';

/**
 * robots.txt (T-013).
 *
 * Crawling is allowed so that crawlers can read the `noindex` metadata on
 * auth/account/admin/assessment pages; robots.txt is NOT used as a substitute
 * for `noindex`, and those routes are simply absent from the sitemap.
 *
 * The `Host` directive is intentionally **omitted**: Google no longer supports
 * it (the canonical host is established by the `.htaccess` redirect and the
 * sitemap URLs). Do not re-add `host`. The generated file is:
 *
 *   User-agent: *
 *   Allow: /
 *
 *   Sitemap: https://sapiensmetric.eu/sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
