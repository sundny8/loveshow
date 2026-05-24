import sharp from 'sharp';
import { getPortraitStyle, type PortraitStyle } from './portrait-styles';
import { generateIdPhotoOneShot } from './gemini-imagen';

export interface PortraitPipelineOptions {
  /** 肖像风格 id */
  styleId: string;
  /** 性别：male / female / auto */
  gender: 'male' | 'female' | 'auto';
}

export interface PortraitPipelineResult {
  buffer: Buffer;
  mime: 'image/jpeg';
  provider: string;
  styleId: string;
  styleName: string;
  gender: string;
}

/**
 * AI 肖像照生成流水线。
 *
 * 一次 API 调用完成识图 + 生图：
 *   1. 把风格提示词里的"颗粒 / 光斑 / 斑驳"等危险实词在源头删除/替换
 *   2. 用正向"洁净肤色"指令构建一键提示词
 *   3. 调用 Gemini Imagen 生图
 *   4. sharp 标准化输出
 *
 * 设计原则（重要）：
 *   - 文生图模型对**正向实词**（grain / freckle / 颗粒 / 光斑）的激活
 *     远强于对**否定指令**的抑制，所以在源头删词比事后追加"不要做 X"
 *     更可靠。
 *   - 不做"参考图痣点清点"——会把毛孔/阴影误判为痣并放大成黑点。
 *   - 不反复枚举 mole / freckle / 黑痣 —— 出现次数越多模型注意力权重越高。
 */
export async function runPortraitPipeline(
  input: Buffer,
  options: PortraitPipelineOptions
): Promise<PortraitPipelineResult> {
  const style = getPortraitStyle(options.styleId);
  if (!style) {
    throw new Error(`unknown_style: ${options.styleId}`);
  }

  // 选择提示词：auto 时用 female 作为默认（女性提示词通常更通用）
  const promptKey = options.gender === 'male' ? 'male' : 'female';
  const stylePrompt = style.prompts[promptKey];
  const usedGender = options.gender === 'auto' ? 'female' : options.gender;

  // 方案一：从风格提示词里**实词删除/替换**会被模型当作脸上痣点的关键词。
  const safeStylePrompt = sanitizeStylePromptForFace(stylePrompt);

  const oneShotPrompt = buildPortraitOneShotPrompt(safeStylePrompt, style);

  console.log('[PortraitPipeline] start', {
    styleId: style.id,
    styleName: style.name,
    gender: usedGender,
    promptKey,
  });

  const tStart = Date.now();
  const result = await generateIdPhotoOneShot({
    source: input,
    prompt: oneShotPrompt,
    spec: {
      id: style.id,
      label: style.name,
      width: 1600,
      height: 2400,
      dpi: 300,
      bgColor: '#FFFFFF',
      suitHint: 'none',
      description: style.description,
    },
  });

  console.log('[PortraitPipeline] one-shot done in', Date.now() - tStart, 'ms');

  // 标准化输出：JPEG 高质量
  const output = await sharp(result.buffer)
    .jpeg({ quality: 92 })
    .toBuffer();

  console.log('[PortraitPipeline] done, finalSize=', output.length);

  return {
    buffer: output,
    mime: 'image/jpeg',
    provider: result.provider,
    styleId: style.id,
    styleName: style.name,
    gender: usedGender,
  };
}

/**
 * 方案一：源头删除危险词。
 *
 * 把每个风格 prompt 里那些会被扩散模型解释成脸上痣点的"实词"
 * 在喂给模型之前**直接替换或删除**，而不是在后面追加"不要做 X"
 * 的免责声明（追加无效——前面的正向实词已经把视觉概念注入了）。
 *
 * 替换原则：保留风格的"色调 / 氛围 / 镜头语言"，只剥离会被
 * 翻译成皮肤上离散黑点的具体颗粒/斑驳词。
 */
function sanitizeStylePromptForFace(stylePrompt: string): string {
  const replacements: Array<[RegExp, string]> = [
    // ── 中文：颗粒类 ──────────────────────────────
    [/细腻胶片颗粒质感/g, '细腻胶片色调'],
    [/细腻的胶片颗粒质感/g, '细腻的胶片色调'],
    [/胶片颗粒质感/g, '胶片色调'],
    [/胶片颗粒/g, '胶片色调'],
    [/强颗粒感/g, '深沉色调'],
    [/轻颗粒/g, '柔和色调'],
    [/颗粒粗糙/g, '深沉质感'],
    [/颗粒感/g, '色调感'],
    [/颗粒、微模糊边缘/g, '柔焦边缘'],
    [/颗粒、柔焦背景/g, '柔焦背景'],
    [/颗粒/g, '色调'],

    // ── 中文：斑驳 / 光斑 ────────────────────────
    [/光影斑驳/g, '柔和光影'],
    [/光斑点缀/g, '柔和光线点缀'],
    [/树影斑驳/g, '树影柔和'],
    [/斑驳/g, '柔和'],
    [/光斑/g, '柔和高光'],

    // ── 中文：胶片型号（自带"颗粒"内涵）──────────
    [/模拟Kodak Portra 400胶片风格/g, '复古暖色调电影感'],
    [/Kodak Portra 400/g, 'Kodak 暖色调电影感'],
    [/Leica M Monochrom风格/g, 'Leica 黑白电影质感'],
    [/Leica M系列拍摄效果/g, 'Leica 风格的画面质感'],
    [/8K高清胶片质感/g, '8K 高清电影质感'],
    [/8K高清胶片感摄影棚级画质/g, '8K 高清电影级画质'],
    [/8K，高对比柔光质感/g, '8K，柔光质感'],
    [/35mm胶片摄影作品/g, '35mm 电影画面'],
    [/35mm胶片风格/g, '35mm 电影风格'],

    // ── 英文：grain / spots / dappled ───────────
    [/film grain/gi, 'cinematic tone'],
    [/grain texture/gi, 'cinematic tone'],
    [/grainy/gi, 'cinematic'],
    [/grain/gi, 'tone'],
    [/dappled light/gi, 'soft light'],
    [/dappled/gi, 'soft'],
    [/light spots/gi, 'soft highlights'],
    [/freckled/gi, 'natural'],
    [/speckled/gi, 'subtle'],
  ];

  let cleaned = stylePrompt;
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

/**
 * 方案二/三/四：精简的一键提示词构建器。
 *
 * 重要原则：
 *   - 不再要求模型做"skin-mark inventory"（避免幻觉造痣）
 *   - 把"洁净皮肤"硬约束放在 prompt 最前面（前 token 权重最高）
 *   - 用正向描述代替负向枚举（"clean even-toned skin" 而不是
 *     "no mole, no freckle, no dark dot, no age spot..."）
 *   - "痣 / mole / freckle" 等高风险词只出现一次，且在末尾
 *   - 整体长度压到 ~25 行，让关键约束更突出
 */
function buildPortraitOneShotPrompt(
  stylePrompt: string,
  style: PortraitStyle
): string {
  return `You are a world-class portrait photographer. Generate a stunning stylized portrait that preserves the person's identity from the reference photo.

═══════════════════════════════════════
TOP PRIORITY — SKIN APPEARANCE (READ FIRST)
═══════════════════════════════════════
The face and neck must show CLEAN, SMOOTH, EVEN-TONED, FLAWLESS skin throughout
the entire portrait. Render a healthy uniform complexion with soft natural pore
texture only. The facial and neck skin surface must remain visually pure with
no discrete dark elements of any kind.

人物的面部和颈部皮肤必须干净、光滑、肤色均匀、瓷感自然，呈现健康均匀的肤质，
只保留柔和自然的毛孔细节，不出现任何深色斑点或离散的暗色细节。

═══════════════════════════════════════
IDENTITY PRESERVATION
═══════════════════════════════════════
- Preserve exact facial identity — the person MUST be recognizable
- Preserve exact age — do NOT age up or age down
- Keep original face shape, facial structure and proportions
- Keep original eyes (eyelid type, shape, spacing) and nose unchanged
- No beautification, no plastic-surgery look, no AI-perfected symmetry
- No anime, cartoon, or illustration style

═══════════════════════════════════════
STYLE
═══════════════════════════════════════
STYLE: ${style.name} (${style.nameEn})
${stylePrompt}

═══════════════════════════════════════
TEXTURE ROUTING (IMPORTANT)
═══════════════════════════════════════
Any cinematic tone, soft light variation, shadow contrast, or atmospheric
texture mentioned in the style description must appear ONLY on:
  ✓ Background (walls, sky, foliage, gradient backdrop)
  ✓ Hair and clothing
  ✓ Out-of-focus areas

Facial skin and neck skin must stay clean and uniform — no texture artifacts,
no isolated dark elements, no scattered specks. Render any film/cinematic feel
as a smooth color tone, not as discrete dots on the skin.

═══════════════════════════════════════
TECHNICAL
═══════════════════════════════════════
- High resolution, photorealistic, sharp focus on the face
- Natural skin with visible pores but flawless even tone on face and neck
- Looks like a professional photograph, not AI art
- No text, watermarks, signatures, or logos in the image

OUTPUT: Generate the portrait image directly. Do not output any text or
analysis before the image.`;
}
