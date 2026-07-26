import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

/**
 * /robots.txt — let search engines crawl public marketing/content pages,
 * but keep auth + dashboard + admin + API + uploaded files private.
 *
 * AI crawlers (GPTBot, PerplexityBot, ClaudeBot, …) are explicitly allowed on
 * public pages — being crawlable by them is a prerequisite for GEO (getting
 * cited by ChatGPT Search / Perplexity / AI Overviews).
 */
const PRIVATE_PATHS = [
  '/api/',
  '/dashboard/',
  '/admin/',
  '/auth/',
  '/uploads/',
  '/*/dashboard/',
  '/*/admin/',
  '/*/auth/',
];

/** AI/LLM crawlers we explicitly welcome on public content. */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-Web',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'cohere-ai',
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ['/'],
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
