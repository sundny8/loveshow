/**
 * Step 1: 人脸特征分析。
 *
 * 使用 Gemini 多模态模型（GEMINI_DNA_MODEL）分析上传参考图中的人脸细节，
 * 返回结构化 JSON，包含性别、肤色、年龄、脸型、五官描述等，
 * 为 Step 2 AI 重新生成证件照提供精确提示词素材。
 *
 * 失败时降级返回默认兜底值，不阻断流水线。
 */

export interface FaceAnalysis {
  gender: 'male' | 'female' | 'unknown';
  skinTone: 'fair' | 'medium' | 'tan' | 'deep' | 'unknown';
  ageRange: string;
  ethnicity: string;
  faceShape: string;
  faceProportions: string;
  faceFullness: string;
  jawlineShape: string;
  cheekboneDescription: string;
  foreheadDescription: string;
  headShape: string;
  faceDescription: string;
  eyeDescription: string;
  noseDescription: string;
  mouthDescription: string;
  eyebrowDescription: string;
  hairDescription: string;
  distinctiveFeatures: string;
  facialHair: string;
}

const DEFAULT_ANALYSIS: FaceAnalysis = {
  gender: 'unknown',
  skinTone: 'medium',
  ageRange: '25-30',
  ethnicity: 'East Asian',
  faceShape: 'oval',
  faceProportions: 'Face height is approximately 1.35x face width. Balanced upper and lower thirds.',
  faceFullness: 'Moderate cheek fullness, not puffy not hollow.',
  jawlineShape: 'Rounded U-line jaw with medium width, rounded chin.',
  cheekboneDescription: 'Mid-height cheekbones, moderate prominence, medium width.',
  foreheadDescription: 'Medium height forehead, medium width, slightly rounded.',
  headShape: 'Rounded crown, medium head width, normal skull height.',
  faceDescription: 'Balanced facial proportions with soft features.',
  eyeDescription: 'Medium-sized almond-shaped eyes with double eyelids.',
  noseDescription: 'Straight nose bridge with moderate width.',
  mouthDescription: 'Medium lips with natural shape.',
  eyebrowDescription: 'Natural thickness with gentle arch.',
  hairDescription: 'Dark straight hair.',
  distinctiveFeatures: 'none',
  facialHair: 'none',
};

export async function analyzeFace(source: Buffer, promptText: string): Promise<FaceAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[FaceAnalyze] GEMINI_API_KEY not set → using fallback');
    return DEFAULT_ANALYSIS;
  }

  const modelName = process.env.GEMINI_DNA_MODEL || 'gemini-2.5-flash-image-preview';
  const baseURL = process.env.GEMINI_URL;
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 120_000);

  console.log('[FaceAnalyze] starting with model:', modelName);

  const started = Date.now();
  try {
    let text: string;
    if (baseURL) {
      text = await callGeminiProxyForText(baseURL, apiKey, modelName, source, promptText, timeoutMs);
    } else {
      text = await callGeminiSDKForText(apiKey, modelName, source, promptText, timeoutMs);
    }

    console.log('[FaceAnalyze] done in', Date.now() - started, 'ms');

    // 解析 JSON 响应
    const parsed = parseAnalysisResponse(text);
    return { ...DEFAULT_ANALYSIS, ...parsed };
  } catch (err: any) {
    console.warn('[FaceAnalyze] failed after', Date.now() - started, 'ms:', err?.message || err, '→ using fallback');
    return DEFAULT_ANALYSIS;
  }
}

/**
 * 代理模式：调用 Gemini generateContent，只请求文本输出。
 */
async function callGeminiProxyForText(
  baseURL: string,
  apiKey: string,
  modelName: string,
  source: Buffer,
  prompt: string,
  timeoutMs: number
): Promise<string> {
  const url = `${baseURL.replace(/\/$/, '')}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log('[FaceAnalyze] proxy url:', url.replace(/key=[^&]+/, 'key=***'));

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: source.toString('base64'),
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['text'],
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
      const errText = await response.text();
      throw new Error(`Gemini ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p.text).filter(Boolean).join('\n');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 官方 SDK 模式：调用 Gemini generateContent，只请求文本输出。
 */
async function callGeminiSDKForText(
  apiKey: string,
  modelName: string,
  source: Buffer,
  prompt: string,
  timeoutMs: number
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const generatePromise = model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/png',
        data: source.toString('base64'),
      },
    },
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`gemini_timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  const res = await Promise.race([generatePromise, timeoutPromise]);
  const parts = res.response?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => p.text).filter(Boolean).join('\n');
}

/**
 * 从 Gemini 文本响应中提取 JSON。
 * 兼容 markdown 代码块包裹和裸 JSON 两种格式。
 */
function parseAnalysisResponse(text: string): Partial<FaceAnalysis> {
  // 尝试提取 ```json ... ``` 代码块
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = codeMatch ? codeMatch[1].trim() : text.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    // 只取我们关心的字段
    return {
      gender: parsed.gender,
      skinTone: parsed.skinTone,
      ageRange: parsed.ageRange,
      ethnicity: parsed.ethnicity,
      faceShape: parsed.faceShape,
      faceProportions: parsed.faceProportions,
      faceFullness: parsed.faceFullness,
      jawlineShape: parsed.jawlineShape,
      cheekboneDescription: parsed.cheekboneDescription,
      foreheadDescription: parsed.foreheadDescription,
      headShape: parsed.headShape,
      faceDescription: parsed.faceDescription,
      eyeDescription: parsed.eyeDescription,
      noseDescription: parsed.noseDescription,
      mouthDescription: parsed.mouthDescription,
      eyebrowDescription: parsed.eyebrowDescription,
      hairDescription: parsed.hairDescription,
      distinctiveFeatures: parsed.distinctiveFeatures,
      facialHair: parsed.facialHair,
    };
  } catch {
    console.warn('[FaceAnalyze] failed to parse JSON response, raw:', text.slice(0, 300));
    return {};
  }
}
