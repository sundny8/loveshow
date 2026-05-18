import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { persistImage } from '@/lib/photo/storage';
import { completeText } from '@/lib/love-column/openai-text';
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
} from '@/lib/love-column/prompts/analysis';
import {
  chargeAndCreateRecord,
  refundRecord,
  updateRecordOutput,
  COST_ANALYSIS,
} from '@/lib/love-column/credits';
import { moderatePrompt, joinPrompts } from '@/lib/moderation';

export const runtime = 'nodejs';
export const maxDuration = 90;

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
  const durationStr = String(formData.get('durationMonths') || '0');
  const durationMonths = Math.max(0, Math.floor(Number(durationStr) || 0));
  const metAt = String(formData.get('metAt') || '').trim();
  const extraNote = String(formData.get('note') || '').trim() || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }
  if (!metAt) {
    return NextResponse.json({ error: 'missing_metAt' }, { status: 400 });
  }

  // Pre-generation moderation: screen the user-supplied free-text fields.
  const moderation = await moderatePrompt(
    joinPrompts(metAt, extraNote),
    `user_${userId}:analysis`
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
      type: 'analysis',
      cost: COST_ANALYSIS,
      payload: { durationMonths, metAt, extraNote, originalUrl: originalStored.url },
    });
  } catch (err: any) {
    if (err?.message === 'insufficient_points') {
      return NextResponse.json({ error: 'insufficient_points' }, { status: 402 });
    }
    return NextResponse.json({ error: 'charge_failed' }, { status: 500 });
  }

  try {
    const report = await completeText({
      messages: [
        { role: 'system', content: buildAnalysisSystemPrompt() },
        {
          role: 'user',
          content: buildAnalysisUserPrompt({ durationMonths, metAt, extraNote }),
        },
      ],
      temperature: 0.85,
      maxTokens: 1800,
    });

    // Persist output so it shows up in the gallery / history view.
    await updateRecordOutput({
      recordId,
      output: { report },
    }).catch((e) => console.warn('[love-column/analysis] persist output failed:', e));

    return NextResponse.json({
      success: true,
      recordId,
      report,
      originalUrl: originalStored.url,
      cost: COST_ANALYSIS,
    });
  } catch (err: any) {
    console.error('[love-column/analysis] failed', err);
    if (recordId) {
      await refundRecord({
        userId,
        recordId,
        amount: COST_ANALYSIS,
        reason: '情感分析生成失败自动退款',
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: 'generation_failed', message: err?.message || 'unknown' },
      { status: 500 }
    );
  }
}
