import OpenAI from 'openai';
import type { PhotoSpec } from './specs';

/**
 * 用 OpenAI gpt-image-* 图像编辑接口（images/edits）。
 * - 传入裁剪后的参考图（base64）+ 提示词
 * - 配置了 OPENAI_URL（中转站）：用 fetch
 * - 未配置 OPENAI_URL：用官方 OpenAI SDK
 * 若未配置 OPENAI_API_KEY 则抛 "openai_disabled"，由 pipeline 兜底到 Gemini 或纯 sharp。
 */
export async function generateWithOpenAI(params: {
  source: Buffer;
  prompt: string;
  spec: PhotoSpec;
}): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('openai_disabled');
  }

  const baseURL = process.env.OPENAI_URL;
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 60_000);
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size = pickNearestSize(params.spec.width, params.spec.height);

  if (baseURL) {
    // 中转站模式：fetch + reference image
    return callOpenAIViaProxy(baseURL, apiKey, model, size, params.prompt, params.source, timeoutMs);
  } else {
    // 官方 API 模式：OpenAI SDK + reference image
    return callOpenAIViaSDK(apiKey, model, size, params.prompt, params.source, timeoutMs);
  }
}

async function callOpenAIViaProxy(
  baseURL: string,
  apiKey: string,
  model: string,
  size: string,
  prompt: string,
  sourceImage: Buffer,
  timeoutMs: number
): Promise<Buffer> {
  const url = `${baseURL.replace(/\/$/, '')}/v1/images/edits`;
  console.log('[OpenAI] proxy POST url:', url, 'model:', model, 'size:', size);

  // images/edits 接口要求 multipart/form-data 格式
  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', prompt);
  formData.append('size', size);
  formData.append('n', '1');
  // 参考图必须以 File 形式上传
  const imageBlob = new Blob([new Uint8Array(sourceImage)], { type: 'image/png' });
  formData.append('image', imageBlob, 'reference.png');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,   // 不要手动设置 Content-Type，fetch 会自动设置 boundary
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`openai_proxy_error ${response.status}: ${errText}`);
    }

    const json = await response.json() as { data?: Array<{ b64_json?: string; url?: string }> };
    console.log('[OpenAI] proxy edits done in', Date.now() - started, 'ms');

    // images/edits 默认返回 url，需要 fetch 下载；如果返回 b64_json 则直接用
    const b64 = json.data?.[0]?.b64_json;
    if (b64) return Buffer.from(b64, 'base64');
    const imgUrl = json.data?.[0]?.url;
    if (imgUrl) {
      const res = await fetch(imgUrl);
      return Buffer.from(await res.arrayBuffer());
    }
    throw new Error('openai_empty_response');
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`openai_timeout after ${timeoutMs}ms`);
    console.error('[OpenAI] proxy edits failed after', Date.now() - started, 'ms:', err?.message || err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAIViaSDK(
  apiKey: string,
  model: string,
  size: ReturnType<typeof pickNearestSize>,
  prompt: string,
  sourceImage: Buffer,
  timeoutMs: number
): Promise<Buffer> {
  console.log('[OpenAI] SDK edits generate', { model, size, timeoutMs });
  const client = new OpenAI({ apiKey, timeout: timeoutMs, maxRetries: 1 });
  const started = Date.now();
  try {
    const result = await client.images.edit({
      model,
      prompt,
      image: new File([new Uint8Array(sourceImage)], 'reference.png', { type: 'image/png' }),
      size,
      n: 1,
    });
    console.log('[OpenAI] SDK edits generate done in', Date.now() - started, 'ms');
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('openai_empty_response');
    return Buffer.from(b64, 'base64');
  } catch (err: any) {
    console.error('[OpenAI] SDK edits generate failed after', Date.now() - started, 'ms:', err?.message || err);
    throw err;
  }
}

function pickNearestSize(w: number, h: number): '1024x1024' | '1024x1536' | '1536x1024' {
  const ratio = w / h;
  if (ratio > 1.15) return '1536x1024';
  if (ratio < 0.85) return '1024x1536';
  return '1024x1024';
}
