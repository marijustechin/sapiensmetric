import type { MetadataRoute } from 'next';
import { publicSitemapEntries } from '../shared/content/sitemap';

// Required for `output: 'export'` metadata routes.
export const dynamic = 'force-static';

/**
 * Static sitemap (T-013). Lists only the intended indexable public pages/articles
 * under the production origin, generated from repository content
 * (`shared/content/sitemap.ts`): the 20 public EN/LT URLs (including `/en/` and
 * `/lt/`), with truthful last-modified dates and reciprocal alternates. The root
 * remembered-language redirect and auth/account/admin/assessment routes are
 * excluded (and carry `noindex`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemapEntries().map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    alternates: { languages: entry.alternates },
  }));
}
