import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { completeText } from '@/lib/love-column/openai-text';
import {
  buildCopySystemPrompt,
  buildCopyUserPrompt,
  COPY_STYLES,
  type CopyStyle,
} from '@/lib/love-column/prompts/copy';
import {
  chargeAndCreateRecord,
  refundRecord,
  updateRecordOutput,
  COST_COPY,
} from '@/lib/love-column/credits';
import {
  combineUserText,
  moderatePrompt,
  moderationErrorResponse,
} from '@/lib/moderation';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 收束性标点：中英句号、问号、感叹号；用于判定文案是否在完整句子上结尾。
const SENTENCE_END_RE = /[。！？!?.]/;
const SENTENCE_END_GLOBAL_RE = /[。！？!?.]/g;

/**
 * 智能裁剪：保证返回的文本以完整句子收尾。
 *
 * 1. 如果原文已经以句子结束符收尾且长度 <= maxLen + 容差，直接返回。
 * 2. 否则在前 maxLen 字符内查找最后一个句子结束符，截到那为止。
 * 3. 如果找不到句子结束符（极端情况：模型一句话写得超长且没标点），
 *    则在 maxLen 字符内找最后一个空格/换行/逗号断词，并在末尾补一个句号，
 *    避免砍在汉字中间或半句话中间。
 */
function trimToCompleteSentence(raw: string, maxLen: number): string {
  const text = raw.trim();
  if (!text) return text;

  // 容差：模型有时会给出 200~210 字之间的完整句子，按完整保留。
  if (text.length <= maxLen + 20 && SENTENCE_END_RE.test(text.slice(-2))) {
    return text;
  }

  // 在 maxLen 字符内寻找最后一个句子结束符。
  const head = text.slice(0, maxLen);
  let lastEnd = -1;
  let m: RegExpExecArray | null;
  SENTENCE_END_GLOBAL_RE.lastIndex = 0;
  while ((m = SENTENCE_END_GLOBAL_RE.exec(head)) !== null) {
    lastEnd = m.index;
  }
  if (lastEnd >= 0) {
    return head.slice(0, lastEnd + 1).trim();
  }

  // 没有句子结束符 → 退而求其次找断词点（逗号 / 空格 / 换行）。
  const fallbackBreaks = ['\n', '，', ',', ' '];
  for (const sep of fallbackBreaks) {
    const idx = head.lastIndexOf(sep);
    if (idx > maxLen * 0.6) {
      return head.slice(0, idx).trim() + '。';
    }
  }

  // 极端兜底：直接截断并加句号，避免半字。
  return head.trim() + '。';
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const keyword = String(body?.keyword || '').trim();
  const style = String(body?.style || 'sincere') as CopyStyle;
  const scenario = body?.scenario ? String(body.scenario).trim() : undefined;

  if (!keyword) {
    return NextResponse.json({ error: 'missing_keyword' }, { status: 400 });
  }
  if (!COPY_STYLES.find((s) => s.id === style)) {
    return NextResponse.json({ error: 'invalid_style' }, { status: 400 });
  }

  // Creem moderation: screen all user-supplied free text BEFORE charging or
  // calling the model. See https://docs.creem.io/features/moderation
  const moderation = await moderatePrompt({
    prompt: combineUserText([keyword, scenario]),
    externalId: `user_${userId}:copy`,
  });
  if (!moderation.ok) return moderationErrorResponse(moderation);

  let recordId: string | null = null;
  try {
    recordId = await chargeAndCreateRecord({
      userId,
      type: 'copy',
      cost: COST_COPY,
      payload: { keyword, style, scenario },
    });
  } catch (err: any) {
    if (err?.message === 'insufficient_points') {
      return NextResponse.json({ error: 'insufficient_points' }, { status: 402 });
    }
    return NextResponse.json({ error: 'charge_failed' }, { status: 500 });
  }

  try {
    const text = await completeText({
      messages: [
        { role: 'system', content: buildCopySystemPrompt(style) },
        { role: 'user', content: buildCopyUserPrompt({ keyword, style, scenario }) },
      ],
      temperature: 0.9,
      // 充足 token 预算，让模型有空间自然收束（中文 1 字 ≈ 2 tokens，180 字约 360+
      // tokens，再留余量给标点、emoji、换行）
      maxTokens: 800,
    });

    // 二次保险：如果模型产出过长，按"完整句子"收尾，避免直接砍半句。
    const trimmed = trimToCompleteSentence(text, 200);

    // Persist output so it shows up in the gallery / history view.
    await updateRecordOutput({
      recordId,
      output: { text: trimmed },
    }).catch((e) => console.warn('[love-column/copy] persist output failed:', e));

    return NextResponse.json({
      success: true,
      recordId,
      text: trimmed,
      cost: COST_COPY,
    });
  } catch (err: any) {
    console.error('[love-column/copy] generation failed', err);
    if (recordId) {
      await refundRecord({
        userId,
        recordId,
        amount: COST_COPY,
        reason: '520 文案生成失败自动退款',
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: 'generation_failed', message: err?.message || 'unknown' },
      { status: 500 }
    );
  }
}
