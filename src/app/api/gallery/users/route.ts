import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/gallery/users
 * 管理员获取所有用户列表（用于作品库筛选）
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const [currentUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (currentUser?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userList = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .orderBy(users.name);

  return NextResponse.json({
    users: userList.map(u => ({
      id: u.id,
      name: u.name || u.email || 'Unknown',
    })),
  });
}
