import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql, count, or, ilike } from 'drizzle-orm';

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const currentUser = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!currentUser.length || currentUser[0].role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session, userId: session.user.id };
}

// GET /api/admin/users - List users with pagination and search
export async function GET(request: Request) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';

  try {
    // Build where clause
    let whereClause = sql`1=1`;
    if (search) {
      whereClause = or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!;
    }
    if (role !== 'all') {
      const roleWhere = eq(users.role, role);
      whereClause = search ? and(whereClause, roleWhere)! : roleWhere;
    }

    // Get total count
    const totalResult = await db.select({ count: count() }).from(users).where(whereClause);
    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / limit);

    // Get users
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        image: users.image,
        pointsBalance: users.pointsBalance,
        isBanned: users.isBanned,
        isFrozen: users.isFrozen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(limit)
      .offset((page - 1) * limit);

    // Get stats
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const adminsResult = await db.select({ count: count() }).from(users).where(eq(users.role, 'ADMIN'));
    const membersResult = await db.select({ count: count() }).from(users).where(eq(users.role, 'USER'));
    const verifiedResult = await db.select({ count: count() }).from(users).where(eq(users.emailVerified, true));

    return NextResponse.json({
      users: userList.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      stats: {
        total: totalUsersResult[0].count,
        admins: adminsResult[0].count,
        members: membersResult[0].count,
        verified: verifiedResult[0].count,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: Request) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const { name, email, role: userRole, emailVerified } = body;

    if (!name || !email) {
      return NextResponse.json({ error: '姓名和邮箱为必填项' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 });
    }

    const newUser = await db.insert(users).values({
      id: crypto.randomUUID(),
      name,
      email,
      role: userRole || 'USER',
      emailVerified: emailVerified || false,
      pointsBalance: 20,
      isBanned: false,
      isFrozen: false,
    }).returning();

    return NextResponse.json({ user: newUser[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function and(...conditions: any[]) {
  return sql.join(conditions, sql` AND `);
}
