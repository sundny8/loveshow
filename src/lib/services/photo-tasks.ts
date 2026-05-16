import { db, imageTasks, generatedImages, pointTransactions, users } from '@/db';
import { eq, sql, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { COST_PER_PHOTO } from '@/lib/photo/specs';
import type { PipelineResult } from '@/lib/photo/pipeline';

/**
 * 创建一条证件照任务并扣除积分。事务内完成：
 *  1. 校验用户余额 ≥ cost
 *  2. 插入 imageTasks (status = PROCESSING)
 *  3. 扣减 users.pointsBalance
 *  4. 记录 pointTransactions
 */
export async function createPhotoTask(params: {
  userId: string;
  specId: string;
  originalImageUrl?: string;
  batchId?: string;
  cost?: number;
  platform?: string;
  promptPayload?: Record<string, unknown>;
}): Promise<string> {
  const cost = params.cost ?? COST_PER_PHOTO;
  const platform = params.platform ?? 'photo';
  const descPrefix = platform === 'portrait' ? 'AI 肖像照' : 'AI 证件照';

  return await db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, params.userId),
    });
    if (!user || user.pointsBalance < cost) {
      throw new Error('insufficient_points');
    }

    const taskId = uuidv4();
    await tx.insert(imageTasks).values({
      id: taskId,
      userId: params.userId,
      platform,
      specId: params.specId,
      batchId: params.batchId,
      promptPayload: params.promptPayload ?? {},
      originalImageUrl: params.originalImageUrl,
      costPoints: cost,
      status: 'PROCESSING',
    });

    await tx
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} - ${cost}` })
      .where(eq(users.id, params.userId));

    await tx.insert(pointTransactions).values({
      id: uuidv4(),
      userId: params.userId,
      amount: -cost,
      type: 'GENERATE_COST',
      relatedTaskId: taskId,
      description: `${descPrefix}生成扣除 ${cost} 积分`,
    });

    return taskId;
  });
}

export async function completePhotoTask(params: {
  taskId: string;
  userId: string;
  imageUrl: string;
  result: PipelineResult;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(imageTasks)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        aiProvider: params.result.provider,
        gender: params.result.gender,
        ageBucket: params.result.ageBucket,
        skinTone: params.result.skinTone,
      })
      .where(eq(imageTasks.id, params.taskId));

    await tx.insert(generatedImages).values({
      id: uuidv4(),
      taskId: params.taskId,
      userId: params.userId,
      imageUrl: params.imageUrl,
      width: params.result.spec.width,
      height: params.result.spec.height,
    });
  });
}

export async function failPhotoTask(
  taskId: string,
  userId: string,
  errorMessage: string,
  refund = true
): Promise<void> {
  await db.transaction(async (tx) => {
    const task = await tx.query.imageTasks.findFirst({
      where: eq(imageTasks.id, taskId),
    });
    if (!task) return;

    await tx
      .update(imageTasks)
      .set({ status: 'FAILED', errorMessage })
      .where(eq(imageTasks.id, taskId));

    if (refund && task.costPoints > 0) {
      await tx
        .update(users)
        .set({ pointsBalance: sql`${users.pointsBalance} + ${task.costPoints}` })
        .where(eq(users.id, userId));
      await tx.insert(pointTransactions).values({
        id: uuidv4(),
        userId,
        amount: task.costPoints,
        type: 'REFUND',
        relatedTaskId: taskId,
        description: `任务失败自动退还 ${task.costPoints} 积分`,
      });
    }
  });
}

export async function getPhotoTask(taskId: string, userId: string) {
  const task = await db.query.imageTasks.findFirst({
    where: and(eq(imageTasks.id, taskId), eq(imageTasks.userId, userId)),
  });
  if (!task) return null;
  const images = await db.query.generatedImages.findMany({
    where: eq(generatedImages.taskId, taskId),
    orderBy: [desc(generatedImages.createdAt)],
  });
  return { task, images };
}

export async function listPhotoTasks(userId: string, limit = 30) {
  return db.query.imageTasks.findMany({
    where: and(eq(imageTasks.userId, userId), eq(imageTasks.platform, 'photo')),
    orderBy: [desc(imageTasks.createdAt)],
    limit,
  });
}

export async function listPhotoImages(userId: string, limit = 60) {
  return db.query.generatedImages.findMany({
    where: eq(generatedImages.userId, userId),
    orderBy: [desc(generatedImages.createdAt)],
    limit,
  });
}
