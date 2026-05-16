import { db, imageTasks, generatedImages, pointTransactions, users } from "@/db";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function createGenerationTask({
  userId,
  platform,
  prompt,
  originalImageUrl,
  costPoints = 10,
}: {
  userId: string;
  platform: string;
  prompt: string;
  originalImageUrl: string;
  costPoints?: number;
}) {
  return await db.transaction(async (tx) => {
    // 1. Check user points
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.pointsBalance < costPoints) {
      throw new Error("Insufficient points");
    }

    // 2. Create task
    const taskId = uuidv4();
    await tx.insert(imageTasks).values({
      id: taskId,
      userId,
      platform,
      promptPayload: { prompt },
      originalImageUrl,
      costPoints,
      status: "PROCESSING",
    });

    // 3. Deduct points
    await tx
      .update(users)
      .set({ pointsBalance: sql`${users.pointsBalance} - ${costPoints}` })
      .where(eq(users.id, userId));

    // 4. Record transaction
    await tx.insert(pointTransactions).values({
      id: uuidv4(),
      userId,
      amount: -costPoints,
      type: "GENERATE_COST",
      relatedTaskId: taskId,
      description: `AI 生成商品图消耗 ${costPoints} 积分`,
    });

    return taskId;
  });
}

export async function completeTask(taskId: string, imageUrls: string[]) {
  return await db.transaction(async (tx) => {
    const task = await tx.query.imageTasks.findFirst({
      where: eq(imageTasks.id, taskId),
    });

    if (!task) throw new Error("Task not found");

    // 1. Update task status
    await tx
      .update(imageTasks)
      .set({ status: "COMPLETED", completedAt: new Date() })
      .where(eq(imageTasks.id, taskId));

    // 2. Insert generated images
    for (const url of imageUrls) {
      await tx.insert(generatedImages).values({
        id: uuidv4(),
        taskId,
        userId: task.userId,
        imageUrl: url,
      });
    }
  });
}

export async function failTask(taskId: string, errorMessage: string) {
  // Refund points if needed (policy dependent)
  // For now, just mark fail
  await db
    .update(imageTasks)
    .set({ status: "FAILED", errorMessage })
    .where(eq(imageTasks.id, taskId));
}
