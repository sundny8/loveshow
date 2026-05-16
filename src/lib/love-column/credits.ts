import { db, users, pointTransactions, loveColumnRecords } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Re-export client-safe cost constants and the LoveColumnType union from
// `./costs` so existing server-side imports keep working unchanged.
export {
  COST_COPY,
  COST_PHOTO,
  COST_AVATAR,
  COST_ANALYSIS,
  COST_MEMOIR,
  COST_MUSIC,
} from './costs';
export type { LoveColumnType } from './costs';

import type { LoveColumnType } from './costs';

const TYPE_LABEL: Record<LoveColumnType, string> = {
  copy: '520 文案',
  'couple-photo': '情侣写真',
  'couple-avatar': '情侣大头贴',
  analysis: '情感分析',
  memoir: '恋爱回忆录',
  music: '情侣音乐',
};

/**
 * Deduct credits and create a love-column record in a single transaction.
 * Returns the new record id. Throws 'insufficient_points' if balance < cost.
 */
export async function chargeAndCreateRecord(params: {
  userId: string;
  type: LoveColumnType;
  cost: number;
  payload: Record<string, unknown>;
  imageUrls?: string[];
}): Promise<string> {
  return await db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, params.userId),
    });
    if (!user || user.pointsBalance < params.cost) {
      throw new Error('insufficient_points');
    }

    const recordId = uuidv4();
    await tx.insert(loveColumnRecords).values({
      id: recordId,
      userId: params.userId,
      type: params.type,
      payload: params.payload,
      imageUrls: params.imageUrls,
      creditsUsed: params.cost,
    });

    await tx
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} - ${params.cost}` })
      .where(eq(users.id, params.userId));

    await tx.insert(pointTransactions).values({
      id: uuidv4(),
      userId: params.userId,
      amount: -params.cost,
      type: 'GENERATE_COST',
      relatedTaskId: recordId,
      description: `${TYPE_LABEL[params.type]} 扣除 ${params.cost} 积分`,
    });

    return recordId;
  });
}

/** Refund a previously charged record (used when generation fails after deduct). */
export async function refundRecord(params: {
  userId: string;
  recordId: string;
  amount: number;
  reason: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} + ${params.amount}` })
      .where(eq(users.id, params.userId));

    await tx.insert(pointTransactions).values({
      id: uuidv4(),
      userId: params.userId,
      amount: params.amount,
      type: 'REFUND',
      relatedTaskId: params.recordId,
      description: params.reason,
    });
  });
}

/**
 * Persist the generated output back into the love-column record so it can be
 * retrieved later in the gallery / history view. Merges output fields into the
 * existing `payload` and (optionally) overwrites the `imageUrls` array.
 */
export async function updateRecordOutput(params: {
  recordId: string;
  output: Record<string, unknown>;
  imageUrls?: string[];
}): Promise<void> {
  const existing = await db.query.loveColumnRecords.findFirst({
    where: eq(loveColumnRecords.id, params.recordId),
  });
  if (!existing) return;

  const existingPayload =
    existing.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload)
      ? (existing.payload as Record<string, unknown>)
      : {};

  const mergedPayload = { ...existingPayload, output: params.output };

  const updateValues: Record<string, unknown> = { payload: mergedPayload };
  if (params.imageUrls && params.imageUrls.length > 0) {
    updateValues.imageUrls = params.imageUrls;
  }

  await db
    .update(loveColumnRecords)
    .set(updateValues)
    .where(eq(loveColumnRecords.id, params.recordId));
}

/**
 * Validate user balance without deducting. Throws 'insufficient_points' if not enough.
 */
export async function ensureBalance(userId: string, cost: number): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.pointsBalance < cost) {
    throw new Error('insufficient_points');
  }
}
