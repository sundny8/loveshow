import sharp from 'sharp';
import { getSpec, type PhotoSpec } from './specs';
import { analyzeFace } from './face-analyze';
import { buildAnalyzePrompt, buildGeneratePrompt, buildOneShotPrompt } from './prompt';
import { generatePhoto } from './photo-generate';
import { generateIdPhotoOneShot } from './gemini-imagen';

export interface PipelineOptions {
  specId?: string;
  bgColor?: string;
  suit?: PhotoSpec['suitHint'];
  /** 强制跳过 AI，只走纯 sharp 流水线 */
  skipAI?: boolean;
}

export interface PipelineResult {
  buffer: Buffer;
  mime: 'image/jpeg';
  provider: string;
  spec: PhotoSpec;
  gender: string;
  ageBucket: string;
  skinTone: string;
}

/**
 * 新证件照生成流水线（V6）：
 *
 * Step 1: 人脸特征分析 (Gemini DNA 模型识图)
 * Step 2: AI 重新生成证件照 (gpt-image-2 优先，Gemini 兜底)
 * Step 3: sharp 裁切到目标尺寸 → JPEG 输出
 *
 * 核心变化：AI 原生生成证件照，不再依赖 rembg 抠图 + 西装 PNG 叠加。
 */
export async function runPhotoPipeline(
  input: Buffer,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const spec = getSpec(options.specId);
  const suitHint = options.suit ?? spec.suitHint;
  const bgColor = options.bgColor ?? spec.bgColor;

  console.log('[Pipeline] V6 start', {
    specId: spec.id,
    width: spec.width,
    height: spec.height,
    skipAI: !!options.skipAI,
    suit: suitHint,
    bgColor,
  });

  // skipAI 模式：纯 sharp 本地处理（兜底）
  if (options.skipAI) {
    console.log('[Pipeline] skipAI=true → sharp only');
    const output = await sharp(input)
      .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 90 })
      .toBuffer();
    return {
      buffer: output,
      mime: 'image/jpeg',
      provider: 'sharp',
      spec,
      gender: 'unknown',
      ageBucket: 'adult',
      skinTone: 'medium',
    };
  }

  // ═══════════════════════════════════════════════
  // Gemini Imagen 一键模式：识图 + 生图 一次 API 调用完成
  // ═══════════════════════════════════════════════
  const isGeminiOneShot =
    (process.env.ID_CARD_MODEL || '').toLowerCase() === 'gemini' &&
    !!process.env.GEMINI_IMAGEN_MODEL;

  if (isGeminiOneShot) {
    console.log('[Pipeline] Gemini Imagen one-shot mode');
    const oneShotPrompt = buildOneShotPrompt(bgColor, suitHint, spec.width, spec.height);

    const tStart = Date.now();
    const result = await generateIdPhotoOneShot({ source: input, prompt: oneShotPrompt, spec });
    console.log('[Pipeline] Gemini Imagen one-shot done in', Date.now() - tStart, 'ms');

    // 从文字分析中提取 metadata
    const metadata = parseMetadataFromText(result.textResponse);

    // 裁切到目标尺寸 → JPEG
    const output = await sharp(result.buffer)
      .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log('[Pipeline] Gemini Imagen done, provider=', result.provider, 'finalSize=', output.length);

    return {
      buffer: output,
      mime: 'image/jpeg',
      provider: result.provider,
      spec,
      gender: metadata.gender,
      ageBucket: metadata.ageBucket,
      skinTone: metadata.skinTone,
    };
  }

  // ═══════════════════════════════════════════════
  // Step 1: 人脸特征分析
  // ═══════════════════════════════════════════════
  console.log('[Pipeline] step 1/3 analyzeFace...');
  const t1 = Date.now();
  const analyzePrompt = buildAnalyzePrompt();
  const analysis = await analyzeFace(input, analyzePrompt);
  console.log('[Pipeline] step 1 done in', Date.now() - t1, 'ms', {
    gender: analysis.gender,
    ageRange: analysis.ageRange,
    skinTone: analysis.skinTone,
    ethnicity: analysis.ethnicity,
  });

  // ═══════════════════════════════════════════════
  // Step 2: AI 重新生成证件照
  // ═══════════════════════════════════════════════
  console.log('[Pipeline] step 2/3 generatePhoto...');
  const t2 = Date.now();
  const generatePrompt = buildGeneratePrompt(analysis, bgColor, suitHint);
  const generated = await generatePhoto(input, generatePrompt, spec);
  console.log('[Pipeline] step 2 done in', Date.now() - t2, 'ms, provider:', generated.provider);

  // ═══════════════════════════════════════════════
  // Step 3: 裁切到目标尺寸 → JPEG
  // ═══════════════════════════════════════════════
  console.log('[Pipeline] step 3/3 resize to', spec.width, 'x', spec.height);
  const output = await sharp(generated.buffer)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log('[Pipeline] V6 done, provider=', generated.provider, 'finalSize=', output.length);

  return {
    buffer: output,
    mime: 'image/jpeg',
    provider: generated.provider,
    spec,
    gender: analysis.gender,
    ageBucket: analysis.ageRange,
    skinTone: analysis.skinTone,
  };
}

/** 从 Gemini Imagen 返回的文字中提取 metadata */
function parseMetadataFromText(text: string): {
  gender: string;
  ageBucket: string;
  skinTone: string;
} {
  const defaults = { gender: 'unknown', ageBucket: 'adult', skinTone: 'medium' };

  // 尝试匹配 JSON 块
  const jsonMatch = text.match(/\{[\s\S]*"gender"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        gender: parsed.gender || defaults.gender,
        ageBucket: parsed.ageRange || parsed.age || defaults.ageBucket,
        skinTone: parsed.skinTone || parsed.skin || defaults.skinTone,
      };
    } catch { /* fall through */ }
  }

  // 正则兜底
  const genderMatch = text.match(/\b(male|female)\b/i);
  if (genderMatch) defaults.gender = genderMatch[1].toLowerCase();

  const skinMatch = text.match(/\b(fair|medium|tan|deep)\b/i);
  if (skinMatch) defaults.skinTone = skinMatch[1].toLowerCase();

  const ageMatch = text.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/);
  if (ageMatch) defaults.ageBucket = `${ageMatch[1]}-${ageMatch[2]}`;

  return defaults;
}
