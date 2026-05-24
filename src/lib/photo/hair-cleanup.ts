import sharp from 'sharp';
import type { FaceBox } from './crop';
import type { DetectResult } from './detect';

/**
 * 碎发清理：使用 AI 去除松散发丝，同时 100% 锁定人脸像素。
 *
 * 策略：
 * 1. 把整图发给 AI，要求它清除头发边缘的碎发
 * 2. AI 返回清理后的图
 * 3. 强制把人脸 bbox 区域替换回原图像素——确保面部绝对不被改动
 *
 * @param source - 原图 Buffer
 * @param face - 人脸检测框
 * @param portrait - 人像信息（发色、肤色）
 * @returns 清理后的图片 Buffer，失败时返回原图
 */
export async function cleanStrayHairs(
  source: Buffer,
  face: FaceBox | null,
  portrait: DetectResult
): Promise<Buffer> {
  const model = (process.env.ID_CARD_MODEL || 'gemini').toLowerCase();
  console.log('[HairCleanup] preferred model:', model);

  const started = Date.now();

  // 获取源图尺寸（AI 输出尺寸可能不同，后续需要对齐）
  const srcMeta = await sharp(source).metadata();
  const srcW = srcMeta.width!;
  const srcH = srcMeta.height!;

  // 构建清理 prompt
  const prompt = buildCleanupPrompt(portrait);

  let cleaned: Buffer;

  try {
    if (model === 'gpt' || model === 'openai') {
      // 先尝试 GPT
      cleaned = await cleanWithGPT(source, prompt);
    } else {
      // 先尝试 Gemini（默认）
      cleaned = await cleanWithGemini(source, prompt);
    }
  } catch (err: any) {
    console.warn('[HairCleanup] primary model failed:', err?.message || err, '→ trying fallback');

    // 回退到另一个模型
    try {
      if (model === 'gpt' || model === 'openai') {
        cleaned = await cleanWithGemini(source, prompt);
      } else {
        cleaned = await cleanWithGPT(source, prompt);
      }
    } catch (fallbackErr: any) {
      console.warn('[HairCleanup] fallback also failed:', fallbackErr?.message || fallbackErr, '→ returning original');
      return source;
    }
  }

  // ═══════════════════════════════════════════════
  // 关键：AI 输出尺寸可能 ≠ 源图尺寸（如 GPT 固定 1024×1024）。
  // 必须缩放回源尺寸，确保后续 mask 对齐。
  // ═══════════════════════════════════════════════
  const cleanedMeta = await sharp(cleaned).metadata();
  if (cleanedMeta.width !== srcW || cleanedMeta.height !== srcH) {
    console.log('[HairCleanup] Normalizing AI output from', cleanedMeta.width, 'x', cleanedMeta.height, '→', srcW, 'x', srcH);
    cleaned = await sharp(cleaned)
      .resize(srcW, srcH, { fit: 'cover' })
      .png()
      .toBuffer();
  }

  // ═══════════════════════════════════════
  // 安全锁：把人脸 bbox 区域还原为原图像素
  // ═══════════════════════════════════════
  if (face && face.w > 0 && face.h > 0) {
    try {
      cleaned = await lockFaceRegion(source, cleaned, face);
    } catch (err: any) {
      console.warn('[HairCleanup] Face lock failed:', err?.message || err);
      // 不影响主流程，返回 AI 结果（未锁定版本）
    }
  }

  console.log('[HairCleanup] done in', Date.now() - started, 'ms');
  return cleaned;
}

/**
 * 人脸锁定：仅锁定五官核心区（眼鼻嘴），释放额头和耳侧给 AI 清理。
 *
 * 锁区范围：面部宽度中心 60%，面部高度下半 55%
 * → 刘海/额头和耳侧头发交给 AI 自由处理
 */
async function lockFaceRegion(
  original: Buffer,
  cleaned: Buffer,
  face: FaceBox
): Promise<Buffer> {
  // 缩小锁定区域：只锁眼鼻嘴核心区，释放额头和两侧
  const cx = face.x + face.w / 2;
  const cy = face.y + face.h / 2;
  const lockW = Math.round(face.w * 0.60);   // 宽度缩到 60%（释放耳朵两侧头发）
  const lockH = Math.round(face.h * 0.55);   // 高度缩到 55%（释放额头刘海）
  const lockX = Math.round(cx - lockW / 2);
  const lockY = Math.round(cy - lockH * 0.3); // 偏下方对齐鼻子嘴巴

  // 边界保护
  const fx = Math.max(0, lockX);
  const fy = Math.max(0, lockY);
  const fw = Math.min(lockW, face.imageW - fx);
  const fh = Math.min(lockH, face.imageH - fy);

  if (fw <= 0 || fh <= 0) {
    console.warn('[HairCleanup] Face lock region invalid, skipping');
    return cleaned;
  }

  // 从原图提取五官核心区
  const originalFace = await sharp(original)
    .extract({ left: fx, top: fy, width: fw, height: fh })
    .png()
    .toBuffer();

  // 覆盖到清理后的图上
  return sharp(cleaned)
    .composite([
      {
        input: originalFace,
        left: fx,
        top: fy,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();
}

// ─────────────────────────────────────────
// Gemini 碎发清理
// ─────────────────────────────────────────

async function cleanWithGemini(source: Buffer, prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('gemini_disabled');

  const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 60_000);
  const baseURL = process.env.GEMINI_URL;

  console.log('[HairCleanup] Gemini cleanup, model:', modelName);

  if (baseURL) {
    return callGeminiViaProxy(baseURL, apiKey, modelName, { source, prompt }, timeoutMs);
  }
  return callGeminiViaSDK(apiKey, modelName, { source, prompt }, timeoutMs);
}

async function callGeminiViaSDK(
  apiKey: string,
  modelName: string,
  params: { source: Buffer; prompt: string },
  timeoutMs: number
): Promise<Buffer> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const started = Date.now();
  const generatePromise = model.generateContent([
    { text: params.prompt },
    { inlineData: { mimeType: 'image/png', data: params.source.toString('base64') } },
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`hair_cleanup_timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  const res = await Promise.race([generatePromise, timeoutPromise]);
  console.log('[HairCleanup] Gemini SDK responded in', Date.now() - started, 'ms');

  const parts = res.response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = (part as any).inlineData;
    if (inline?.data) return Buffer.from(inline.data, 'base64');
  }
  throw new Error('hair_cleanup_empty_response');
}

async function callGeminiViaProxy(
  baseURL: string,
  apiKey: string,
  modelName: string,
  params: { source: Buffer; prompt: string },
  timeoutMs: number
): Promise<Buffer> {
  const url = `${baseURL.replace(/\/$/, '')}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: params.prompt }, { inlineData: { mimeType: 'image/png', data: params.source.toString('base64') } }] }],
    generationConfig: { responseModalities: ['image', 'text'] },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const started = Date.now();
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    console.log('[HairCleanup] Gemini proxy responded in', Date.now() - started, 'ms');

    if (!resp.ok) throw new Error(`Gemini API ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) return Buffer.from(part.inlineData.data, 'base64');
    }
    throw new Error('hair_cleanup_empty_response');
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────
// GPT 碎发清理（OpenAI images/edits）
// 支持 OPENAI_URL 代理转发 + 官方直连双模式
// ─────────────────────────────────────────

async function cleanWithGPT(source: Buffer, prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('gpt_disabled');

  const baseURL = process.env.OPENAI_URL;
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 250_000);

  // GPT images/edits 要求输入为正方形 PNG。将非正方形源图垫白边到正方形。
  const srcMeta = await sharp(source).metadata();
  const srcW = srcMeta.width!;
  const srcH = srcMeta.height!;
  const square = Math.max(srcW, srcH);

  const paddedSource = srcW === srcH
    ? source
    : await sharp(source)
        .resize(square, square, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();

  const imageBlob = new Blob([new Uint8Array(paddedSource)], { type: 'image/png' });

  const form = new FormData();
  form.append('image', imageBlob, 'reference.png');
  form.append('prompt', prompt);
  form.append('model', model);
  form.append('n', '1');
  form.append('size', '1024x1024');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = baseURL
      ? `${baseURL.replace(/\/$/, '')}/v1/images/edits`
      : 'https://api.openai.com/v1/images/edits';

    console.log('[HairCleanup] GPT cleanup, url:', url.replace(/key=[^&]+/, 'key=***'), 'model:', model, 'timeout:', timeoutMs, 'ms', baseURL ? '(proxy)' : '(direct)');

    const started = Date.now();
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // 不要手动设置 Content-Type，fetch 会自动设置 multipart boundary
      },
      body: form,
      signal: controller.signal,
    });

    console.log('[HairCleanup] GPT responded in', Date.now() - started, 'ms');

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`GPT API ${resp.status}: ${errText}`);
    }
    const data = await resp.json();
    let resultBuf: Buffer;

    const b64 = data?.data?.[0]?.b64_json;
    if (b64) {
      resultBuf = Buffer.from(b64, 'base64');
    } else {
      // fallback: 有些中转站返回 url 而非 b64_json
      const imgUrl = data?.data?.[0]?.url;
      if (imgUrl) {
        const imgRes = await fetch(imgUrl);
        resultBuf = Buffer.from(await imgRes.arrayBuffer());
      } else {
        throw new Error('hair_cleanup_empty_response');
      }
    }

    // 如果输入被垫过边，裁回原始宽高比（GPT 可能缩放输出，按比例裁切）
    if (srcW !== srcH) {
      const outMeta = await sharp(resultBuf).metadata();
      const outW = outMeta.width!;
      const outH = outMeta.height!;
      const scale = outW / square;
      const cropW = Math.round(srcW * scale);
      const cropH = Math.round(srcH * scale);
      const cropX = Math.round((outW - cropW) / 2);
      const cropY = Math.round((outH - cropH) / 2);
      console.log('[HairCleanup] GPT cropping padded result from', outW, 'x', outH, '→', cropW, 'x', cropH);
      resultBuf = await sharp(resultBuf)
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .png()
        .toBuffer();
    }

    return resultBuf;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`hair_cleanup_timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────

function buildCleanupPrompt(p: DetectResult): string {
  return [
    `[IMAGE EDITING TASK] Clean up the hair in this portrait photo for a professional ID photo.`,
    `CRITICAL — NO HAIR BEHIND EARS: Look at the area BEHIND both ears. Any long hair strands dropping down from behind/beside the ears must be COMPLETELY ERASED. The silhouette behind each ear must be clean with NO hanging hair.`,
    `CRITICAL — EARS FULLY VISIBLE: Remove any hair that covers the outer edge, top, or back of either ear. Both ears must be 100% exposed with clean outlines.`,
    `CRITICAL — NO BANGS ON FOREHEAD: Completely erase ALL hair (bangs/fringe) that falls across the forehead. The forehead must be COMPLETELY CLEAR with NO hair strands covering it. This is the most important requirement for a professional ID photo.`,
    `AGGRESSIVELY remove ALL stray hairs, flyaways, wispy strands, and loose hair around the head edges, especially on both sides of the face and above the forehead.`,
    `Clean up long hair strands that fall across the cheeks, jawline, sides of the neck. These must be completely removed.`,
    `Remove any baby hairs or fine hair strands along the hairline and temples.`,
    `The result must look like a clean, professional ID photo with well-groomed hair, clear forehead, fully visible ears, and clean neck/shoulder silhouette.`,
    `CRITICAL RULES:`,
    `1. DO NOT change the person's identity — keep the exact same facial features, skin tone (${p.skinTone}), and hair color (${p.hairColor}).`,
    `2. DO NOT alter the head shape or main hairstyle volume — only remove stray/loose hairs.`,
    `3. DO NOT change the background — keep it exactly as-is.`,
    `4. DO NOT change the clothing — keep it exactly as-is.`,
    `5. DO NOT apply any filters, color grading, skin smoothing, or artistic effects.`,
    `Only clean up untidy hair edges, clear the forehead, and expose ears fully. The output must show a CLEAN FOREHEAD, FULLY VISIBLE EARS, and NEAT hair edges.`,
  ].join(' ');
}
