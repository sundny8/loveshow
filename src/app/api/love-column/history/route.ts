import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, loveColumnRecords, users } from '@/db';
import { eq, desc, inArray, and } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/love-column/history?userId=xxx&type=copy
 * 查询当前用户的 520 专栏生成记录。
 * - 普通用户：返回自己的最近 100 条
 * - 管理员：传 userId 查看指定用户；传 userId=all 查看所有用户
 * - 可选 type 参数过滤类型（copy / couple-photo / couple-avatar / analysis / memoir / music）
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
    const typeParam = url.searchParams.get('type');

    let targetUserId: string | null = session.user.id;
    if (isAdmin && userIdParam) {
      targetUserId = userIdParam === 'all' ? null : userIdParam;
    }

    // Build where condition
    const conds = [] as any[];
    if (targetUserId) conds.push(eq(loveColumnRecords.userId, targetUserId));
    if (typeParam) conds.push(eq(loveColumnRecords.type, typeParam));

    const records = await db.query.loveColumnRecords.findMany({
      where: conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds),
      orderBy: [desc(loveColumnRecords.createdAt)],
      limit: 100,
    });

    // Resolve user names for displayed records
    const userIds = [...new Set(records.map((r) => r.userId))];
    const userList = userIds.length
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];
    const userMap = new Map(userList.map((u) => [u.id, u]));

    const items = records.map((r) => {
      const payload = (r.payload as Record<string, unknown>) || {};
      const output = (payload.output as Record<string, unknown>) || {};
      return {
        id: r.id,
        type: r.type,
        userId: r.userId,
        userName: userMap.get(r.userId)?.name || 'Unknown',
        creditsUsed: r.creditsUsed,
        createdAt: r.createdAt,
        imageUrls: r.imageUrls || [],
        // Input fields (excluding output)
        input: Object.fromEntries(Object.entries(payload).filter(([k]) => k !== 'output')),
        // Generated output (text/imageUrl/report/memoir/etc.)
        output,
      };
    });

    return NextResponse.json({
      success: true,
      isAdmin,
      items,
    });
  } catch (err: any) {
    console.error('[love-column/history] error', err);
    return NextResponse.json(
      { error: err?.message || 'internal_error' },
      { status: 500 }
    );
  }
}
