import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, musicTasks } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getTaskStatus, getTimestampedLyrics } from '@/lib/suno';
import { uploadToStorage } from '@/lib/storage/s3';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * GET /api/music/task?taskId=xxx
 * 查询音乐生成任务详情，若状态为 GENERATING 则主动向 Suno 同步最新状态。
 * 当 Suno 返回 SUCCESS 时：提取歌词 → 下载音频 → 上传 TOS → 更新数据库。
 */
export async function GET(req: NextRequest) {
  console.log('[music/task] ← request received');
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  }

  try {
    const task = await db.query.musicTasks.findFirst({
      where: and(
        eq(musicTasks.id, taskId),
        eq(musicTasks.userId, session.user.id),
      ),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 如果本地状态为 GENERATING，尝试同步 Suno 状态
    if (task.status === 'GENERATING' && task.sunoTaskId) {
      console.log('[music/task] syncing from Suno, sunoTaskId=', task.sunoTaskId);
      try {
        const detail = await getTaskStatus(task.sunoTaskId);

        if (detail.status === 'SUCCESS' && detail.response?.sunoData) {
          console.log('[music/task] Suno SUCCESS, processing audio upload to TOS');

          const sunoData = detail.response.sunoData;

          // 预置 updateData
          const updateData: Record<string, unknown> = {
            status: 'SUCCESS',
            resultData: detail.response,
            completedAt: new Date(),
          };

          // 1. 提取歌词（简单模式+有人声时）+ 获取时间轴歌词（带重试）
          let lyrics: string | null = null;
          if (!task.instrumental && sunoData.length > 0) {
            lyrics = sunoData[0].prompt || null;
            console.log('[music/task] extracted lyrics, length=', lyrics?.length);

            // 获取带时间轴的歌词 — Suno 刚 SUCCESS 时对齐数据可能未就绪，返回 0 词
            // 重试 3 次，每次间隔 3 秒，尝试所有音轨
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                const audioIdx = attempt % sunoData.length;
                const audio = sunoData[audioIdx];
                const tsLyrics = await getTimestampedLyrics(task.sunoTaskId!, audio.id);
                console.log(`[music/task] timestamped lyrics attempt ${attempt + 1}, audioIdx=${audioIdx}, words=`, tsLyrics.alignedWords.length);
                if (tsLyrics.alignedWords.length > 0) {
                  (updateData.resultData as any).timestampedLyrics = tsLyrics;
                  break;
                }
                // 0 词 → 等 3 秒再试
                if (attempt < 2) {
                  await new Promise(r => setTimeout(r, 3000));
                }
              } catch (lyricErr: any) {
                console.warn(`[music/task] timestamped lyrics attempt ${attempt + 1} failed:`, lyricErr.message);
                if (attempt < 2) {
                  await new Promise(r => setTimeout(r, 3000));
                }
              }
            }
          }

          // 2. 仅处理第一首歌曲：下载音频并上传到 TOS
          const tosAudioUrls: string[] = [];
          if (sunoData.length > 0) {
            const audio = sunoData[0];
            const audioUrl = audio.audioUrl || audio.streamAudioUrl;
            if (audioUrl) {
              try {
                console.log(`[music/task] downloading first audio from Suno`);
                const audioRes = await fetch(audioUrl, {
                  signal: AbortSignal.timeout(120_000),
                });
                if (!audioRes.ok) {
                  console.error(`[music/task] download failed:`, audioRes.status);
                } else {
                  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
                  const key = `loveshow/music/${session.user.id}/${taskId}_0_${nanoid(6)}.mp3`;

                  console.log(`[music/task] uploading to TOS: ${key}, size=${audioBuffer.length}`);
                  const tosUrl = await uploadToStorage(key, audioBuffer, 'audio/mpeg');
                  tosAudioUrls.push(tosUrl);
                  console.log(`[music/task] TOS upload done: ${tosUrl}`);
                }
              } catch (uploadErr: any) {
                console.error(`[music/task] TOS upload failed:`, uploadErr.message);
              }
            }
          }

          // 3. 更新数据库
          if (lyrics) updateData.lyrics = lyrics;
          if (tosAudioUrls.length > 0) updateData.tosAudioUrls = tosAudioUrls;

          await db
            .update(musicTasks)
            .set(updateData)
            .where(eq(musicTasks.id, taskId));

          console.log('[music/task] SUCCESS saved, tosUrls=', tosAudioUrls.length, 'lyrics=', !!lyrics);

          return NextResponse.json({
            task: {
              ...task,
              ...updateData,
              completedAt: new Date().toISOString(),
            },
          });
        } else if (
          detail.status === 'CREATE_TASK_FAILED' ||
          detail.status === 'GENERATE_AUDIO_FAILED' ||
          detail.status === 'CALLBACK_EXCEPTION' ||
          detail.status === 'SENSITIVE_WORD_ERROR'
        ) {
          await db
            .update(musicTasks)
            .set({
              status: 'FAILED',
              errorMessage: detail.errorMessage || detail.status,
            })
            .where(eq(musicTasks.id, taskId));

          return NextResponse.json({
            task: {
              ...task,
              status: 'FAILED',
              errorMessage: detail.errorMessage || detail.status,
            },
          });
        }
      } catch (syncErr: any) {
        console.error('[music/task] sync error (non-fatal)', syncErr.message);
      }
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error('[music/task] error', err);
    return NextResponse.json(
      { error: err?.message || 'internal_error' },
      { status: 500 },
    );
  }
}
