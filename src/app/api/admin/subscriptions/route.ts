import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

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
    const plan = searchParams.get('plan') || 'all';

    // Build conditions
    const conditions = [];
    
    if (status !== 'all') {
      conditions.push(eq(subscriptions.status, status));
    }
    
    if (plan !== 'all') {
      conditions.push(eq(subscriptions.plan, plan));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get subscriptions with user info
    let subscriptionList: {
      id: string;
      userId: string;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      plan: string;
      status: string;
      createdAt: Date;
      userName: string | null;
      userEmail: string | null;
    }[] = [];
    try {
      subscriptionList = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          stripeCustomerId: subscriptions.stripeCustomerId,
          stripeSubscriptionId: subscriptions.stripeSubscriptionId,
          plan: subscriptions.plan,
          status: subscriptions.status,
          createdAt: subscriptions.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(whereClause)
        .orderBy(desc(subscriptions.createdAt));

      // Filter by search if provided
      if (search) {
        subscriptionList = subscriptionList.filter(sub => 
          sub.userName?.toLowerCase().includes(search.toLowerCase()) ||
          sub.userEmail?.toLowerCase().includes(search.toLowerCase())
        );
      }
    } catch {
      // Table might not exist, subscriptionList remains empty
    }

    // Get stats
    let stats = { total: 0, active: 0, inactive: 0, pro: 0 };
    try {
      const totalResult = await db.select({ count: count() }).from(subscriptions);
      const activeResult = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active'));
      const inactiveResult = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'inactive'));
      const proResult = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.plan, 'pro'));
      
      stats = {
        total: totalResult[0].count,
        active: activeResult[0].count,
        inactive: inactiveResult[0].count,
        pro: proResult[0].count,
      };
    } catch {
      // Table might not exist
    }

    return NextResponse.json({
      subscriptions: subscriptionList.map(sub => ({
        ...sub,
        createdAt: sub.createdAt?.toISOString() || new Date().toISOString(),
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
