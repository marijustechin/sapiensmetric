import { pageSitemapXml } from '../../shared/content/sitemap-xml';

export const dynamic = 'force-static';

/** `/page-sitemap.xml` — public pages (including locale homes and the articles index). */
export function GET(): Response {
  return new Response(pageSitemapXml(), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
