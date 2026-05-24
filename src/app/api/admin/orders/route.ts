import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, orders, pointTransactions } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';

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

// GET /api/admin/orders - List redeem code recharge orders & transactions
export async function GET(request: Request) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  try {
    // Build where clause for pointTransactions of type 'redeem'
    const whereClause = eq(pointTransactions.type, 'redeem');

    // Get total count of redeem transactions
    const totalResult = await db
      .select({ count: count() })
      .from(pointTransactions)
      .where(whereClause);
    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / limit);

    // Fetch point transactions
    const txList = await db
      .select({
        id: pointTransactions.id,
        userId: pointTransactions.userId,
        amount: pointTransactions.amount,
        type: pointTransactions.type,
        description: pointTransactions.description,
        relatedOrderId: pointTransactions.relatedOrderId,
        createdAt: pointTransactions.createdAt,
      })
      .from(pointTransactions)
      .where(whereClause)
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch user info for all transactions
    const userIds = [...new Set(txList.map(t => t.userId))];
    const userMap = new Map<string, { name: string; email: string }>();
    for (const uid of userIds) {
      const [u] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, uid))
        .limit(1);
      if (u) userMap.set(u.id, { name: u.name || '', email: u.email || '' });
    }

    // Fetch related orders
    const orderIds = txList.filter(t => t.relatedOrderId).map(t => t.relatedOrderId!);
    const orderMap = new Map<string, { planType: string | null; externalTransactionId: string | null; status: string }>();
    for (const oid of orderIds) {
      const [o] = await db
        .select({
          id: orders.id,
          planType: orders.planType,
          externalTransactionId: orders.externalTransactionId,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, oid))
        .limit(1);
      if (o) orderMap.set(o.id, { planType: o.planType, externalTransactionId: o.externalTransactionId, status: o.status });
    }

    // Filter by search if provided (client-side for simplicity)
    let filtered = txList;
    if (search) {
      const q = search.toLowerCase();
      filtered = txList.filter(tx => {
        const user = userMap.get(tx.userId);
        const desc = tx.description?.toLowerCase() || '';
        return (user?.name?.toLowerCase().includes(q) ||
          user?.email?.toLowerCase().includes(q) ||
          desc.includes(q));
      });
    }

    const transactions = filtered.map(tx => {
      const order = tx.relatedOrderId ? orderMap.get(tx.relatedOrderId) : null;
      return {
        id: tx.id,
        userId: tx.userId,
        userName: userMap.get(tx.userId)?.name || 'Unknown',
        userEmail: userMap.get(tx.userId)?.email || '',
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        relatedOrderId: tx.relatedOrderId,
        planType: order?.planType || null,
        code: order?.externalTransactionId || null,
        orderStatus: order?.status || null,
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
      };
    });

    // Stats
    const totalAmount = txList.reduce((acc, tx) => acc + tx.amount, 0);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = txList.filter(tx => {
      const d = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt as string);
      return d >= today;
    }).length;
    const todayAmount = txList
      .filter(tx => {
        const d = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt as string);
        return d >= today;
      })
      .reduce((acc, tx) => acc + tx.amount, 0);

    return NextResponse.json({
      transactions,
      stats: {
        total,
        totalAmount,
        todayOrders: todayCount,
        todayAmount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
