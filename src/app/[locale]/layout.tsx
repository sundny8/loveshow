import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { absoluteUrl, getDefaultSeo, getSiteUrl, LOCALES } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = getDefaultSeo(locale);
  const canonical = absoluteUrl(`/${locale}`);

  // Hreflang map → tells Google which URL serves which language.
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = absoluteUrl(`/${l}`);
  }
  languages['x-default'] = absoluteUrl('/en');

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: seo.title,
      template: `%s · LoveShow 520`,
    },
    description: seo.description,
    keywords: [...seo.keywords],
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: 'LoveShow 520',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: canonical,
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [
        {
          url: '/suits/female.png',
          width: 1024,
          height: 1024,
          alt: 'LoveShow 520 — AI Love Studio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: ['/suits/female.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  // Organization + WebSite + SearchAction structured data — picked up by Google
  // for the rich Knowledge Panel / sitelinks search box. Anchored on the brand
  // name "LoveShow 520" so the brand and the high-intent "520 meaning" query
  // converge on the same entity.
  const siteUrl = getSiteUrl();
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LoveShow 520',
    alternateName: ['LoveShow', '520 LoveShow', '520 我爱你'],
    url: siteUrl,
    logo: `${siteUrl}/suits/female.png`,
    sameAs: [],
    description:
      locale === 'zh'
        ? 'LoveShow 520：围绕「520 = 我爱你」打造的 AI 浪漫创作平台，覆盖文案 / 写真 / 音乐 / 回忆录。'
        : 'LoveShow 520: an AI love studio built around the meaning of "520" (I love you in Chinese internet culture).',
  };
  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LoveShow 520',
    url: siteUrl,
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/${locale}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
      />
    </NextIntlClientProvider>
  );
}
