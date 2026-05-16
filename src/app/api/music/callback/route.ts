import { NextRequest, NextResponse } from 'next/server';
import { db, musicTasks } from '@/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * POST /api/music/callback
 * Suno API webhook 回调 — 当音乐生成完成时 Suno 会主动推送结果。
 * 前端以轮询为主，此端点作为补充：收到回调后更新数据库。
 */
export async function POST(req: NextRequest) {
  console.log('[music/callback] ← received from Suno');

  try {
    const body = await req.json();
    console.log('[music/callback] payload:', JSON.stringify(body).slice(0, 500));

    const { taskId, status, data } = body;

    if (!taskId) {
      console.warn('[music/callback] no taskId in payload');
      return NextResponse.json({ code: 200, msg: 'ok' });
    }

    // 根据 sunoTaskId 查找本地任务
    const task = await db.query.musicTasks.findFirst({
      where: eq(musicTasks.sunoTaskId, taskId),
    });

    if (!task) {
      console.warn('[music/callback] task not found for sunoTaskId:', taskId);
      return NextResponse.json({ code: 200, msg: 'ok' });
    }

    if (status === 'SUCCESS' && data?.sunoData) {
      console.log('[music/callback] SUCCESS for task:', task.id);
      await db
        .update(musicTasks)
        .set({
          status: 'SUCCESS',
          resultData: { taskId, sunoData: data.sunoData },
          completedAt: new Date(),
        })
        .where(eq(musicTasks.id, task.id));
    } else if (
      status === 'CREATE_TASK_FAILED' ||
      status === 'GENERATE_AUDIO_FAILED' ||
      status === 'CALLBACK_EXCEPTION' ||
      status === 'SENSITIVE_WORD_ERROR'
    ) {
      console.log('[music/callback] FAILED for task:', task.id, status);
      await db
        .update(musicTasks)
        .set({
          status: 'FAILED',
          errorMessage: status,
        })
        .where(eq(musicTasks.id, task.id));
    }

    return NextResponse.json({ code: 200, msg: 'ok' });
  } catch (err: any) {
    console.error('[music/callback] error:', err.message);
    // 始终返回 200 避免 Suno 重试
    return NextResponse.json({ code: 200, msg: 'ok' });
  }
}
