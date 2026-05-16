import { NextResponse } from 'next/server';
import { db } from '@/db';
import { blogPosts, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build conditions
    const conditions = [eq(blogPosts.published, true)];
    
    if (locale !== 'all') {
      conditions.push(eq(blogPosts.locale, locale));
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(blogPosts.category, category));
    }

    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        coverImage: blogPosts.coverImage,
        publishedAt: blogPosts.publishedAt,
        locale: blogPosts.locale,
        category: blogPosts.category,
        tags: blogPosts.tags,
        readingTime: blogPosts.readingTime,
        authorName: users.name,
        authorImage: users.image,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        publishedAt: post.publishedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ posts: [] });
  }
}
