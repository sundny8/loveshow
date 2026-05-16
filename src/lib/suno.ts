/**
 * Suno API 客户端
 * 参考文档: https://docs.sunoapi.org/cn
 *
 * Base URL: https://api.sunoapi.org
 * Auth: Bearer <SUNO_KEY>
 */

const SUNO_BASE_URL = 'https://api.sunoapi.org';

function getApiKey(): string {
  const key = process.env.SUNO_KEY;
  if (!key) {
    throw new Error('SUNO_KEY is not configured');
  }
  return key;
}

/** Suno 音乐生成请求参数 */
export interface GenerateMusicParams {
  prompt: string;
  style?: string;
  title?: string;
  customMode: boolean;
  instrumental: boolean;
  model: string;
  callBackUrl?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
}

/** Suno 音乐生成响应 */
export interface GenerateMusicResponse {
  taskId: string;
}

/** Suno 任务状态枚举 */
export type SunoTaskStatus =
  | 'PENDING'
  | 'TEXT_SUCCESS'
  | 'FIRST_SUCCESS'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_AUDIO_FAILED'
  | 'CALLBACK_EXCEPTION'
  | 'SENSITIVE_WORD_ERROR';

/** Suno 生成的单首歌曲数据 */
export interface SunoAudioData {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

/** Suno 任务详情响应 */
export interface SunoTaskDetail {
  taskId: string;
  parentMusicId?: string;
  param: string;
  response: {
    taskId: string;
    sunoData: SunoAudioData[];
  } | null;
  status: SunoTaskStatus;
  type: string;
  operationType: string;
  errorCode: number | null;
  errorMessage: string | null;
}

interface SunoApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 调用 Suno API 生成音乐
 * POST /api/v1/generate
 */
export async function generateMusic(
  params: GenerateMusicParams,
): Promise<GenerateMusicResponse> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    prompt: params.prompt,
    customMode: params.customMode,
    instrumental: params.instrumental,
    model: params.model,
    callBackUrl: params.callBackUrl || '',
  };

  if (params.style) body.style = params.style;
  if (params.title) body.title = params.title;
  if (params.negativeTags) body.negativeTags = params.negativeTags;
  if (params.vocalGender) body.vocalGender = params.vocalGender;

  console.log('[suno] generateMusic request', { model: params.model, customMode: params.customMode, instrumental: params.instrumental, style: params.style, vocalGender: params.vocalGender, negativeTags: params.negativeTags });

  const res = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  const json: SunoApiResponse<GenerateMusicResponse> = await res.json();

  if (json.code !== 200) {
    console.error('[suno] generateMusic failed', json);
    throw new Error(`Suno API error: ${json.msg || 'unknown error'} (code: ${json.code})`);
  }

  console.log('[suno] generateMusic success, taskId=', json.data.taskId);
  return json.data;
}

/**
 * 查询音乐生成任务状态
 * GET /api/v1/generate/record-info?taskId=xxx
 */
export async function getTaskStatus(taskId: string): Promise<SunoTaskDetail> {
  const apiKey = getApiKey();

  console.log('[suno] getTaskStatus', { taskId });

  const res = await fetch(
    `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30_000),
    },
  );

  const json: SunoApiResponse<SunoTaskDetail> = await res.json();

  if (json.code !== 200) {
    console.error('[suno] getTaskStatus failed', json);
    throw new Error(`Suno API error: ${json.msg || 'unknown error'} (code: ${json.code})`);
  }

  console.log('[suno] getTaskStatus success, status=', json.data.status);
  return json.data;
}

/**
 * 查询 Suno 账户剩余积分
 * GET /api/v1/generate/credit
 */
export async function getCredits(): Promise<number> {
  const apiKey = getApiKey();

  const res = await fetch(`${SUNO_BASE_URL}/api/v1/generate/credit`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const json: SunoApiResponse<number> = await res.json();

  if (json.code !== 200) {
    throw new Error(`Suno API error: ${json.msg || 'unknown error'} (code: ${json.code})`);
  }

  return json.data;
}

/** 时间轴歌词单词项 */
export interface TimestampedWord {
  word: string;
  success: boolean;
  startS: number;
  endS: number;
  palign: number;
}

/** 时间轴歌词响应 */
export interface TimestampedLyricsData {
  alignedWords: TimestampedWord[];
  waveformData: number[];
  hootCer: number;
  isStreamed: boolean;
}

/**
 * 获取带时间轴的歌词
 * POST /api/v1/generate/get-timestamped-lyrics
 */
export async function getTimestampedLyrics(
  taskId: string,
  audioId: string,
): Promise<TimestampedLyricsData> {
  const apiKey = getApiKey();

  console.log('[suno] getTimestampedLyrics', { taskId, audioId });

  const res = await fetch(
    `${SUNO_BASE_URL}/api/v1/generate/get-timestamped-lyrics`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, audioId }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  const json: SunoApiResponse<TimestampedLyricsData> = await res.json();

  if (json.code !== 200) {
    console.error('[suno] getTimestampedLyrics failed', json);
    throw new Error(`Suno API error: ${json.msg || 'unknown error'} (code: ${json.code})`);
  }

  console.log('[suno] getTimestampedLyrics success, words count=', json.data.alignedWords.length);
  return json.data;
}