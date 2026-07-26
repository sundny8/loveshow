import { absoluteUrl } from '@/lib/seo';

/**
 * Reusable JSON-LD helpers + renderer.
 *
 * Usage in a server component:
 *   <JsonLd data={faqPageLd(items)} />
 *   <JsonLd data={howToLd({ name, steps })} />
 *
 * Keeping schema builders in one place ensures every marketing page emits
 * consistent structured data (FAQPage / HowTo / Article) — a core requirement
 * for both Google rich results and GEO (AI-engine citation).
 */

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQPage schema — eligible for FAQ rich results and heavily used by AI engines. */
export function faqPageLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

/** HowTo schema for step-by-step "how to use" sections on landing pages. */
export function howToLd(input: { name: string; description?: string; steps: HowToStep[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/** Article schema for blog posts and long-form landing pages. */
export function articleLd(input: {
  headline: string;
  description?: string;
  path: string;
  locale: string;
  image?: string;
  datePublished?: Date | string | null;
  dateModified?: Date | string | null;
  authorName?: string | null;
}) {
  const toIso = (d?: Date | string | null) =>
    d ? (typeof d === 'string' ? d : d.toISOString()) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    inLanguage: input.locale === 'zh' ? 'zh-CN' : 'en',
    author: {
      '@type': input.authorName ? 'Person' : 'Organization',
      name: input.authorName || 'LoveShow 520',
    },
    publisher: {
      '@type': 'Organization',
      name: 'LoveShow 520',
      logo: { '@type': 'ImageObject', url: absoluteUrl('/suits/female.png') },
    },
    ...(input.image ? { image: [input.image] } : {}),
    ...(toIso(input.datePublished) ? { datePublished: toIso(input.datePublished) } : {}),
    ...(toIso(input.dateModified) ? { dateModified: toIso(input.dateModified) } : {}),
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

/** Renders a JSON-LD <script> tag. Server-component friendly. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
