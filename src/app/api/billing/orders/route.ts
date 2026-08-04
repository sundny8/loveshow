import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { orders, pointTransactions } from '@/db/schema';
import { and, desc, eq, gt, inArray } from 'drizzle-orm';
import {
  isRechargePlanKey,
  RECHARGE_PLANS,
} from '@/lib/billing/recharge-plans';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        amountCents: orders.amountCents,
        paymentMethod: orders.paymentMethod,
        planType: orders.planType,
        externalTransactionId: orders.externalTransactionId,
        createdAt: orders.createdAt,
        paidAt: orders.paidAt,
      })
      .from(orders)
      .where(and(eq(orders.userId, session.user.id), gt(orders.amountCents, 0)))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    const orderIds = orderRows.map((order) => order.id);
    const transactionRows = orderIds.length
      ? await db
          .select({
            relatedOrderId: pointTransactions.relatedOrderId,
            amount: pointTransactions.amount,
            createdAt: pointTransactions.createdAt,
          })
          .from(pointTransactions)
          .where(
            and(
              eq(pointTransactions.userId, session.user.id),
              gt(pointTransactions.amount, 0),
              inArray(pointTransactions.relatedOrderId, orderIds)
            )
          )
      : [];

    const creditedByOrderId = new Map(
      transactionRows
        .filter((transaction) => transaction.relatedOrderId)
        .map((transaction) => [
          transaction.relatedOrderId!,
          {
            points: transaction.amount,
            creditedAt:
              transaction.createdAt instanceof Date
                ? transaction.createdAt.toISOString()
                : transaction.createdAt,
          },
        ])
    );

    const billingOrders = orderRows.map((order) => {
      const plan =
        order.planType && isRechargePlanKey(order.planType)
          ? RECHARGE_PLANS[order.planType]
          : null;
      const credited = creditedByOrderId.get(order.id);

      return {
        id: order.id,
        status: order.status,
        amountCents: order.amountCents,
        currency: 'USD',
        paymentMethod: order.paymentMethod,
        planType: order.planType,
        planName: plan?.name || order.planType || 'Recharge',
        expectedPoints: plan?.points ?? null,
        creditedPoints: credited?.points ?? null,
        externalTransactionId: order.externalTransactionId,
        createdAt:
          order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        paidAt: order.paidAt instanceof Date ? order.paidAt.toISOString() : order.paidAt,
        creditedAt: credited?.creditedAt ?? null,
      };
    });

    return NextResponse.json({ orders: billingOrders });
  } catch (error) {
    console.error('Error fetching billing orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
