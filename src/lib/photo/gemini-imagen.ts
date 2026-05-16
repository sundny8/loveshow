import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PhotoSpec } from './specs';

/**
 * Gemini Imagen 一键识图生图。
 *
 * 当 ID_CARD_MODEL=gemini 且设置了 GEMINI_IMAGEN_MODEL 时启用。
 * 一次 API 调用中完成：
 *   1. 深度解析参考图中人物面部特征
 *   2. 基于特征 + 规格要求生成证件照
 *
 * 与 gemini.ts 完全独立 —— 不混入现有识图/生图逻辑。
 */

export interface ImagenOneShotParams {
  source: Buffer;        // 参考图
  prompt: string;        // 综合提示词（含分析指令 + 生图约束）
  spec: PhotoSpec;       // 目标证件照规格（仅用于日志）
}

export interface ImagenOneShotResult {
  buffer: Buffer;            // 生成的证件照
  textResponse: string;      // Gemini 返回的文字分析
  provider: 'gemini-imagen';
}

export async function generateIdPhotoOneShot(
  params: ImagenOneShotParams
): Promise<ImagenOneShotResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('gemini_disabled');
  }

  const modelName = process.env.GEMINI_IMAGEN_MODEL || 'gemini-3.1-image-preview';
  const timeoutMs = Number(process.env.GEMINI_IMAGEN_TIMEOUT_MS || 120_000);
  const baseURL = process.env.GEMINI_URL;

  const effectiveBaseURL = baseURL
    ? baseURL.replace(/\/$/, '')
    : 'https://generativelanguage.googleapis.com';

  console.log('[GeminiImagen] starting one-shot generate', {
    model: modelName,
    mode: baseURL ? 'proxy' : 'official-sdk',
    baseURL: effectiveBaseURL,
    specId: params.spec.id,
    timeoutMs,
  });

  const started = Date.now();
  try {
    let result: { buffer: Buffer; textResponse: string };
    if (baseURL) {
      result = await callImagenViaProxy(baseURL, apiKey, modelName, params, timeoutMs);
    } else {
      result = await callImagenViaSDK(apiKey, modelName, params, timeoutMs);
    }
    console.log('[GeminiImagen] one-shot done in', Date.now() - started, 'ms');
    return { ...result, provider: 'gemini-imagen' };
  } catch (err: any) {
    console.error('[GeminiImagen] one-shot failed after', Date.now() - started, 'ms:', err?.message || err);
    throw err;
  }
}

/** 通过中转站调用 Gemini Imagen */
async function callImagenViaProxy(
  baseURL: string,
  apiKey: string,
  modelName: string,
  params: ImagenOneShotParams,
  timeoutMs: number
): Promise<{ buffer: Buffer; textResponse: string }> {
  const url = `${baseURL.replace(/\/$/, '')}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const safeUrl = url.replace(/key=[^&]+/, 'key=***');
  console.log('[GeminiImagen] proxy POST url:', safeUrl);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: params.prompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: params.source.toString('base64'),
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['image', 'text'],
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return extractParts(data);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`gemini_imagen_timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** 通过官方 SDK 调用 Gemini Imagen */
async function callImagenViaSDK(
  apiKey: string,
  modelName: string,
  params: ImagenOneShotParams,
  timeoutMs: number
): Promise<{ buffer: Buffer; textResponse: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const generatePromise = model.generateContent([
    { text: params.prompt },
    {
      inlineData: {
        mimeType: 'image/png',
        data: params.source.toString('base64'),
      },
    },
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`gemini_imagen_timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  const res = await Promise.race([generatePromise, timeoutPromise]);
  const parts = res.response?.candidates?.[0]?.content?.parts ?? [];

  let buffer: Buffer | null = null;
  const textParts: string[] = [];

  for (const part of parts) {
    const inline = (part as any).inlineData;
    if (inline?.data && !buffer) {
      buffer = Buffer.from(inline.data, 'base64');
    }
    if (typeof (part as any).text === 'string') {
      textParts.push((part as any).text);
    }
  }

  if (!buffer) throw new Error('gemini_imagen_no_image');

  return { buffer, textResponse: textParts.join('\n') || '(no text response)' };
}

/** 从 proxy 响应中提取图片 + 文字 */
function extractParts(data: any): { buffer: Buffer; textResponse: string } {
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  let buffer: Buffer | null = null;
  const textParts: string[] = [];

  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data && !buffer) {
      buffer = Buffer.from(inline.data, 'base64');
    }
    if (typeof part.text === 'string') {
      textParts.push(part.text);
    }
  }

  if (!buffer) throw new Error('gemini_imagen_no_image');

  return { buffer, textResponse: textParts.join('\n') || '(no text response)' };
}
