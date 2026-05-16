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
 * 与证件照生成逻辑一致——一次 API 调用完成识图 + 生图：
 *   1. 拼接综合提示词（人脸保持约束 + 风格化描述）
 *   2. 调用 Gemini Imagen 一键生图
 *   3. sharp 标准化输出
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

  // 把风格提示词里那些"颗粒/斑驳/光斑/反差"等容易被模型当作脸上痣点的词
  // 重新约束作用域到背景 / 衣服 / 头发 / 整体氛围，避免误植到面部和颈部。
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
 * 把风格提示词里"颗粒 / 斑驳 / 光斑 / 反差"等容易被模型解释成脸部痣点
 * 的词，明确限定到背景 / 衣服 / 头发 / 整体光影，避免落到人物面部和颈部。
 *
 * 这是行为层修正：与其让模型在最后一刻克制，不如从输入端就堵住歧义。
 */
function sanitizeStylePromptForFace(stylePrompt: string): string {
  return (
    stylePrompt +
    '\n（重要补充：上文中提到的"颗粒"、"颗粒感"、"颗粒粗糙"、"胶片颗粒"、"斑驳"、' +
    '"光斑"、"光影斑驳"、"色偏"、"高反差"、"阴影浓重"等纹理与质感关键词，' +
    '其作用域仅限于背景、衣服、头发、空气感与整体光影氛围，禁止把它们应用到' +
    '人物的面部（额头、眉间、眼周、鼻梁、鼻翼、面颊、嘴周、下巴）和颈部、' +
    '锁骨、耳廓皮肤上。面部与颈部的皮肤必须保持干净均匀，不出现任何颗粒点、' +
    '黑点、黑痣、雀斑、斑块、色斑或局部光斑，除非参考图中本来就有。）'
  );
}

/**
 * 构建肖像照一键提示词。
 *
 * 结构（按 LLM 的重视顺序倒推）：
 *   1. 人脸身份保持约束
 *   2. 风格化描述（已 sanitize）
 *   3. 皮肤痣点忠实度约束
 *   4. 技术指令
 *   5. 末尾再用中英文重复一次"面部颈部禁止出现新痣 / 黑点 / 斑块 / 光斑"
 */
function buildPortraitOneShotPrompt(
  stylePrompt: string,
  style: PortraitStyle
): string {
  return `You are a world-class portrait photographer. Your task is to analyze the reference photo and generate a stunning stylized portrait that preserves the person's identity while applying a specific artistic style.

═══════════════════════════════════════
STEP 1: ANALYZE THE REFERENCE PHOTO
═══════════════════════════════════════
Carefully analyze the uploaded portrait photo. Identify:
- Gender, approximate age, ethnicity
- Face shape, facial structure, key features
- Skin tone, hair color and style
- Distinctive facial characteristics that make this person unique
- IMPORTANT — Skin & facial-mark inventory: Make a precise inventory of every
  visible mole, beauty mark (美人痣), freckle, scar, dimple, birthmark, pimple
  scar or pigmentation patch on the face AND neck. For each, record (a) presence,
  (b) exact position relative to other features, (c) approximate size and color.
  Marks NOT visible in the reference do NOT exist for this person — treat them
  as absent on the output canvas.

═══════════════════════════════════════
STEP 2: GENERATE STYLIZED PORTRAIT
═══════════════════════════════════════
Apply the following style while PRESERVING the person's facial identity:

STYLE: ${style.name} (${style.nameEn})
${stylePrompt}

═══════════════════════════════════════
CRITICAL IDENTITY CONSTRAINTS
═══════════════════════════════════════
POSITIVE — YOU MUST FOLLOW ALL:
- Preserve exact facial identity — the person MUST be recognizable
- Preserve exact age appearance — do NOT age up or age down
- Keep original facial structure, face shape, and proportions
- Do not alter eyes (preserve eyelid type, eye shape, spacing)
- Do not alter nose (preserve bridge, width, tip shape)
- Maintain original facial proportions (three-section ratios)
- Minimal facial modification — identity preservation is the NUMBER ONE goal

═══════════════════════════════════════
SKIN-MARK FIDELITY — STRICT RULES
═══════════════════════════════════════
- The reference photo is the ONLY source of truth for moles, beauty marks,
  freckles, scars, dimples and birthmarks. Reproduce EVERY mark visible in
  the reference at the same position, same size, same color. A 美人痣 next to
  the lip in the reference must remain in the output at the exact same spot.
- ZERO TOLERANCE for invented marks: do NOT add any new mole, dark dot, black
  dot, freckle, age spot, sunspot, blemish, acne, hyperpigmentation, melasma,
  scar, bruise, lesion or skin patch that is not present in the reference. If
  in doubt, omit it.
- Do not "stylize" by sprinkling random freckles across the cheekbones, nose
  bridge, or shoulders for an artistic effect — this is forbidden.
- Skin texture should remain natural (visible pores, subtle tone variation),
  but it must be CLEAN of any spot that is not in the source photo.

═══════════════════════════════════════
GRAIN / NOISE / LIGHT-SPOT ROUTING (CRITICAL)
═══════════════════════════════════════
Many style descriptions above mention "颗粒 / 颗粒感 / 颗粒粗糙 / 胶片颗粒
/ film grain / 斑驳 / dappled light / 光斑 / light spots / 高反差 / high
contrast / 阴影浓重 / heavy shadow / 色偏 / color shift". These elements
must be ROUTED to allowed regions only:

ALLOWED to receive grain / spots / dappled light / heavy shadow / color shift:
  ✓ Background (walls, sky, foliage, street, gradient backdrop)
  ✓ Hair and clothing
  ✓ Broad ambient atmosphere and air
  ✓ Out-of-focus areas

FORBIDDEN — these regions must stay clean:
  ✗ Face skin: forehead, brows, eyelids, under-eyes, nose bridge, nose tip,
    nostrils, cheeks, cheekbones, area around the mouth, chin
  ✗ Neck, throat, collarbones, ear-skin
  ✗ Shoulders if exposed

Specifically:
- Render film/digital grain as a UNIFORM, fine, low-amplitude noise overlay.
  Never let grain coalesce into discrete dark dots on the face or neck.
- Render dappled light / window-shadow patterns ONLY on background or
  clothing. Do not let them paint dark spots on cheeks/forehead.
- Render high contrast and heavy shadows as broad smooth gradients, not as
  isolated dark blotches on the face.

═══════════════════════════════════════
NEGATIVE — ANY OF THESE MEANS FAILURE
═══════════════════════════════════════
- Different person / unrecognizable face
- Beautified face / plastic surgery look
- Symmetrical face / AI-perfected face
- Larger eyes / altered eye shape
- Slim face / altered jawline
- Anime / cartoon / illustration look
- Over-smoothed skin / AI plastic look
- Aging up or aging down the person
- Removing or relocating any mole, beauty mark (美人痣), scar, dimple or
  distinctive mark that IS present in the reference
- Adding any new mole, dark dot, black spot, freckle, age spot, blemish,
  acne, pigmentation patch, dark blotch, or skin discoloration on the face
  or neck that is NOT present in the reference (this rule applies to EVERY
  style — minimalist, fashion, dark mood, film, B&W, forest, French street,
  studio, japanese — without exception)
- Painting dappled light, light spots, or shadow patches on the facial skin
  or neck skin

═══════════════════════════════════════
TECHNICAL REQUIREMENTS
═══════════════════════════════════════
- High resolution, photorealistic, sharp focus on face
- Natural skin texture with visible pores — no over-smoothing
- Clean, even facial and neck skin: only the marks present in the reference
  photo may appear there
- The generated portrait should look like a professional photograph, not AI art
- No text, no watermarks, no signatures, no logos anywhere in the image

═══════════════════════════════════════
FINAL CHECK BEFORE OUTPUT (MANDATORY)
═══════════════════════════════════════
Before producing the final image, mentally re-scan the face and neck:
1. List every dark dot / spot / patch / freckle currently on the face & neck.
2. Compare each one against your Step-1 inventory of the reference photo.
3. Any dark element on face or neck that is NOT in the inventory MUST be
   removed before output. No exceptions, no "artistic license", no "grain
   accident".
4. 中文复述（重要）：最终图中，人物的脸部和颈部除了参考图本来就有的痣 /
   美人痣 / 疤 / 酒窝 / 胎记之外，绝对不能出现任何黑痣、黑点、斑块、雀斑、
   色斑、老年斑、痘印、阴影斑点或局部光斑。颗粒、斑驳光影、光斑只允许
   出现在背景、头发、衣服上，不能落在面部和颈部皮肤上。

OUTPUT: First write the Step-1 skin-mark inventory in plain text, then
produce the generated portrait image.`;
}
