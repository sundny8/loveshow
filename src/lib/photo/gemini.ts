import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini 图像模型兜底。
 * 目前 Gemini 2.5 flash image 支持 multimodal input，将原图作为 parts 传入。
 * 支持通过 GEMINI_URL 配置中转站地址。
 */
export async function generateWithGemini(params: {
  source: Buffer;
  prompt: string;
}): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('gemini_disabled');
  }

  const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 60_000);

  // 检查是否配置了中转站
  const baseURL = process.env.GEMINI_URL;

  // 计算完整的请求 URL（方便排查，api key 脚敏处理）
  const effectiveBaseURL = baseURL
    ? baseURL.replace(/\/$/, '')
    : 'https://generativelanguage.googleapis.com';
  const fullUrl = `${effectiveBaseURL}/v1beta/models/${modelName}:generateContent`;

  console.log('[Gemini] starting generate', {
    model: modelName,
    mode: baseURL ? 'proxy' : 'official-sdk',
    baseURL: effectiveBaseURL,
    fullUrl: `${fullUrl}?key=***`,
    timeoutMs,
  });

  const started = Date.now();
  try {
    let buf: Buffer;
    if (baseURL) {
      buf = await callGeminiViaProxy(baseURL, apiKey, modelName, params, timeoutMs);
    } else {
      buf = await callGeminiViaSDK(apiKey, modelName, params, timeoutMs);
    }
    console.log('[Gemini] generate done in', Date.now() - started, 'ms');
    return buf;
  } catch (err: any) {
    console.error('[Gemini] generate failed after', Date.now() - started, 'ms:', err?.message || err);
    throw err;
  }
}

/**
 * 通过中转站调用 Gemini API
 */
async function callGeminiViaProxy(
  baseURL: string,
  apiKey: string,
  modelName: string,
  params: { source: Buffer; prompt: string },
  timeoutMs: number
): Promise<Buffer> {
  // 构建 API URL
  const url = `${baseURL.replace(/\/$/, '')}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  // 日志里脱敏处理 key
  const safeUrl = url.replace(/key=[^&]+/, 'key=***');
  console.log('[Gemini] proxy PUT url:', safeUrl);

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

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // 从 response.candidates 里找到 inlineData 图片
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data) {
        return Buffer.from(inline.data, 'base64');
      }
    }

    throw new Error('gemini_empty_response');
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`gemini_timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 通过官方 SDK 调用 Gemini（直连 Google API）
 */
async function callGeminiViaSDK(
  apiKey: string,
  modelName: string,
  params: { source: Buffer; prompt: string },
  timeoutMs: number
): Promise<Buffer> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  // SDK 本身无 timeout，用 Promise.race 包一层
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
    setTimeout(() => reject(new Error(`gemini_timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  const res = await Promise.race([generatePromise, timeoutPromise]);

  // 从 response.candidates 里找到 inlineData 图片
  const parts = res.response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = (part as any).inlineData;
    if (inline?.data) {
      return Buffer.from(inline.data, 'base64');
    }
  }

  throw new Error('gemini_empty_response');
}
