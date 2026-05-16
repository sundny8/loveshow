import type { PhotoSpec } from './specs';
import type { FaceAnalysis } from './face-analyze';

/**
 * Step 1: 人脸特征分析提示词。
 * 要求 Gemini 返回精确的面部几何数据，用于后续高保真生成。
 */
export function buildAnalyzePrompt(): string {
  return `Analyze this portrait photo and return a JSON object describing the person's facial features with MAXIMUM precision. This will be used to reconstruct the SAME person in an AI-generated ID photo — accuracy is critical. EVERY feature you describe will be directly used to regenerate the face. If you get the eyelids or face shape wrong, the generated face will look like a DIFFERENT person.

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:

{
  "gender": "male" | "female",
  "skinTone": "fair" | "medium" | "tan" | "deep",
  "ageRange": "e.g. 3-5 (child), 13-17 (teen), 18-22 (young adult), 45-50 (middle-aged), 65+ (senior). Be precise — this determines the generated person's age appearance.",
  "ethnicity": "East Asian" | "South Asian" | "Caucasian" | "African" | "Hispanic" | "Middle Eastern" | "Southeast Asian" | "Mixed",
  "faceShape": "oval" | "round" | "square" | "heart" | "long" | "diamond",
  "faceProportions": "Describe NUMERICALLY: face width-to-height ratio, forehead-to-face ratio (upper/middle/lower thirds), midface length relative to face height. Be precise with numbers.",
  "faceFullness": "Describe cheek fullness: full/puffy | moderate | slim/hollow. Side note if cheeks are prominent or flat.",
  "jawlineShape": "Describe in detail: jawline angularity (sharp V-line | rounded U-line | square/defined), jaw width (narrow | medium | wide), chin shape (pointed | rounded | square | cleft).",
  "cheekboneDescription": "Describe: cheekbone height (high/mid/low), prominence (strong/flat), width (narrow/wide). Do cheekbones create visible definition or are they soft?",
  "foreheadDescription": "Describe: forehead height relative to face (high/medium/low), width (narrow/wide), shape (rounded/flat/domed), temple visibility (visible/sunken/hidden).",
  "headShape": "Describe the OVERALL HEAD SILHOUETTE: crown shape (flat/rounded/pointed), head width at temples, skull height from crown to jaw, back-of-head curvature. How does the head outline look against a background?",
  "faceDescription": "Describe in 4-5 sentences the OVERALL face impression and contour: How do the upper face (forehead+temple width), mid face (cheekbone width), and lower face (jaw width) relate to each other? Is the face wider at the cheekbones than the jaw, or equal? Is the transition smooth or angular? What makes THIS face UNIQUE and recognizable among other faces of the same ethnicity/gender/age?",
  "eyeDescription": "DESCRIBE WITH EXTREME CARE — THIS IS THE #1 CAUSE OF IDENTITY LOSS: Are the eyelids SINGLE (monolid, NO crease visible) or DOUBLE (visible crease above lash line)? If double-eyelid: is the crease DEEP and parallel, MEDIUM depth tapered, or FAINT/hidden? Describe: eye shape (almond/round/narrow), eye size relative to face, eye spacing (wide-set/close-set/normal), canthal tilt (upturned/downturned/straight), upper eyelid puffiness, lower eyelid tightness, epicanthic fold (strong/faint/none), visible sclera below iris. Eye-to-eye inner corner distance vs single eye width.",
  "noseDescription": "Describe in 2 sentences: nose bridge STARTING HEIGHT from between-eyes level (high root/low root), bridge profile (straight/convex/concave), nose width at bridge tip and alar base, nose length relative to face, nostril shape and visibility from front, nose tip shape and angle.",
  "mouthDescription": "Describe in 2 sentences: lip thickness (thin/medium/full — separate upper and lower), upper lip shape (sharp cupid's-bow/rounded/flat), mouth width relative to nose width and face width, lip color, philtrum depth and width, corners (upturned/straight/downturned).",
  "eyebrowDescription": "Describe in 2 sentences: eyebrow thickness (thin/medium/thick), arch degree (straight/slight-arch/high-arch), arch peak position (center/outer-1/3), tail direction and length, distance from eye crease, eyebrow density and shape (defined/feathered), start and end positions relative to eye corners.",
  "hairDescription": "Describe in 3 sentences: hair color with tone, hair texture, thickness, length, hairstyle, bangs style and length, hairline shape, hair parting direction, how hair frames the face and affects perceived head silhouette.",
  "distinctiveFeatures": "Any moles with EXACT position, scars, dimples, freckles, beauty marks, glasses, or other unique identifiers. Be specific about position. Say 'none' if nothing notable.",
  "facialHair": "none" | "light stubble" | "mustache" | "goatee" | "full beard" | "heavy stubble"
}

CRITICAL RULES:
- Describe the ACTUAL photo content precisely. Every mistake causes identity loss.
- AGE DETECTION (CRITICAL — THIS IS THE #2 CAUSE OF IDENTITY LOSS): Look at facial bone structure, skin texture, eye-to-face size ratio, and jaw development to determine exact age. Children (under 12) have LARGER eyes relative to face, ROUNDER fuller cheeks, SMALLER shorter nose, SMOOTHER undefined jawline, and SOFTER skin. Teens (13-17) show emerging bone structure but retain youthful facial fat distribution. NEVER misidentify a child as an adult or an adult as a child — getting age wrong makes the person unrecognizable.
- For eyelids: if you see a crease above the lash line → DOUBLE EYELID. If no crease → MONOLID. This is THE most important field — getting it wrong changes the person's ethnicity appearance entirely.
- For head shape: look at the silhouette. Is the crown flat or rounded? Is the head wider at the temples or narrower? This defines the person's unique head profile.
- For face contour: describe the relationship between forehead width, cheekbone width, and jaw width. A face with cheekbones wider than jaw is very different from one with equal widths.
- For proportions: use CONCRETE ratios (e.g. 'face height is 1.4x face width', 'cheekbones are the widest point at 1.1x jaw width').
- What makes THIS face different from any other face of the same gender/ethnicity/age? Identify the unique COMBINATION of features.`;
}

/**
 * Step 2: 证件照生成提示词。
 * 将 FaceAnalysis + bgColor + suitHint 拼接为完整生图 prompt。
 */
export function buildGeneratePrompt(
  analysis: FaceAnalysis,
  bgColor: string,
  suitHint: PhotoSpec['suitHint']
): string {
  const suitDesc = getSuitDescription(suitHint);
  const bgDesc = getBackgroundDescription(bgColor);

  return `You are generating a professional ID photo. Your ABSOLUTE PRIORITY is to reproduce the SAME PERSON as described below — the face MUST be recognizable as this specific individual. Do not invent a generic person who matches the description in a vague way; reproduce exactly THIS face.

POSITIVE CONSTRAINTS — YOU MUST FOLLOW ALL OF THESE:
- preserve exact facial identity
- preserve exact age appearance — do NOT age up or age down
- keep original facial structure
- do not alter eyes
- do not alter nose
- keep exact face shape
- maintain original facial proportions
- minimal facial modification

NEGATIVE CONSTRAINTS — YOU MUST AVOID ALL OF THESE. Any of the following will result in FAILURE:
- different person
- beautified face
- symmetrical face
- larger eyes
- slim face
- altered facial features
- anime face
- smooth skin
- adult face
- adultified child / child face aged into adult
- aged face / wrong age appearance
- changed expression
- freckles, moles, or skin spots on face
- skin blemishes or discoloration

PERSON DESCRIPTION — EVERY detail below must be matched precisely:
- Gender: ${analysis.gender}
- Age: ${analysis.ageRange} years old
- Ethnicity: ${analysis.ethnicity}
- Skin tone: ${analysis.skinTone}
- Head shape: ${analysis.headShape}
- Face shape: ${analysis.faceShape}
- Face proportions: ${analysis.faceProportions}
- Face fullness: ${analysis.faceFullness}
- Jawline: ${analysis.jawlineShape}
- Cheekbones: ${analysis.cheekboneDescription}
- Forehead: ${analysis.foreheadDescription}
- Overall face: ${analysis.faceDescription}
- Eyes: ${analysis.eyeDescription}
- Nose: ${analysis.noseDescription}
- Mouth: ${analysis.mouthDescription}
- Eyebrows: ${analysis.eyebrowDescription}
- Hair: ${analysis.hairDescription}
- Facial hair: ${analysis.facialHair}
- Distinctive features: ${analysis.distinctiveFeatures}

FACIAL IDENTITY (READ CAREFULLY — THIS IS THE MOST IMPORTANT PART):
You MUST reproduce the EXACT face described above. Match:
- The precise face shape and width-to-height ratio. If the description says "1:1.35 width-to-height ratio", the generated face must have exactly these proportions.
- The HEAD SILHOUETTE exactly: crown flatness/roundness, head width at temples, skull height — the overall head outline must match.
- The FACE CONTOUR relationship between upper/mid/lower face. If cheekbones are wider than jaw, KEEP them wider. If equal, keep them equal.
- The jawline shape exactly as described: V-line / U-line / square — do not default to a generic V-line.
- The cheekbone prominence and position exactly as described.
- The chin shape (pointed / rounded / square) exactly as described.

AGE PRESERVATION (CRITICAL — THIS IS THE #2 CAUSE OF IDENTITY LOSS):
- The person's age is ${analysis.ageRange}. The generated face MUST look exactly this age — not older, not younger.
- If this is a child (under 12): the generated face MUST have child-appropriate facial proportions — larger eyes relative to face, rounder fuller cheeks, smaller nose, softer undefined jawline, smoother skin, and overall childlike bone structure. Do NOT generate an adult-looking face for a child. Do NOT add mature features like defined cheekbones, sharp jawline, or facial hair.
- If this is a teenager (13-17): keep youthful features but with emerging bone structure. Do NOT age them into a full adult face.
- If this is an adult: maintain the person's actual age appearance. Do NOT make them look younger or older.
- NEVER use a generic "25-year-old model" face as a default — match the SPECIFIC age in the description.

EYELID PRESERVATION (CRITICAL — THIS IS THE #1 CAUSE OF IDENTITY LOSS):
- READ the eye description carefully and PRESERVE the eyelid type EXACTLY.
- If description says DOUBLE EYELID → the generated face MUST have a visible crease above the lash line. Do NOT flatten to monolid.
- If description says MONOLID → the generated face MUST have NO crease. Do NOT add a double eyelid.
- If description says DEEP parallel double eyelid → the crease must be clearly visible and parallel to the lash line.
- If description says FAINT/hidden double eyelid → the crease must be subtle, barely visible.
- The eye spacing (wide-set / close-set / normal) and eye shape with ALL eyelid characteristics must be preserved.
- Epicanthic fold: if present, must be visible at inner eye corner.

OTHER FACIAL FEATURES:
- The nose bridge height, width, and tip shape exactly as described.
- The mouth width and lip proportions exactly as described. Upper and lower lip thickness must match separately.
- The eyebrow arch, thickness, and position exactly as described.

CLOTHING:
${suitDesc}

BACKGROUND:
Solid ${bgDesc} background. Studio seamless backdrop, perfectly uniform color, no gradients, no vignette, no shadows on the background.

SKIN PROCESSING (IDENTITY FIRST — facial identity preservation is 10× more important than skin beautification. If skin processing changes the person's recognizable appearance, it is a FAILURE. Keep the face recognizable first, brighten second.):
- Face and neck skin: Brighten to a naturally healthy fair tone. Aim for a clean, fresh complexion — like the person is standing in soft, even studio light. Do NOT over-whiten or make the skin look artificial or CGI. The person must still look like THEMSELVES, just with better lighting.
- Skin tone must remain consistent with the original ethnic skin characteristics. Do NOT change the person's natural undertone or make them look like a different ethnicity.
- Even out skin tone gently across forehead, cheeks, chin, and neck. Reduce contrast but do NOT make the face a uniform flat color — subtle natural variation is acceptable.
- Soften skin texture moderately for a smooth, clean look. Must remain photorealistic, not airbrushed or plastic.
- Remove ALL blemishes, dark spots, freckles, acne marks, skin discoloration, and uneven pigmentation. The skin must be completely clean and even-toned. Do NOT remove moles that are specified as distinctive features.
- Under-eye area: Brighten moderately to reduce dark circles and eye bags. The under-eye skin should blend naturally with cheek skin, not look unnaturally bleached.
- T-zone (forehead, nose): Control shine — reduce oiliness and specular highlights, but do NOT make the skin completely matte and flat.
- Nose sides and nasolabial folds: Soften slightly if shadows are deep, but preserve natural facial contour shadows that define the face shape.

HAIR CLEANUP (ABSOLUTELY CRITICAL):
- REMOVE ALL stray hairs around the head: flyaway hairs on top of head, wispy hairs on both sides of cheeks and temples.
- REMOVE ALL bangs/fringe covering the forehead. Forehead must be COMPLETELY VISIBLE and clear of hair.
- Hair behind ears must be removed — both ears COMPLETELY exposed with clean edges.
- Hairline must be neat, crisp, and well-defined against the background.
- No loose strands falling on the face, cheeks, or neck.
- Eyebrows fully visible, no hair covering them.

COMPOSITION (CRITICAL — follow exactly):
- HEAD AND SHOULDERS ONLY. Frame from the top of the head down to the upper chest.
- Do NOT show full body, arms, or hands.
- Face should occupy approximately 60-70% of the image height.
- Eyes positioned at roughly 1/3 from the top of the image.
- Person centered, shoulders squared, facing directly at the camera.
- Both ears fully visible with clean outlines.
- Neutral expression, mouth closed, eyes open and looking directly at the camera.
- Entire forehead exposed and clear.

LIGHTING AND QUALITY:
- Bright, even, diffused studio lighting with a key light from slightly above and a strong fill light from the front.
- The face should be well-lit with no shadows on any part of the face or neck.
- Slight soft shadow under the chin is acceptable for depth.
- High resolution, photorealistic, sharp focus on the eyes and face.
- Clean edges around the person, no artifacts, halos, or color fringing.
- Standard ID photo style: frontal view, passport-compliant.`;
}

/**
 * Gemini Imagen 一键识图生图提示词。
 *
 * 不需要 FaceAnalysis —— Gemini 内部分析参考图 + 生成证件照在同一调用完成。
 * 严格遵循 gemini.md 中“提示词模板建议”的四段式结构：
 *   [核心主题] → [面部指纹] → [规格要求] → [技术指令]
 * 并嵌入现有的正负向约束、皮肤/头发/构图规则。
 */
export function buildOneShotPrompt(
  bgColor: string,
  suitHint: PhotoSpec['suitHint'],
  specWidth: number,
  specHeight: number
): string {
  const suitDesc = getSuitDescription(suitHint);
  const bgDesc = getBackgroundDescription(bgColor);

  return `TASK: First, deeply analyze the reference photo to extract a detailed facial fingerprint. Then, use that analysis to generate a professional ID photo of THE SAME PERSON.

[核心主题 — Core Subject]
A high-resolution professional ID photo of the SAME person in the reference image. Preserve the original gender and age characteristics. Do NOT beautify into a different person. The face MUST be instantly recognizable as the individual in the reference photo.

[面部指纹 — Facial Fingerprint Analysis]
Before generating, analyze the reference photo across these 8 dimensions and use the analysis to guide generation:
1. AGE (CRITICAL): Determine the person's exact age. Child (under 12): larger eyes, round cheeks, small nose, soft jaw. Teen (13-17): emerging bone structure. Adult: mature proportions. The generated face MUST match this age. NEVER age a child into an adult or vice versa.
2. STRUCTURE: Face shape (oval/round/square/heart/long/diamond), jawline angularity (sharp V / rounded U / square), cheekbone prominence.
3. FEATURE RATIOS: Three-section face proportions (forehead-to-brow / brow-to-nose / nose-to-chin), eye-to-eye spacing vs single eye width.
4. EYES (MOST CRITICAL): Eyelid type — MONOLID (no crease) vs DOUBLE EYELID (visible crease above lash line). If double-eyelid: crease depth (deep-parallel / medium-tapered / faint-hidden). Eye shape (almond/round/narrow), canthal tilt, epicanthic fold presence.
5. NOSE: Bridge starting height, bridge profile (straight/convex/concave), alar base width, nose tip shape.
6. MOUTH: Upper/lower lip thickness separately, cupid's bow definition, mouth width relative to face.
7. MICRO-DETAILS: Moles with exact position, scars, dimples, freckles, eyebrow density and growth direction, hairline shape.
8. SKIN TONE: Accurate skin color description preserving ethnic undertone.

${buildConstraintsBlock()}

[规格要求 — Specifications]
Background: Plain solid ${bgDesc} background. Studio seamless backdrop, perfectly uniform color, no gradients, no vignette, no shadows on the background.
Attire: ${suitDesc}
Lighting: Soft frontal studio lighting, no shadows on the face, even illumination. Flat lighting preferred — avoid dramatic side shadows.

${buildSkinBlock()}

${buildHairBlock()}

[技术指令 — Technical Directives]
- Frontal view, looking directly at the camera, neutral expression, closed mouth.
- Centered composition, head and shoulders only.
- Face should occupy approximately 60-70% of the image height.
- Both ears fully visible with clean outlines.
- Entire forehead exposed and clear.
- Highly detailed skin texture with visible pores — avoid over-smoothed "AI plastic" look.
- Fine hair follicles visible at the hairline.
- Target aspect ratio: ${specWidth}×${specHeight}.
- Photorealistic, 4K quality, sharp focus on eyes.
- Standard ID photo style: passport-compliant.

OUTPUT: Return your analysis text first, then the generated ID photo image.`;
}

function buildConstraintsBlock(): string {
  return `[约束条件 — Positive Constraints — YOU MUST FOLLOW ALL]
- preserve exact facial identity
- preserve exact age — NEVER age up or age down; a child must remain a child, an adult must remain their age
- keep original facial structure
- do not alter eyes (preserve eyelid type, eye shape, spacing, canthal tilt)
- do not alter nose (preserve bridge, width, tip shape)
- keep exact face shape and proportions
- maintain original facial proportions (three-section ratios)
- minimal facial modification — identity preservation is the goal

[约束条件 — Negative Constraints — ANY OF THESE MEANS FAILURE]
- different person
- beautified face
- symmetrical face
- larger eyes
- slim face
- altered facial features
- anime face
- smooth skin
- adult face / aged face
- adultified child / child face aged into adult
- wrong age appearance
- changed expression
- freckles, moles, or skin spots on face
- skin blemishes or discoloration`;
}

function buildSkinBlock(): string {
  return `[皮肤处理 — IDENTITY FIRST — facial identity is 10× more important than skin beautification]
- Face and neck skin: Brighten to a naturally healthy fair tone — like standing in soft, even studio light. Do NOT over-whiten. The person must look like THEMSELVES, just with better lighting.
- Skin tone must remain consistent with the original ethnic skin characteristics. Do NOT change the person's natural undertone.
- Even out skin tone gently. Reduce contrast but do NOT make the face a uniform flat color — subtle natural variation is acceptable.
- Soften skin texture moderately for a smooth, clean look. Must remain photorealistic, not airbrushed or plastic.
- Remove ALL blemishes, dark spots, freckles, acne marks, skin discoloration, and uneven pigmentation. The skin must be completely clean and even-toned. Do NOT remove moles/scars that are distinctive features.
- Under-eye area: Brighten moderately to reduce dark circles, but blend naturally with cheek skin.
- T-zone: Control shine, reduce oiliness, but do NOT make skin completely matte and flat.
- Nose sides and nasolabial folds: Soften slightly if shadows are deep, but preserve facial contour shadows that define face shape.`;
}

function buildHairBlock(): string {
  return `[头发清理 — Hair Cleanup — CRITICAL]
- REMOVE ALL stray/flyaway hairs around the head. Clean, sharp hair edges against background.
- REMOVE ALL bangs/fringe covering the forehead. Forehead must be COMPLETELY VISIBLE.
- Hair behind ears must be removed. Both ears COMPLETELY exposed with clean outlines.
- Hairline must be neat, crisp, and well-defined.
- No loose strands on face, cheeks, or neck.
- Eyebrows fully visible, no hair covering them.`;
}

function getSuitDescription(suit: PhotoSpec['suitHint']): string {
  switch (suit) {
    case 'male':
      return 'A well-fitted dark navy business suit jacket over a crisp white dress shirt with a conservative solid-color silk necktie. Collar neatly pressed.';
    case 'female':
      return 'A tailored black blazer over a white silk blouse with a subtle V-neckline. Professional business attire, elegant and clean.';
    case 'student':
      return 'A clean white collared shirt under a navy V-neck knit sweater. Neat, youthful academic style.';
    case 'none':
    default:
      return 'A solid-color, neat, ironed top or shirt. Clean and presentable casual attire. No logos or patterns.';
  }
}

function getBackgroundDescription(hex: string): string {
  const normalized = hex.toUpperCase();
  const map: Record<string, string> = {
    '#FFFFFF': 'pure white',
    '#438EDB': 'ID-photo blue',
    '#DC2626': 'school red',
    '#F2F2F2': 'soft light grey',
    '#8B5CF6': 'creative violet',
  };
  const name = map[normalized];
  return name ? `${name} (${normalized})` : `custom color ${normalized}`;
}
