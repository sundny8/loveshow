import { db, pointTransactions, users, orders } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  isRechargePlanKey,
  RECHARGE_PLANS,
  type RechargePlanKey,
} from '@/lib/billing/recharge-plans';

export async function createPendingRechargeOrder({
  userId,
  planKey,
}: {
  userId: string;
  planKey: RechargePlanKey;
}) {
  const orderId = uuidv4();
  const plan = RECHARGE_PLANS[planKey];

  await db.insert(orders).values({
    id: orderId,
    userId,
    amountCents: plan.amountCents,
    planType: planKey,
    paymentMethod: 'WAFFO_PANCAKE',
    status: 'PENDING',
  });

  return orderId;
}

export async function attachWaffoCheckoutSession({
  orderId,
  userId,
  sessionId,
}: {
  orderId: string;
  userId: string;
  sessionId: string;
}) {
  await db
    .update(orders)
    .set({ externalTransactionId: sessionId })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.userId, userId),
        eq(orders.status, 'PENDING')
      )
    );
}

/**
 * Atomically marks a pending order paid and credits the user. The conditional
 * PENDING -> PAID update is the idempotency barrier for duplicate webhooks.
 */
export async function fulfillWaffoRecharge({
  orderId,
  userId,
  waffoOrderId,
  paymentMethod,
}: {
  orderId: string;
  userId: string;
  waffoOrderId: string;
  paymentMethod?: string;
}) {
  return db.transaction(async (tx) => {
    const [paidOrder] = await tx
      .update(orders)
      .set({
        status: 'PAID',
        paidAt: new Date(),
        externalTransactionId: waffoOrderId,
        paymentMethod: paymentMethod
          ? `WAFFO_PANCAKE:${paymentMethod}`
          : 'WAFFO_PANCAKE',
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.userId, userId),
          eq(orders.status, 'PENDING')
        )
      )
      .returning({ planType: orders.planType });

    if (!paidOrder) {
      return { fulfilled: false as const };
    }

    if (!isRechargePlanKey(paidOrder.planType)) {
      throw new Error(`Unknown recharge plan on order ${orderId}`);
    }

    const plan = RECHARGE_PLANS[paidOrder.planType];

    await tx
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} + ${plan.points}` })
      .where(eq(users.id, userId));

    await tx.insert(pointTransactions).values({
      id: uuidv4(),
      userId,
      amount: plan.points,
      type: 'RECHARGE',
      relatedOrderId: orderId,
      description: `购买 ${plan.name} 套餐，充值 ${plan.points} 积分`,
    });

    return { fulfilled: true as const, points: plan.points };
  });
}
