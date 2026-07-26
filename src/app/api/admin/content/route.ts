import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, blogPosts } from '@/db/schema';
import { eq, like, or, and, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { pingIndexNow } from '@/lib/indexnow';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser.length || (currentUser[0].role !== 'admin' && currentUser[0].role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.slug, `%${search}%`)
        )
      );
    }
    
    if (status === 'published') {
      conditions.push(eq(blogPosts.published, true));
    } else if (status === 'draft') {
      conditions.push(eq(blogPosts.published, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get posts with author info
    let postList: {
      id: string;
      slug: string;
      title: string;
      excerpt: string | null;
      coverImage: string | null;
      published: boolean;
      publishedAt: Date | null;
      locale: string;
      category: string | null;
      tags: string[] | null;
      createdAt: Date;
      updatedAt: Date;
      authorName: string | null;
      authorEmail: string | null;
    }[] = [];
    try {
      postList = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          coverImage: blogPosts.coverImage,
          published: blogPosts.published,
          publishedAt: blogPosts.publishedAt,
          locale: blogPosts.locale,
          category: blogPosts.category,
          tags: blogPosts.tags,
          createdAt: blogPosts.createdAt,
          updatedAt: blogPosts.updatedAt,
          authorName: users.name,
          authorEmail: users.email,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(blogPosts.createdAt));
    } catch {
      // Table might not exist, postList remains empty
    }

    // Get stats
    let stats = { total: 0, published: 0, draft: 0 };
    try {
      const totalResult = await db.select({ count: count() }).from(blogPosts);
      const publishedResult = await db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.published, true));
      const draftResult = await db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.published, false));
      
      stats = {
        total: totalResult[0].count,
        published: publishedResult[0].count,
        draft: draftResult[0].count,
      };
    } catch {
      // Table might not exist
    }

    return NextResponse.json({
      posts: postList.map(post => ({
        ...post,
        createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: post.updatedAt?.toISOString() || new Date().toISOString(),
        publishedAt: post.publishedAt?.toISOString() || null,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create new post
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser.length || (currentUser[0].role !== 'admin' && currentUser[0].role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingPost = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, body.slug))
      .limit(1);

    if (existingPost.length > 0) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 400 });
    }

    const now = new Date();
    const newPost = await db
      .insert(blogPosts)
      .values({
        id: nanoid(),
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt || null,
        content: body.content || '',
        coverImage: body.coverImage || null,
        published: body.published || false,
        publishedAt: body.published ? now : null,
        locale: body.locale || 'en',
        category: body.category || null,
        tags: body.tags || [],
        authorId: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Notify Bing/Yandex (IndexNow) so the new post gets crawled immediately.
    if (newPost[0]?.published) {
      const locale = newPost[0].locale || 'en';
      void pingIndexNow([`/${locale}/blog/${newPost[0].slug}`, `/${locale}/blog`]);
    }

    return NextResponse.json({
      message: 'Post created successfully',
      post: newPost[0],
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
