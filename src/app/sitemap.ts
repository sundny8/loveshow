import type { MetadataRoute } from 'next';
import { absoluteUrl, LOCALES } from '@/lib/seo';

/**
 * /sitemap.xml — emits one entry per (locale, path) with hreflang alternates
 * so Google can index the correct language for each query.
 *
 * Only public, content-rich pages are listed. Auth / dashboard / admin /
 * API are excluded (they're disallowed in robots.txt as well).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Public paths to publish. Prefix with locale at emit time.
  const paths: { path: string; priority: number; changefreq: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '', priority: 1.0, changefreq: 'weekly' },
    { path: '/520-meaning', priority: 0.95, changefreq: 'monthly' },
    { path: '/ai-image-editor', priority: 0.95, changefreq: 'monthly' },
    { path: '/blog', priority: 0.85, changefreq: 'weekly' },
    { path: '/workspace', priority: 0.7, changefreq: 'weekly' },
    { path: '/portrait', priority: 0.7, changefreq: 'weekly' },
    { path: '/music', priority: 0.7, changefreq: 'weekly' },
    { path: '/gallery', priority: 0.6, changefreq: 'weekly' },
    { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
    { path: '/terms', priority: 0.3, changefreq: 'yearly' },
  ];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changefreq } of paths) {
    for (const locale of LOCALES) {
      // Hreflang map for this entry
      const languages: Record<string, string> = {};
      for (const l of LOCALES) {
        languages[l] = absoluteUrl(`/${l}${path}`);
      }
      languages['x-default'] = absoluteUrl(`/en${path}`);

      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        lastModified: now,
        changeFrequency: changefreq,
        priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
