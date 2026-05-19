import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

/**
 * /robots.txt — let search engines crawl public marketing/content pages,
 * but keep auth + dashboard + admin + API + uploaded files private.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/auth/',
          '/uploads/',
          '/*/dashboard/',
          '/*/admin/',
          '/*/auth/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
