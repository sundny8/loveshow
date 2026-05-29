import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { persistImage } from '@/lib/photo/storage';
import { runPortraitPipeline } from '@/lib/photo/portrait-pipeline';
import { COST_PER_PORTRAIT, getPortraitStyle } from '@/lib/photo/portrait-styles';
import {
  createPhotoTask,
  completePhotoTask,
  failPhotoTask,
} from '@/lib/services/photo-tasks';
import {
  moderatePrompt,
  moderationErrorResponse,
} from '@/lib/moderation';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/portrait/generate
 * multipart/form-data:
 *   - image: File (required) — 参考图
 *   - styleId: string (required) — 肖像风格 id
 *   - gender?: 'male' | 'female' | 'auto' — 默认为 auto
 *
 * 返回 { taskId, imageUrl, provider, styleId, styleName }
 */
export async function POST(req: Request) {
  console.log('[portrait/generate] ← request received');
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    console.warn('[portrait/generate] unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[portrait/generate] user:', session.user.id);

  let taskId: string | null = null;

  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'image required' }, { status: 400 });
    }

    const styleId = form.get('styleId') ? String(form.get('styleId')) : null;
    if (!styleId) {
      return NextResponse.json({ error: 'styleId required' }, { status: 400 });
    }

    const gender = (form.get('gender') ? String(form.get('gender')) : 'auto') as
      | 'male'
      | 'female'
      | 'auto';

    console.log('[portrait/generate] params', { styleId, gender, fileSize: file.size });

    // Creem moderation: screen the generation intent BEFORE any billing or
    // model invocation. Although inputs are enum-based (no free-text), Creem
    // requires moderation on every image generation path.
    const style = getPortraitStyle(styleId);
    const styleName = style?.name || styleId;
    const moderationPrompt = `Generate AI portrait photo: style=${styleName}, gender=${gender}`;
    const moderation = await moderatePrompt({
      prompt: moderationPrompt,
      externalId: `user_${session.user.id}:portrait`,
    });
    if (!moderation.ok) return moderationErrorResponse(moderation);

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. 落原图
    console.log('[portrait/generate] step 1: persist original image');
    const original = await persistImage(buffer, 'png', session.user.id);
    console.log('[portrait/generate] step 1 done, url=', original.url);

    // 2. 建任务（扣积分）
    console.log('[portrait/generate] step 2: create task (deduct points)');
    taskId = await createPhotoTask({
      userId: session.user.id,
      specId: styleId,
      originalImageUrl: original.url,
      cost: COST_PER_PORTRAIT,
      platform: 'portrait',
      promptPayload: { gender, styleId },
    });
    console.log('[portrait/generate] step 2 done, taskId=', taskId);

    // 3. 执行肖像流水线
    console.log('[portrait/generate] step 3: run portrait pipeline');
    const result = await runPortraitPipeline(buffer, { styleId, gender });
    console.log('[portrait/generate] step 3 done, provider=', result.provider);

    // 4. 落生成结果
    console.log('[portrait/generate] step 4: persist generated image');
    const saved = await persistImage(result.buffer, 'jpg', session.user.id);
    console.log('[portrait/generate] step 4 done, url=', saved.url);

    await completePhotoTask({
      taskId,
      userId: session.user.id,
      imageUrl: saved.url,
      result: {
        buffer: result.buffer,
        mime: 'image/jpeg',
        provider: result.provider,
        spec: {
          id: result.styleId,
          label: result.styleName,
          width: 1200,
          height: 1600,
          dpi: 300,
          bgColor: '#FFFFFF',
          suitHint: 'none',
          description: result.styleName,
        },
        gender: result.gender,
        ageBucket: 'adult',
        skinTone: 'medium',
      },
    });
    console.log('[portrait/generate] → completed successfully');

    return NextResponse.json({
      success: true,
      taskId,
      imageUrl: saved.url,
      provider: result.provider,
      styleId: result.styleId,
      styleName: result.styleName,
    });
  } catch (err: any) {
    console.error('[portrait/generate] error', err);
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
