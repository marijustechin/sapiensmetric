import { sitemapIndexXml } from '../../shared/content/sitemap-xml';

// Required for `output: 'export'` route handlers.
export const dynamic = 'force-static';

/**
 * `/sitemap.xml` — the sitemap index (Yoast-style entry point, T-023). It points
 * at `/page-sitemap.xml` and `/article-sitemap.xml`, both generated from
 * repository content. Private routes and the root redirect are never listed.
 */
export function GET(): Response {
  return new Response(sitemapIndexXml(), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
