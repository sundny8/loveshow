import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { persistImage } from '@/lib/photo/storage';
import { generateImage } from '@/lib/love-column/gemini-image';
import {
  buildAvatarPrompt,
  AVATAR_STYLES,
  type AvatarStyle,
} from '@/lib/love-column/prompts/avatar';
import {
  chargeAndCreateRecord,
  refundRecord,
  updateRecordOutput,
  COST_AVATAR,
} from '@/lib/love-column/credits';
import { moderatePrompt, moderationErrorResponse } from '@/lib/moderation';

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
  const style = String(formData.get('style') || '') as AvatarStyle;
  const customNote = String(formData.get('note') || '').trim() || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }
  if (!AVATAR_STYLES.find((s) => s.id === style)) {
    return NextResponse.json({ error: 'invalid_style' }, { status: 400 });
  }

  // Waffo scan-prompt: screen the user note before charging or model use.
  // calling the image model. Empty notes pass through trivially.
  if (customNote) {
    const moderation = await moderatePrompt({
      prompt: customNote,
      externalId: `user_${userId}:couple-avatar`,
    });
    if (!moderation.ok) return moderationErrorResponse(moderation);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalStored = await persistImage(buffer, 'jpg', userId);

  let recordId: string | null = null;
  try {
    recordId = await chargeAndCreateRecord({
      userId,
      type: 'couple-avatar',
      cost: COST_AVATAR,
      payload: { style, customNote, originalUrl: originalStored.url },
    });
  } catch (err: any) {
    if (err?.message === 'insufficient_points') {
      return NextResponse.json({ error: 'insufficient_points' }, { status: 402 });
    }
    return NextResponse.json({ error: 'charge_failed' }, { status: 500 });
  }

  try {
    const prompt = buildAvatarPrompt({ style, customNote });
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
    }).catch((e) => console.warn('[love-column/couple-avatar] persist output failed:', e));

    return NextResponse.json({
      success: true,
      recordId,
      imageUrl: stored.url,
      originalUrl: originalStored.url,
      cost: COST_AVATAR,
    });
  } catch (err: any) {
    console.error('[love-column/couple-avatar] failed', err);
    if (recordId) {
      await refundRecord({
        userId,
        recordId,
        amount: COST_AVATAR,
        reason: '情侣大头贴生成失败自动退款',
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: 'generation_failed', message: err?.message || 'unknown' },
      { status: 500 }
    );
  }
}
