import { db, pointTransactions, users, orders } from "@/db";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function processRecharge({
  userId,
  amountCents,
  points,
  planType,
  paymentMethod = "STRIPE",
  externalId,
}: {
  userId: string;
  amountCents: number;
  points: number;
  planType: string;
  paymentMethod?: string;
  externalId?: string;
}) {
  return await db.transaction(async (tx) => {
    // 1. Create order
    const orderId = uuidv4();
    await tx.insert(orders).values({
      id: orderId,
      userId,
      amountCents,
      planType,
      paymentMethod,
      externalTransactionId: externalId,
      status: "PAID",
      paidAt: new Date(),
    });

    // 2. Add points
    await tx
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} + ${points}` })
      .where(eq(users.id, userId));

    // 3. Record transaction
    await tx.insert(pointTransactions).values({
      id: uuidv4(),
      userId,
      amount: points,
      type: "RECHARGE",
      relatedOrderId: orderId,
      description: `购买 ${planType} 充值 ${points} 积分`,
    });

    return orderId;
  });
}
