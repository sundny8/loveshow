import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { persistImage } from '@/lib/photo/storage';
import { generateImage } from '@/lib/love-column/gemini-image';
import {
  buildCouplePhotoPrompt,
  PHOTO_SCENES,
  type PhotoScene,
} from '@/lib/love-column/prompts/photo';
import {
  chargeAndCreateRecord,
  refundRecord,
  updateRecordOutput,
  COST_PHOTO,
} from '@/lib/love-column/credits';
import { moderatePrompt, joinPrompts } from '@/lib/moderation';

export const runtime = 'nodejs';
export const maxDuration = 180;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = formData.get('file');
  const scene = String(formData.get('scene') || '') as PhotoScene;
  const customNote = String(formData.get('note') || '').trim() || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }
  if (!PHOTO_SCENES.find((s) => s.id === scene)) {
    return NextResponse.json({ error: 'invalid_scene' }, { status: 400 });
  }

  // Pre-generation moderation: screen scene + custom note before any model runs.
  const moderation = await moderatePrompt(
    joinPrompts(scene, customNote),
    `user_${userId}:couple-photo`
  );
  if (!moderation.allowed) {
    return NextResponse.json(
      {
        error: 'prompt_rejected',
        reason: moderation.reason,
        message:
          '您输入的内容未通过内容安全审核。请修改后重试。LoveShow 严禁生成 NSFW、未成年人相关、仇恨、暴力等违规内容。',
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalStored = await persistImage(buffer, 'jpg', userId);

  let recordId: string | null = null;
  try {
    recordId = await chargeAndCreateRecord({
      userId,
      type: 'couple-photo',
      cost: COST_PHOTO,
      payload: { scene, customNote, originalUrl: originalStored.url },
    });
  } catch (err: any) {
    if (err?.message === 'insufficient_points') {
      return NextResponse.json({ error: 'insufficient_points' }, { status: 402 });
    }
    return NextResponse.json({ error: 'charge_failed' }, { status: 500 });
  }

  try {
    const prompt = buildCouplePhotoPrompt({ scene, customNote });
    const { buffer: outBuf } = await generateImage({
      prompt,
      references: [{ buffer, mimeType: 'image/png' }],
    });

    const stored = await persistImage(outBuf, 'png', userId);

    // Persist output so it shows up in the gallery / history view.
    await updateRecordOutput({
      recordId,
      output: { imageUrl: stored.url },
      imageUrls: [stored.url],
    }).catch((e) => console.warn('[love-column/couple-photo] persist output failed:', e));

    return NextResponse.json({
      success: true,
      recordId,
      imageUrl: stored.url,
      originalUrl: originalStored.url,
      cost: COST_PHOTO,
    });
  } catch (err: any) {
    console.error('[love-column/couple-photo] failed', err);
    if (recordId) {
      await refundRecord({
        userId,
        recordId,
        amount: COST_PHOTO,
        reason: '情侣写真生成失败自动退款',
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: 'generation_failed', message: err?.message || 'unknown' },
      { status: 500 }
    );
  }
}
