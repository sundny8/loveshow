import sharp from 'sharp';
import type { PhotoSpec } from './specs';
import { generateWithOpenAI } from './openai';
import { generateWithGemini } from './gemini';

/**
 * Step 2: AI 重新生成证件照。
 *
 * 优先级（按 ID_CARD_MODEL 环境变量）：
 *   ID_CARD_MODEL=gpt  → gpt-image-2 (images/edits) → 失败则 gemini
 *   ID_CARD_MODEL=gemini → gemini → 失败则 gpt-image-2
 *   都失败 → sharp 纯本地兜底（原图直接 resize 到目标尺寸）
 *
 * @param source  参考图 Buffer
 * @param prompt  拼接好的人脸特征 + 着装 + 背景 + 构图提示词
 * @param spec    目标证件照规格
 */
export async function generatePhoto(
  source: Buffer,
  prompt: string,
  spec: PhotoSpec
): Promise<{ buffer: Buffer; provider: string }> {
  const preferred = (process.env.ID_CARD_MODEL || 'gpt').toLowerCase();
  console.log('[PhotoGenerate] preferred model:', preferred);

  // ── 尝试主模型 ──
  if (preferred === 'gpt' || preferred === 'openai') {
    try {
      const buf = await generateWithOpenAI({ source, prompt, spec });
      console.log('[PhotoGenerate] gpt-image-2 success');
      return { buffer: buf, provider: 'gpt-image-2' };
    } catch (err: any) {
      console.warn('[PhotoGenerate] gpt-image-2 failed:', err?.message || err, '→ trying gemini');
    }

    // fallback to gemini
    try {
      const buf = await generateWithGemini({ source, prompt });
      console.log('[PhotoGenerate] gemini fallback success');
      return { buffer: buf, provider: 'gemini' };
    } catch (err2: any) {
      console.warn('[PhotoGenerate] gemini fallback also failed:', err2?.message || err2, '→ using sharp fallback');
    }
  } else {
    // gemini 优先
    try {
      const buf = await generateWithGemini({ source, prompt });
      console.log('[PhotoGenerate] gemini success');
      return { buffer: buf, provider: 'gemini' };
    } catch (err: any) {
      console.warn('[PhotoGenerate] gemini failed:', err?.message || err, '→ trying gpt-image-2');
    }

    // fallback to gpt
    try {
      const buf = await generateWithOpenAI({ source, prompt, spec });
      console.log('[PhotoGenerate] gpt-image-2 fallback success');
      return { buffer: buf, provider: 'gpt-image-2' };
    } catch (err2: any) {
      console.warn('[PhotoGenerate] gpt-image-2 fallback also failed:', err2?.message || err2, '→ using sharp fallback');
    }
  }

  // ── 纯 sharp 兜底：直接缩放原图 ──
  console.log('[PhotoGenerate] all AI models failed, using sharp direct resize');
  const fallback = await sharp(source)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
    .toBuffer();
  return { buffer: fallback, provider: 'sharp-fallback' };
}
