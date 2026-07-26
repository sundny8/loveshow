import type { MetadataRoute } from 'next';
import { absoluteUrl, LOCALES } from '@/lib/seo';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * /sitemap.xml — emits one entry per (locale, path) with hreflang alternates
 * so Google can index the correct language for each query.
 *
 * Static marketing pages are listed explicitly; published blog posts are
 * pulled from the database at request time. Auth / dashboard / admin / API
 * are excluded (they're disallowed in robots.txt as well).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public paths to publish. Prefix with locale at emit time.
  const paths: { path: string; priority: number; changefreq: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '', priority: 1.0, changefreq: 'weekly' },
    { path: '/520-meaning', priority: 0.95, changefreq: 'monthly' },
    { path: '/ai-image-editor', priority: 0.95, changefreq: 'monthly' },
    { path: '/ai-love-letter', priority: 0.9, changefreq: 'monthly' },
    { path: '/ai-couple-portrait', priority: 0.9, changefreq: 'monthly' },
    { path: '/ai-love-song', priority: 0.9, changefreq: 'monthly' },
    { path: '/blog', priority: 0.85, changefreq: 'weekly' },
    { path: '/docs', priority: 0.7, changefreq: 'monthly' },
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

  // Published blog posts — one entry per post under its own locale.
  try {
    const posts = await db
      .select({
        slug: blogPosts.slug,
        locale: blogPosts.locale,
        updatedAt: blogPosts.updatedAt,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));

    for (const post of posts) {
      const locale = LOCALES.includes(post.locale as (typeof LOCALES)[number])
        ? post.locale
        : 'en';
      entries.push({
        url: absoluteUrl(`/${locale}/blog/${post.slug}`),
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: 'monthly',
        priority: 0.75,
      });
    }
  } catch {
    // DB unavailable at build time — static entries are still emitted.
  }

  return entries;
}
