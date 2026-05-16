import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, imageTasks, generatedImages } from '@/db';

export const runtime = 'nodejs';

/**
 * GET /api/photo/tasks?batchId=xxx&limit=30
 * 列出当前用户的证件照任务（及其首张生成图，用于卡片缩略图）。
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const batchId = url.searchParams.get('batchId') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 30), 100);

  const conditions = [
    eq(imageTasks.userId, session.user.id),
    eq(imageTasks.platform, 'photo'),
  ];
  if (batchId) conditions.push(eq(imageTasks.batchId, batchId));

  const tasks = await db.query.imageTasks.findMany({
    where: and(...conditions),
    orderBy: [desc(imageTasks.createdAt)],
    limit,
  });

  const taskIds = tasks.map((t) => t.id);
  const rawImages = taskIds.length
    ? await db.query.generatedImages.findMany({
        where: and(
          eq(generatedImages.userId, session.user.id),
          eq(generatedImages.isDeleted, false),
          inArray(generatedImages.taskId, taskIds)
        ),
        orderBy: [desc(generatedImages.createdAt)],
      })
    : [];

  const imgByTask = new Map<string, string>();
  for (const img of rawImages) {
    if (!imgByTask.has(img.taskId)) imgByTask.set(img.taskId, img.imageUrl);
  }

  return NextResponse.json({
    success: true,
    tasks: tasks.map((t) => ({
      id: t.id,
      status: t.status,
      specId: t.specId,
      aiProvider: t.aiProvider,
      errorMessage: t.errorMessage,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      batchId: t.batchId,
      thumbnail: imgByTask.get(t.id) ?? null,
    })),
    images: rawImages.map((img) => ({
      id: img.id,
      taskId: img.taskId,
      url: img.imageUrl,
      createdAt: img.createdAt,
    })),
  });
}
