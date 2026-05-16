import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { schedulePipeline } from '@/lib/photo/queue';
import { persistImage } from '@/lib/photo/storage';
import {
  createPhotoTask,
  completePhotoTask,
  failPhotoTask,
} from '@/lib/services/photo-tasks';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/photo/generate
 * multipart/form-data:
 *   - image: File (required)
 *   - specId: string (one_inch / two_inch / passport / ...)
 *   - bgColor?: string (#RRGGBB 或 gradient:#xxx,#yyy)
 *   - suit?: male|female|student|none
 *   - skipAI?: '1' 时跳过 OpenAI / Gemini
 *
 * 返回 { taskId, imageUrl, provider, spec }
 */
export async function POST(req: Request) {
  console.log('[photo/generate] ← request received');
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    console.warn('[photo/generate] unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[photo/generate] user:', session.user.id);

  let taskId: string | null = null;

  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'image required' }, { status: 400 });
    }
    const specId = String(form.get('specId') || 'two_inch');
    const bgColor = form.get('bgColor') ? String(form.get('bgColor')) : undefined;
    const suit = form.get('suit') ? (String(form.get('suit')) as any) : undefined;
    const skipAI = String(form.get('skipAI') || '') === '1';

    console.log('[photo/generate] params', { specId, bgColor, suit, skipAI, fileSize: file.size });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. 落原图
    console.log('[photo/generate] step 1: persist original image');
    const original = await persistImage(buffer, 'png', session.user.id);
    console.log('[photo/generate] step 1 done, url=', original.url);

    // 2. 建任务（扣积分）
    console.log('[photo/generate] step 2: create task (deduct points)');
    taskId = await createPhotoTask({
      userId: session.user.id,
      specId,
      originalImageUrl: original.url,
      promptPayload: { bgColor, suit, skipAI },
    });
    console.log('[photo/generate] step 2 done, taskId=', taskId);

    // 3. 执行流水线
    console.log('[photo/generate] step 3: schedule pipeline');
    const result = await schedulePipeline(buffer, {
      specId,
      bgColor,
      suit,
      skipAI,
    });
    console.log('[photo/generate] step 3 done, provider=', result.provider);

    // 4. 落生成结果
    console.log('[photo/generate] step 4: persist generated image');
    const saved = await persistImage(result.buffer, 'jpg', session.user.id);
    console.log('[photo/generate] step 4 done, url=', saved.url);

    await completePhotoTask({
      taskId,
      userId: session.user.id,
      imageUrl: saved.url,
      result,
    });
    console.log('[photo/generate] → completed successfully');

    return NextResponse.json({
      success: true,
      taskId,
      imageUrl: saved.url,
      provider: result.provider,
      spec: result.spec,
    });
  } catch (err: any) {
    console.error('[photo/generate] error', err);
    if (taskId) {
      await failPhotoTask(taskId, session.user.id, err?.message || 'unknown_error').catch(() => {});
    }
    const status = err?.message === 'insufficient_points' ? 402 : 500;
    return NextResponse.json(
      { error: err?.message || 'internal_error' },
      { status }
    );
  }
}
