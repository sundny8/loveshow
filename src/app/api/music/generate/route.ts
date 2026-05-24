import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, musicTasks, pointTransactions, users } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { generateMusic } from '@/lib/suno';
import { COST_PER_MUSIC, STYLE_EN_MAP, MOOD_EN_MAP } from '@/lib/music/constants';
import {
  combineUserText,
  moderatePrompt,
  moderationErrorResponse,
} from '@/lib/moderation';

export const runtime = 'nodejs';
export const maxDuration = 120;

async function generateLyrics(theme: string, durationSec: number, style: string, mood: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no_openai_key');

  const baseURL = (process.env.OPENAI_URL || 'https://api.openai.com').replace(/\/$/, '');
  // Suno 每行歌词演唱约 5-6 秒，为了让生成的歌曲贴近目标时长，
  // 只生成 ~70% 目标时长的歌词（剩余时间留给前奏/尾奏）
  const effectiveSec = Math.max(20, Math.round(durationSec * 0.7));
  const targetLines = Math.max(3, Math.min(30, Math.round(effectiveSec / 5)));
  const systemPrompt = `You are a professional lyricist. Write song lyrics in the same language as the theme provided. Output ONLY the lyrics — no explanations, no titles, no section labels like [Verse] or [Chorus]. Keep each line SHORT (5-8 words max, so it sings in ~5 seconds). You MUST write EXACTLY ${targetLines} lines, no more, no less.`;
  const userPrompt = `Theme: ${theme}
Style: ${style || 'pop'}
Mood: ${mood || 'neutral'}
Target song duration: ${durationSec} seconds
Write exactly ${targetLines} short lines of lyrics now:`;

  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 800,
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`lyrics_gen_failed: ${res.status}`);
  const json = await res.json();
  return (json.choices?.[0]?.message?.content || '').trim();
}

/**
 * POST /api/music/generate
 * Body: { prompt, style?, title?, customMode, instrumental, model, vocalGender?, mood?, vocalStyle?, duration? }
 *
 * 返回 { success: true, taskId }
 */
export async function POST(req: Request) {
  console.log('[music/generate] ← request received');
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    console.warn('[music/generate] unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[music/generate] user:', session.user.id);

  let localTaskId: string | null = null;

  try {
    const body = await req.json();
    const {
      prompt,
      style,
      title,
      customMode = false,
      instrumental = false,
      model = 'V4_5ALL',
      vocalGender,
      mood,
      vocalStyle,
      duration,
    } = body;

    // 参数校验
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const trimmedPrompt = prompt.trim();
    const maxPromptLen = customMode ? 5000 : 500;
    if (trimmedPrompt.length > maxPromptLen) {
      return NextResponse.json(
        { error: `prompt too long, max ${maxPromptLen} characters` },
        { status: 400 },
      );
    }

    // Creem moderation: screen the user-supplied music prompt + any custom
    // style/title/mood text BEFORE charging points or calling Suno.
    const moderation = await moderatePrompt({
      prompt: combineUserText([
        trimmedPrompt,
        typeof title === 'string' ? title : null,
        typeof style === 'string' ? style : null,
        typeof mood === 'string' ? mood : null,
        typeof vocalStyle === 'string' ? vocalStyle : null,
      ]),
      externalId: `user_${session.user.id}:music`,
    });
    if (!moderation.ok) return moderationErrorResponse(moderation);

    const hasAdvancedOptions = !!(style || mood || vocalStyle || duration);
    const useSunoCustomMode = customMode || hasAdvancedOptions;

    const sunoStyle = style ? (STYLE_EN_MAP[style] || style) : undefined;
    const sunoTitle = title || trimmedPrompt.slice(0, 80);

    let sunoVocalGender: 'm' | 'f' | undefined = undefined;
    if (vocalStyle === 'm') sunoVocalGender = 'm';
    else if (vocalStyle === 'f') sunoVocalGender = 'f';
    else if (vocalStyle === 'duet') sunoVocalGender = 'f'; // Suno 不支持 duet，设 f 配合 prompt hint 实现对唱效果
    else if (vocalGender === 'm' || vocalGender === 'f') sunoVocalGender = vocalGender;

    const durSecMap: Record<string, number> = { '30s': 30, '1m': 60, '2m': 120, '4m': 240 };
    const sunoDuration = duration ? durSecMap[duration] : undefined;

    let sunoPrompt = trimmedPrompt;
    // Suno API 没有原生 duration 参数。官方支持参数仅为：
    // customMode/instrumental/model/callBackUrl/prompt/style/title/
    // negativeTags/vocalGender/styleWeight/weirdnessConstraint/audioWeight
    // 所以时长只能通过：1) 缩短歌词 2) 往 style 注入 short/radio-edit 标签 3) negativeTags 屏蔽长尾奏
    let sunoStyleWithDuration = sunoStyle;
    let sunoNegativeTags: string | undefined = undefined;

    if (useSunoCustomMode) {
      // 简单模式有高级选项时：用 AI 根据主题生成歌词（严格控制行数 ≈ 时长）
      if (!customMode && !instrumental) {
        try {
          const generatedLyrics = await generateLyrics(
            trimmedPrompt,
            sunoDuration || 120,
            sunoStyle || '',
            MOOD_EN_MAP[mood] || mood || '',
          );
          console.log('[music/generate] AI lyrics generated, length=', generatedLyrics.length, 'lines=', generatedLyrics.split('\n').filter(Boolean).length);
          sunoPrompt = generatedLyrics;
        } catch (lyricsErr: any) {
          console.warn('[music/generate] lyrics gen failed, using theme as prompt:', lyricsErr.message);
        }
      }

      // 时长注入 style 字段 —— Suno 模型对 style 里的结构/长度关键词响应较好
      if (sunoDuration) {
        const lenTag =
          sunoDuration <= 30 ? 'very short jingle, 30 seconds, no intro, no outro, radio edit'
          : sunoDuration <= 60 ? 'short song, about 1 minute, minimal intro, quick outro, radio edit'
          : sunoDuration <= 120 ? 'compact song, about 2 minutes, concise arrangement'
          : 'standard length, about 4 minutes';
        sunoStyleWithDuration = sunoStyle ? `${sunoStyle}, ${lenTag}` : lenTag;
        // 用 negativeTags 抑制 Suno 默认的长前奏/间奏/尾奏
        if (sunoDuration <= 120) {
          sunoNegativeTags = 'extended instrumental, long intro, long outro, instrumental breakdown, guitar solo, extended solo';
        }
      }

      // 其余仍注入 prompt 头部作为强调
      const hints: string[] = [];
      if (vocalStyle === 'duet') hints.push('[Duet: male & female vocals alternating throughout the song, both voices must appear]');
      else if (vocalStyle === 'chorus') hints.push('[Choir: multiple voices harmonizing]');
      if (mood) hints.push(`[Mood: ${MOOD_EN_MAP[mood] || mood}]`);
      if (sunoDuration && sunoDuration < 240) hints.push(`[Length: ~${sunoDuration}s, end song quickly, no extended outro]`);

      if (hints.length > 0) {
        sunoPrompt = hints.join(' ') + '\n\n' + sunoPrompt;
      }
      console.log('[music/generate] CUSTOM mode, style=', sunoStyleWithDuration, 'vocalGender=', sunoVocalGender, 'duration=', sunoDuration, 'negativeTags=', sunoNegativeTags, '→ prompt:', sunoPrompt.slice(0, 300));
    } else {
      console.log('[music/generate] SIMPLE mode → prompt:', sunoPrompt.slice(0, 200));
    }

    // 1. 事务：扣积分 + 创建本地任务
    console.log('[music/generate] step 1: create task & deduct points');
    localTaskId = await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, session!.user.id),
      });
      if (!user || user.pointsBalance < COST_PER_MUSIC) {
        throw new Error('insufficient_points');
      }

      const taskId = uuidv4();
      await tx.insert(musicTasks).values({
        id: taskId,
        userId: session!.user.id,
        status: 'PENDING',
        prompt: trimmedPrompt,
        style: style || null,
        title: title || null,
        instrumental,
        model,
        customMode,
        costPoints: COST_PER_MUSIC,
      });

      await tx
        .update(users)
        .set({ pointsBalance: sql`${users.pointsBalance} - ${COST_PER_MUSIC}` })
        .where(eq(users.id, session!.user.id));

      await tx.insert(pointTransactions).values({
        id: uuidv4(),
        userId: session!.user.id,
        amount: -COST_PER_MUSIC,
        type: 'GENERATE_COST',
        relatedTaskId: taskId,
        description: `AI 音乐生成扣除 ${COST_PER_MUSIC} 积分`,
      });

      return taskId;
    });

    console.log('[music/generate] step 1 done, localTaskId=', localTaskId);

    // 2. 调用 Suno API
    console.log('[music/generate] step 2: call Suno API');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callBackUrl = `${appUrl}/api/music/callback`;

    const result = await generateMusic({
      prompt: sunoPrompt,
      style: useSunoCustomMode ? sunoStyleWithDuration : undefined,
      title: useSunoCustomMode ? sunoTitle : undefined,
      customMode: useSunoCustomMode,
      instrumental,
      model,
      callBackUrl,
      vocalGender: sunoVocalGender,
      negativeTags: sunoNegativeTags,
    });

    console.log('[music/generate] step 2 done, sunoTaskId=', result.taskId);

    // 3. 更新本地任务
    await db
      .update(musicTasks)
      .set({
        sunoTaskId: result.taskId,
        status: 'GENERATING',
      })
      .where(eq(musicTasks.id, localTaskId));

    console.log('[music/generate] → completed, returning taskId');

    return NextResponse.json({
      success: true,
      taskId: localTaskId,
    });
  } catch (err: any) {
    console.error('[music/generate] error', err);

    if (localTaskId) {
      const message = err?.message || 'unknown_error';
      await db.transaction(async (tx) => {
        const task = await tx.query.musicTasks.findFirst({
          where: eq(musicTasks.id, localTaskId!),
        });
        if (!task) return;

        await tx
          .update(musicTasks)
          .set({ status: 'FAILED', errorMessage: message })
          .where(eq(musicTasks.id, localTaskId!));

        if (task.costPoints > 0) {
          await tx
            .update(users)
            .set({ pointsBalance: sql`${users.pointsBalance} + ${task.costPoints}` })
            .where(eq(users.id, session.user.id));

          await tx.insert(pointTransactions).values({
            id: uuidv4(),
            userId: session.user.id,
            amount: task.costPoints,
            type: 'REFUND',
            relatedTaskId: localTaskId!,
            description: `AI 音乐生成失败自动退还 ${task.costPoints} 积分`,
          });
        }
      }).catch(() => {});
    }

    const status = err?.message === 'insufficient_points' ? 402 : 500;
    return NextResponse.json(
      { error: err?.message || 'internal_error' },
      { status },
    );
  }
}
