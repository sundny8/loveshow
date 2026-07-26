import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Calendar, Clock, User, Share2, Bookmark } from 'lucide-react';
import { db } from '@/db';
import { blogPosts, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { absoluteUrl } from '@/lib/seo';
import { JsonLd, articleLd, faqPageLd, type FaqItem } from '@/components/seo/json-ld';

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

async function getPost(slug: string) {
  try {
    const post = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt,
        locale: blogPosts.locale,
        category: blogPosts.category,
        tags: blogPosts.tags,
        readingTime: blogPosts.readingTime,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        authorName: users.name,
        authorImage: users.image,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);

    return post[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const canonical = absoluteUrl(`/${locale}/blog/${slug}`);
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  // Cover image if set, otherwise a branded dynamic OG card with the title.
  const ogImage =
    post.coverImage || absoluteUrl(`/api/og?title=${encodeURIComponent(post.title)}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      ...(post.publishedAt ? { publishedTime: new Date(post.publishedAt).toISOString() } : {}),
      images: [{ url: ogImage, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// Inline markdown → React nodes: [text](url), **bold**, `code`.
// Internal links stay same-tab; external links open in a new tab.
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const external = /^https?:\/\//.test(link[2]);
      return (
        <a
          key={i}
          href={link[2]}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700"
        >
          {link[1]}
        </a>
      );
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-slate-800 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// Strip markdown syntax for plain-text contexts (JSON-LD answers).
function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

// Extract Q&A pairs from a trailing "## FAQ" section (### question + answer
// paragraphs) so every post automatically emits FAQPage JSON-LD (GEO).
function extractFaq(content: string): FaqItem[] {
  const blocks = content.split('\n\n');
  const start = blocks.findIndex(
    (b) => /^## (faq|frequently asked questions|常见问题)/i.test(b.trim())
  );
  if (start === -1) return [];
  const items: FaqItem[] = [];
  let current: FaqItem | null = null;
  for (const block of blocks.slice(start + 1)) {
    const trimmed = block.trim();
    if (/^## /.test(trimmed)) break; // FAQ section ended
    if (trimmed.startsWith('### ')) {
      if (current) items.push(current);
      current = { q: stripInline(trimmed.slice(4).trim()), a: '' };
    } else if (current && trimmed) {
      current.a = current.a ? `${current.a} ${stripInline(trimmed)}` : stripInline(trimmed);
    }
  }
  if (current && current.a) items.push(current);
  return items.filter((item) => item.a);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Article schema — gives Google/AI engines author, dates and image context.
  const postLd = articleLd({
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    path: `/${locale}/blog/${post.slug}`,
    locale: post.locale || locale,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt,
    authorName: post.authorName,
  });

  // Normalize CRLF so paragraph splitting works regardless of how content was saved.
  const content = post.content.replace(/\r\n/g, '\n');

  // FAQ rich results + AI-engine citations, derived from the post's FAQ section.
  const faqItems = extractFaq(content);

  // Simple markdown-like content rendering
  const renderContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // Skip the first heading as we show it in the hero
        if (index === 0 && paragraph.startsWith('# ')) {
          return null;
        }
        
        // Headings
        if (paragraph.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold mt-12 mb-6 text-slate-900 dark:text-white">{paragraph.slice(2)}</h1>;
        }
        if (paragraph.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">{renderInline(paragraph.slice(3))}</h2>;
        }
        if (paragraph.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-8 mb-3 text-slate-900 dark:text-white">{renderInline(paragraph.slice(4))}</h3>;
        }
        
        // Code blocks
        if (paragraph.startsWith('```')) {
          const lines = paragraph.split('\n');
          const lang = lines[0].slice(3);
          const code = lines.slice(1, -1).join('\n');
          return (
            <div key={index} className="my-6 rounded-xl overflow-hidden shadow-lg">
              {lang && (
                <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 font-mono">
                  {lang}
                </div>
              )}
              <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-sm leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        
        // Tables (simple markdown tables)
        if (paragraph.includes('|') && paragraph.includes('---')) {
          const rows = paragraph.split('\n').filter(row => !row.includes('---'));
          return (
            <div key={index} className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    {rows[0]?.split('|').filter(Boolean).map((cell, i) => (
                      <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {renderInline(cell.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-700">
                      {row.split('|').filter(Boolean).map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {renderInline(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        
        // Lists
        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
          const items = paragraph.split('\n');
          return (
            <ul key={index} className="my-6 space-y-2 pl-6">
              {items.map((item, i) => (
                <li key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed relative before:content-[''] before:absolute before:-left-4 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary-500 before:rounded-full">
                  {renderInline(item.replace(/^[-*] /, ''))}
                </li>
              ))}
            </ul>
          );
        }
        
        // Numbered lists
        if (/^\d+\. /.test(paragraph)) {
          const items = paragraph.split('\n');
          return (
            <ol key={index} className="my-6 space-y-2 pl-6 list-decimal">
              {items.map((item, i) => (
                <li key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                  {renderInline(item.replace(/^\d+\. /, ''))}
                </li>
              ))}
            </ol>
          );
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-slate-600 dark:text-slate-300 my-5 leading-relaxed text-lg">
            {renderInline(paragraph)}
          </p>
        );
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative">
          {/* Cover Image Background */}
          {post.coverImage ? (
            <div className="absolute inset-0 h-[400px]">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white dark:to-slate-900" />
            </div>
          ) : (
            <div className="absolute inset-0 h-[400px] bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-900" />
            </div>
          )}

          {/* Hero Content */}
          <div className="relative pt-16 pb-12">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                {/* Category & Tags */}
                <div className="flex items-center gap-2 mb-6">
                  {post.category && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      {post.category}
                    </Badge>
                  )}
                  {post.tags?.includes('pro') && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                      PRO
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-6 text-white/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {post.authorImage ? (
                        <Image 
                          src={post.authorImage} 
                          alt={post.authorName || 'Author'} 
                          width={40} 
                          height={40} 
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{post.authorName || 'LoveShow Team'}</p>
                      <p className="text-sm text-white/70">Author</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {post.readingTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {post.readingTime} read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Floating Action Bar */}
            <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-3">
              <button className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Share">
                <Share2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
              <button className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Bookmark">
                <Bookmark className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Content */}
            <div className="prose-lg">
              {renderContent(content)}
            </div>

            {/* Tags Footer */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">Tags:</span>
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Author Card */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                  {post.authorImage ? (
                    <Image 
                      src={post.authorImage} 
                      alt={post.authorName || 'Author'} 
                      width={64} 
                      height={64} 
                      className="rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Written by</p>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {post.authorName || 'LoveShow Team'}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Turning “520 = I love you” into AI-crafted love letters, couple portraits and songs at LoveShow 520.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <JsonLd data={postLd} />
      {faqItems.length > 0 && <JsonLd data={faqPageLd(faqItems)} />}
    </div>
  );
}
