import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, musicTasks, users } from '@/db';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/music/history?userId=xxx
 * 查询音乐生成历史。
 * - 普通用户：返回自己的最近 30 条
 * - 管理员：传 userId 查看指定用户；传 userId=all 查看所有用户
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check admin role
    const [currentUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const isAdmin = currentUser?.role === 'ADMIN';

    const url = new URL(req.url);
    const userIdParam = url.searchParams.get('userId');

    let targetUserId: string | null = session.user.id;
    if (isAdmin && userIdParam) {
      targetUserId = userIdParam === 'all' ? null : userIdParam;
    }

    const tasks = await db.query.musicTasks.findMany({
      where: targetUserId ? eq(musicTasks.userId, targetUserId) : undefined,
      orderBy: [desc(musicTasks.createdAt)],
      limit: 50,
    });

    return NextResponse.json({ tasks, isAdmin });
  } catch (err: any) {
    console.error('[music/history] error', err);
    return NextResponse.json(
      { error: err?.message || 'internal_error' },
      { status: 500 }
    );
  }
}
