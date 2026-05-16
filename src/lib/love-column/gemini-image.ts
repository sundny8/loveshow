import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Free-form Gemini Imagen wrapper for love-column features.
 * Accepts a prompt + optional reference image(s) and returns a generated image buffer.
 *
 * Differs from src/lib/photo/gemini-imagen.ts which is typed to PhotoSpec (ID-photo focused).
 */

export interface GenerateImageParams {
  prompt: string;
  references?: Array<{ buffer: Buffer; mimeType?: string }>;
  /** Override timeout; default 120s */
  timeoutMs?: number;
  /** Override model; default GEMINI_IMAGEN_MODEL or gemini-3.1-image-preview */
  model?: string;
}

export interface GenerateImageResult {
  buffer: Buffer;
  textResponse: string;
}

export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('gemini_disabled');

  const modelName = params.model || process.env.GEMINI_IMAGEN_MODEL || 'gemini-3.1-image-preview';
  const timeoutMs = params.timeoutMs ?? Number(process.env.GEMINI_IMAGEN_TIMEOUT_MS || 120_000);
  const baseURL = process.env.GEMINI_URL;

  console.log('[LoveColumnGemini] generate', {
    model: modelName,
    mode: baseURL ? 'proxy' : 'sdk',
    refs: params.references?.length || 0,
  });

  if (baseURL) {
    return await callViaProxy(baseURL, apiKey, modelName, params, timeoutMs);
  }
  return await callViaSDK(apiKey, modelName, params, timeoutMs);
}

async function callViaProxy(
  baseURL: string,
  apiKey: string,
  modelName: string,
  params: GenerateImageParams,
  timeoutMs: number
): Promise<GenerateImageResult> {
  const url = `${baseURL.replace(/\/$/, '')}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: params.prompt }];
  for (const ref of params.references ?? []) {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType || 'image/png',
        data: ref.buffer.toString('base64'),
      },
    });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['image', 'text'] },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`gemini_proxy_error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return extractParts(data);
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`gemini_timeout after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callViaSDK(
  apiKey: string,
  modelName: string,
  params: GenerateImageParams,
  timeoutMs: number
): Promise<GenerateImageResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const contentParts: any[] = [{ text: params.prompt }];
  for (const ref of params.references ?? []) {
    contentParts.push({
      inlineData: {
        mimeType: ref.mimeType || 'image/png',
        data: ref.buffer.toString('base64'),
      },
    });
  }

  const generatePromise = model.generateContent(contentParts);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`gemini_timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  const res = await Promise.race([generatePromise, timeoutPromise]);
  return extractFromSDK(res);
}

function extractParts(data: any): GenerateImageResult {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  let buffer: Buffer | null = null;
  const textParts: string[] = [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data && !buffer) buffer = Buffer.from(inline.data, 'base64');
    if (typeof part.text === 'string') textParts.push(part.text);
  }
  if (!buffer) throw new Error('gemini_no_image');
  return { buffer, textResponse: textParts.join('\n') || '' };
}

function extractFromSDK(res: any): GenerateImageResult {
  const parts = res.response?.candidates?.[0]?.content?.parts ?? [];
  let buffer: Buffer | null = null;
  const textParts: string[] = [];
  for (const part of parts) {
    const inline = (part as any).inlineData;
    if (inline?.data && !buffer) buffer = Buffer.from(inline.data, 'base64');
    if (typeof (part as any).text === 'string') textParts.push((part as any).text);
  }
  if (!buffer) throw new Error('gemini_no_image');
  return { buffer, textResponse: textParts.join('\n') || '' };
}
