import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq, sql, gte, lt, and, count } from 'drizzle-orm';

export async function GET() {
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

    if (!currentUser.length || currentUser[0].role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get date ranges as ISO strings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // Get total users
    const totalResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalResult[0].count;

    // Get users this month
    const thisMonthResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, new Date(startOfMonth)));
    const thisMonthUsers = thisMonthResult[0].count;

    // Get users last month
    const lastMonthResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        gte(users.createdAt, new Date(startOfLastMonth)),
        lt(users.createdAt, new Date(startOfMonth))
      ));
    const lastMonthUsers = lastMonthResult[0].count;

    // Get admin count
    const adminResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'ADMIN'));
    const adminsCount = adminResult[0].count;

    // Get verified count
    const verifiedResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.emailVerified, true));
    const verifiedCount = verifiedResult[0].count;

    // Recent users
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(5);

    // Subscription stats
    let subscriptionStats = { total: 0, free: 0, starter: 0, monthly: 0, monthly_pro: 0 };
    try {
      const subStarter = await db.select({ count: count() }).from(subscriptions).where(sql`${subscriptions.plan} IN ('starter', 'pro')`);
      const subMonthly = await db.select({ count: count() }).from(subscriptions).where(sql`${subscriptions.plan} IN ('monthly', 'enterprise')`);
      const subMonthlyPro = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.plan, 'monthly_pro'));

      const paidCount = subStarter[0].count + subMonthly[0].count + subMonthlyPro[0].count;
      const freeCount = Math.max(0, totalUsers - paidCount);
      
      subscriptionStats = {
        total: totalUsers,
        free: freeCount,
        starter: subStarter[0].count,
        monthly: subMonthly[0].count,
        monthly_pro: subMonthlyPro[0].count,
      };
    } catch {
      // Table might not exist or be empty
    }

    // Daily user registrations for the past 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayStats = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, startOfDay),
          lt(users.createdAt, endOfDay)
        ));

      dailyStats.push({
        day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        users: dayStats[0].count,
      });
    }

    // Calculate growth
    const userGrowth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : thisMonthUsers > 0 ? '100' : '0';

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          thisMonth: thisMonthUsers,
          lastMonth: lastMonthUsers,
          growth: userGrowth,
          admins: adminsCount,
          verified: verifiedCount,
        },
        subscriptions: subscriptionStats,
      },
      recentUsers: recentUsers.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      dailyStats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
