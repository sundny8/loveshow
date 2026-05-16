import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, pointTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

// POST /api/admin/users/[id]/points - Adjust user points
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || amount === 0) {
      return NextResponse.json({ error: '积分变动数量不能为0' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: '请填写原因' }, { status: 400 });
    }

    // Get current user
    const currentUser = await db
      .select({ id: users.id, pointsBalance: users.pointsBalance })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const previousBalance = currentUser[0].pointsBalance || 0;
    const newBalance = previousBalance + amount;

    if (newBalance < 0) {
      return NextResponse.json({ error: '积分不足' }, { status: 400 });
    }

    // Update user points
    await db
      .update(users)
      .set({ pointsBalance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, id));

    // Create point transaction record
    await db.insert(pointTransactions).values({
      id: crypto.randomUUID(),
      userId: id,
      amount,
      type: 'ADMIN_ADJUST',
      description: `管理员调整: ${description}`,
    });

    return NextResponse.json({
      previousBalance,
      newBalance,
      amount,
    });
  } catch (error) {
    console.error('Error adjusting points:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
