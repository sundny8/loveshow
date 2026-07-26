import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Heart, ArrowRight } from 'lucide-react';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { absoluteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';

interface Props {
  params: Promise<{ locale: string }>;
}

// Public blog index — refresh the list every 5 minutes.
export const revalidate = 300;

async function getPosts() {
  try {
    return await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt,
        category: blogPosts.category,
        tags: blogPosts.tags,
        readingTime: blogPosts.readingTime,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const canonical = absoluteUrl(`/${locale}/blog`);
  const title = t('title');
  const description = t('subtitle');
  const ogImage = absoluteUrl(`/api/og?title=${encodeURIComponent(title)}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = await getPosts();

  // ItemList schema so crawlers/AI engines see the full article inventory.
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: post.title,
      url: absoluteUrl(`/${locale}/blog/${post.slug}`),
    })),
  };

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-rose-100 dark:border-rose-500/10 bg-gradient-to-r from-rose-100/60 via-pink-50 to-rose-100/60 dark:from-rose-500/10 dark:via-pink-500/5 dark:to-rose-500/10">
          <div className="container mx-auto px-4 py-14">
            <span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-rose-600 dark:text-rose-300 uppercase mb-3">
              <Heart className="h-3 w-3 fill-current" /> LoveShow 520
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              {t('subtitle')}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {posts.length === 0 ? (
            <div className="py-24 text-center text-slate-500">{t('noPosts')}</div>
          ) : (
            <div className="space-y-12">
              {/* Featured (latest) post */}
              {featured && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-xl transition-all"
                >
                  <div className="relative min-h-[220px] md:min-h-[300px]">
                    {featured.coverImage ? (
                      <Image
                        src={featured.coverImage}
                        alt={featured.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center">
                        <Heart className="h-16 w-16 text-white/40 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      {featured.category && (
                        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-0">
                          {featured.category}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      {featured.publishedAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(featured.publishedAt)}
                        </span>
                      )}
                      {featured.readingTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {featured.readingTime} read
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                        {t('readMore')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Remaining posts */}
              {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-lg transition-all"
                    >
                      <div className="relative h-40">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-rose-400/90 via-pink-500/80 to-rose-500/90 flex items-center justify-center">
                            <Heart className="h-10 w-10 text-white/40 fill-current" />
                          </div>
                        )}
                        {post.category && (
                          <Badge className="absolute top-3 left-3 bg-white/90 text-rose-700 border-0 backdrop-blur-sm">
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col p-5">
                        <h3 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="mt-auto pt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(post.publishedAt)}
                            </span>
                          )}
                          {post.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {post.readingTime} read
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
      {posts.length > 0 && <JsonLd data={listLd} />}
    </div>
  );
}
