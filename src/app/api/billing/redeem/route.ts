import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, redeemCodes, orders, pointTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const PLAN_POINTS: Record<string, number> = {
  starter: 140,
  creator: 400,
  enthusiast: 700,
  studio: 1500,
};

// POST /api/billing/redeem - Redeem a code
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a redeem code' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find the redeem code
    const codeResults = await db
      .select()
      .from(redeemCodes)
      .where(and(eq(redeemCodes.code, normalizedCode), eq(redeemCodes.isUsed, false)))
      .limit(1);

    if (codeResults.length === 0) {
      return NextResponse.json({ error: 'Invalid or already used redeem code' }, { status: 400 });
    }

    const redeemCode = codeResults[0];
    const points = PLAN_POINTS[redeemCode.planType] || redeemCode.points;

    // Get current user balance
    const userResult = await db
      .select({ pointsBalance: users.pointsBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = userResult[0].pointsBalance;

    // Perform all DB operations in sequence (Drizzle doesn't support transactions easily without pg)
    // 1. Create order record
    const orderId = nanoid();
    await db.insert(orders).values({
      id: orderId,
      userId,
      status: 'PAID',
      amountCents: 0, // Redeem codes are $0 amount
      planType: redeemCode.planType,
      paymentMethod: 'redeem_code',
      externalTransactionId: normalizedCode,
    });

    // 2. Create point transaction
    const newBalance = currentBalance + points;
    await db.insert(pointTransactions).values({
      id: nanoid(),
      userId,
      amount: points,
      type: 'redeem',
      description: `兑换码充值: ${redeemCode.planType} (${normalizedCode})`,
      relatedOrderId: orderId,
    });

    // 3. Mark code as used
    await db
      .update(redeemCodes)
      .set({
        isUsed: true,
        usedBy: userId,
        usedAt: new Date(),
      })
      .where(eq(redeemCodes.id, redeemCode.id));

    // 4. Update user balance
    await db
      .update(users)
      .set({ pointsBalance: newBalance })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      points,
      previousBalance: currentBalance,
      newBalance,
      planType: redeemCode.planType,
    });
  } catch (error) {
    console.error('Error redeeming code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
