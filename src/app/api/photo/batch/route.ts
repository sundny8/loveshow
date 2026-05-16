import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { schedulePipeline } from '@/lib/photo/queue';
import { persistImage } from '@/lib/photo/storage';
import {
  createPhotoTask,
  completePhotoTask,
  failPhotoTask,
} from '@/lib/services/photo-tasks';

export const runtime = 'nodejs';
export const maxDuration = 180;

/**
 * POST /api/photo/batch
 * multipart/form-data:
 *   - images: File[] (<=20)
 *   - specId / bgColor / suit / skipAI 同 /generate
 *
 * 立即返回 { batchId, taskIds }，实际生成在后台排队。
 * 客户端通过 GET /api/photo/tasks?batchId=xxx 轮询进度。
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll('images').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'images required' }, { status: 400 });
  }
  if (files.length > 20) {
    return NextResponse.json({ error: 'max 20 images per batch' }, { status: 400 });
  }

  const specId = String(form.get('specId') || 'two_inch');
  const bgColor = form.get('bgColor') ? String(form.get('bgColor')) : undefined;
  const suit = form.get('suit') ? (String(form.get('suit')) as any) : undefined;
  const skipAI = String(form.get('skipAI') || '') === '1';

  const batchId = uuidv4();
  const userId = session.user.id;
  const taskIds: string[] = [];

  // 先同步把原图持久化并建任务 + 扣积分；AI 生成异步
  const pendings: Array<{ taskId: string; buffer: Buffer }> = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const original = await persistImage(buffer, 'png');
    try {
      const taskId = await createPhotoTask({
        userId,
        specId,
        batchId,
        originalImageUrl: original.url,
        promptPayload: { bgColor, suit, skipAI },
      });
      taskIds.push(taskId);
      pendings.push({ taskId, buffer });
    } catch (err: any) {
      if (err?.message === 'insufficient_points') {
        // 积分不够：剩余任务不再入队，返回已建的部分
        return NextResponse.json(
          {
            error: 'insufficient_points',
            partial: true,
            batchId,
            taskIds,
          },
          { status: 402 }
        );
      }
      throw err;
    }
  }

  // 异步执行（不等待）
  void (async () => {
    for (const { taskId, buffer } of pendings) {
      try {
        const result = await schedulePipeline(buffer, { specId, bgColor, suit, skipAI });
        const saved = await persistImage(result.buffer, 'jpg');
        await completePhotoTask({ taskId, userId, imageUrl: saved.url, result });
      } catch (err: any) {
        console.error('[photo/batch] pipeline failed', taskId, err);
        await failPhotoTask(taskId, userId, err?.message || 'pipeline_error').catch(() => {});
      }
    }
  })();

  return NextResponse.json({ success: true, batchId, taskIds });
}
