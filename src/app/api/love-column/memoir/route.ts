import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { persistImage } from '@/lib/photo/storage';
import { completeText } from '@/lib/love-column/openai-text';
import {
  buildMemoirSystemPrompt,
  buildMemoirUserPrompt,
  type MemoirTimelineItem,
} from '@/lib/love-column/prompts/memoir';
import {
  chargeAndCreateRecord,
  refundRecord,
  updateRecordOutput,
  COST_MEMOIR,
} from '@/lib/love-column/credits';
import { moderatePrompt, joinPrompts } from '@/lib/moderation';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_PHOTOS = 6;

function parseTimeline(raw: string): MemoirTimelineItem[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((line) => {
      // Accept "date|event" or "date：event" or "date event"
      const sep = line.match(/[|｜：:]/);
      if (sep && sep.index !== undefined) {
        return {
          date: line.slice(0, sep.index).trim(),
          event: line.slice(sep.index + 1).trim(),
        };
      }
      return { date: '', event: line };
    });
}

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

  const files = formData.getAll('files').filter((v): v is File => v instanceof File);
  const title = String(formData.get('title') || '').trim() || undefined;
  const timelineRaw = String(formData.get('timeline') || '').trim();
  const chatExcerpt = String(formData.get('chat') || '').trim();
  const extraNote = String(formData.get('note') || '').trim() || undefined;

  if (files.length === 0) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }
  if (!timelineRaw || !chatExcerpt) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (files.length > MAX_PHOTOS) {
    return NextResponse.json({ error: 'too_many_files' }, { status: 400 });
  }

  const timeline = parseTimeline(timelineRaw);
  if (!timeline.length) {
    return NextResponse.json({ error: 'invalid_timeline' }, { status: 400 });
  }

  // Pre-generation moderation: screen all free-text inputs.
  const moderation = await moderatePrompt(
    joinPrompts(title, timelineRaw, chatExcerpt, extraNote),
    `user_${userId}:memoir`
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

  // Persist photos first so we have URLs to splice into the rendered memoir.
  const photoUrls: string[] = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const stored = await persistImage(buf, 'jpg', userId);
    photoUrls.push(stored.url);
  }

  let recordId: string | null = null;
  try {
    recordId = await chargeAndCreateRecord({
      userId,
      type: 'memoir',
      cost: COST_MEMOIR,
      payload: { title, timeline, chatExcerpt, extraNote },
      imageUrls: photoUrls,
    });
  } catch (err: any) {
    if (err?.message === 'insufficient_points') {
      return NextResponse.json({ error: 'insufficient_points' }, { status: 402 });
    }
    return NextResponse.json({ error: 'charge_failed' }, { status: 500 });
  }

  try {
    const draft = await completeText({
      messages: [
        { role: 'system', content: buildMemoirSystemPrompt() },
        {
          role: 'user',
          content: buildMemoirUserPrompt({
            photoCount: photoUrls.length,
            timeline,
            chatExcerpt,
            title,
            extraNote,
          }),
        },
      ],
      temperature: 0.85,
      maxTokens: 2400,
    });

    // Replace [[PHOTO_n]] placeholders with markdown image links so the panel renders inline.
    let rendered = draft;
    photoUrls.forEach((url, idx) => {
      const re = new RegExp(`\\[\\[PHOTO_${idx + 1}\\]\\]`, 'g');
      rendered = rendered.replace(re, `\n\n![photo-${idx + 1}](${url})\n\n`);
    });
    // Drop unused placeholders if model wrote more than provided.
    rendered = rendered.replace(/\[\[PHOTO_\d+\]\]/g, '');

    // Persist output so it shows up in the gallery / history view.
    await updateRecordOutput({
      recordId,
      output: { memoir: rendered, photos: photoUrls },
    }).catch((e) => console.warn('[love-column/memoir] persist output failed:', e));

    return NextResponse.json({
      success: true,
      recordId,
      memoir: rendered,
      photos: photoUrls,
      cost: COST_MEMOIR,
    });
  } catch (err: any) {
    console.error('[love-column/memoir] failed', err);
    if (recordId) {
      await refundRecord({
        userId,
        recordId,
        amount: COST_MEMOIR,
        reason: '恋爱回忆录生成失败自动退款',
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: 'generation_failed', message: err?.message || 'unknown' },
      { status: 500 }
    );
  }
}
