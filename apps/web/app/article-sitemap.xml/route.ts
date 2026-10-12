import { articleSitemapXml } from '../../shared/content/sitemap-xml';

export const dynamic = 'force-static';

/** `/article-sitemap.xml` — every article (one per slug per locale). */
export function GET(): Response {
  return new Response(articleSitemapXml(), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
