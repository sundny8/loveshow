import sharp from 'sharp';
import type { FaceBox } from './crop';

export interface DetectResult {
  face: FaceBox | null;
  gender: 'male' | 'female' | 'unknown';
  ageBucket: 'child' | 'teen' | 'adult' | 'senior';
  skinTone: 'fair' | 'medium' | 'tan' | 'deep';
  /** 发色估计（从面部上方区域采样） */
  hairColor: 'black' | 'dark_brown' | 'light_brown' | 'blonde' | 'red' | 'grey' | 'white' | 'unknown';
  /** 是否走了启发式兜底（mediaPipe 未加载时为 true） */
  heuristic: boolean;
}

/**
 * 人像检测：优先尝试 MediaPipe，失败/未加载时退化到启发式。
 *
 * MediaPipe 的 wasm runtime 在 Node Server 端初始化相对复杂，
 * 为保证首次运行零配置也能工作，这里采用「检测失败则兜底」策略：
 *   - 尝试 dynamic import '@mediapipe/tasks-vision'
 *   - 成功则调用 FaceDetector 得到 bounding box
 *   - 任意环节抛错，走 centered heuristic
 *
 * gender / age / skinTone 目前都是启发式：
 *   - skinTone 取面部中心像素 RGB 均值 → luminance 分段
 *   - gender / age 暂无可靠轻量级 Node 模型，默认 unknown / adult，
 *     由 prompt 层用 "portrait of a person" 泛化处理。
 */
export async function detectPortrait(buffer: Buffer): Promise<DetectResult> {
  const meta = await sharp(buffer).metadata();
  const imageW = meta.width ?? 0;
  const imageH = meta.height ?? 0;

  let face: FaceBox | null = null;
  let heuristic = true;

  try {
    face = await detectWithMediaPipe(buffer, imageW, imageH);
    if (face) heuristic = false;
  } catch {
    face = null;
  }

  if (!face && imageW && imageH) {
    // 中心 55% 作为兜底"假想脸部"
    const w = Math.round(imageW * 0.45);
    const h = Math.round(imageH * 0.55);
    face = {
      x: Math.round((imageW - w) / 2),
      y: Math.round(imageH * 0.15),
      w,
      h,
      imageW,
      imageH,
    };
  }

  const skinTone = await estimateSkinTone(buffer, face);
  const hairColor = await estimateHairColor(buffer, face);

  // 根据脸部相对大小粗略估算年龄段
  // 小孩脸部占整个画面面积比例更大，成年人相对小
  const ageBucket = estimateAgeBucket(face, imageW, imageH, skinTone, hairColor);

  return {
    face,
    gender: 'unknown',
    ageBucket,
    skinTone,
    hairColor,
    heuristic,
  };
}

/**
 * 通过脸部比例 + 发色估算年龄段。
 * - 小孩：脸部相对于图像占比大，且发色不是 grey/white
 * - 老人：发色为 grey/white 且脸部比例正常
 * - 青少年：脸部占比稍大且发色不是 grey/white
 */
function estimateAgeBucket(
  face: FaceBox | null,
  imageW: number,
  imageH: number,
  skinTone: DetectResult['skinTone'],
  hairColor: DetectResult['hairColor']
): DetectResult['ageBucket'] {
  if (!face || !imageW || !imageH) return 'adult';

  const faceAreaRatio = (face.w * face.h) / (imageW * imageH);
  const isGreyOrWhiteHair = hairColor === 'grey' || hairColor === 'white';

  // 老年人：白发/灰发 且 脸部占比正常（> 3%）
  if (isGreyOrWhiteHair && faceAreaRatio > 0.03) return 'senior';

  // 小孩：脸部占图像超过 22%（小孩头部相对身体占比大，半身炧时尤明显）
  // 且发色不是白发/灰发
  if (faceAreaRatio > 0.22 && !isGreyOrWhiteHair) return 'child';

  // 青少年：脸部占比稍大（12-22%）且无白/灰发
  if (faceAreaRatio > 0.12 && !isGreyOrWhiteHair) return 'teen';

  return 'adult';
}

async function detectWithMediaPipe(
  buffer: Buffer,
  imageW: number,
  imageH: number
): Promise<FaceBox | null> {
  // 动态 import，允许无 wasm 环境时安静失败
  const vision: any = await import('@mediapipe/tasks-vision').catch(() => null);
  if (!vision) return null;

  const { FilesetResolver, FaceDetector } = vision;
  if (!FilesetResolver || !FaceDetector) return null;

  const fileset = await FilesetResolver.forVisionTasks(
    // 本地 node_modules 里的 wasm 目录；若不存在则抛错被外层吞掉
    'node_modules/@mediapipe/tasks-vision/wasm'
  );
  const detector = await FaceDetector.createFromOptions(fileset, {
    baseOptions: {
      // 可选：放置 .task 模型到 public/models 并自建 asset server
      modelAssetPath:
        process.env.MEDIAPIPE_FACE_MODEL_URL ||
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.task',
    },
    runningMode: 'IMAGE',
  });

  // MediaPipe 需要 ImageData / HTMLImageElement，在 Node 端我们借道 sharp → raw RGBA
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const imageData = { data: new Uint8ClampedArray(data), width: info.width, height: info.height };
  const result = detector.detect(imageData as any);
  await detector.close();

  const det = result?.detections?.[0];
  if (!det?.boundingBox) return null;

  const bb = det.boundingBox;
  return {
    x: Math.round(bb.originX),
    y: Math.round(bb.originY),
    w: Math.round(bb.width),
    h: Math.round(bb.height),
    imageW,
    imageH,
  };
}

/**
 * 估计发色：采样人脸框正上方区域（发际线上方）的平均像素 RGB。
 */
async function estimateHairColor(
  buffer: Buffer,
  face: FaceBox | null
): Promise<DetectResult['hairColor']> {
  if (!face) return 'unknown';

  // 发色采样区：脸框顶部向上 0.3 * face.h 高度，水平居中取 60% 宽度
  const regionH = Math.max(8, Math.round(face.h * 0.28));
  const regionW = Math.max(8, Math.round(face.w * 0.60));
  const regionX = Math.round(face.x + (face.w - regionW) / 2);
  const regionY = Math.max(0, face.y - regionH);

  // 若区域超出图像边界则跳过
  if (
    regionX < 0 ||
    regionW <= 0 ||
    regionH <= 0 ||
    regionX + regionW > face.imageW ||
    regionY + regionH > face.imageH
  ) {
    return 'unknown';
  }

  try {
    const { data } = await sharp(buffer)
      .extract({ left: regionX, top: regionY, width: regionW, height: regionH })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let r = 0, g = 0, b = 0;
    const n = data.length / 3;
    for (let i = 0; i < data.length; i += 3) {
      r += data[i]; g += data[i + 1]; b += data[i + 2];
    }
    r /= n; g /= n; b /= n;

    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
    const warmBias = r - b; // 暖色偏移（红/棕/金 > 0，冷/黑 ≈ 0）

    if (lum > 210 && sat < 0.12) return 'white';
    if (lum > 140 && sat < 0.18) return 'grey';
    if (lum > 155 && warmBias > 25) return 'blonde';
    if (lum > 90 && warmBias > 45 && sat > 0.25) return 'red';
    if (lum > 80 && warmBias > 18) return 'light_brown';
    if (lum > 45) return 'dark_brown';
    return 'black';
  } catch {
    return 'unknown';
  }
}

async function estimateSkinTone(
  buffer: Buffer,
  face: FaceBox | null
): Promise<DetectResult['skinTone']> {
  if (!face) return 'medium';

  // 取面部中心 32x32 小块
  const size = 32;
  const cx = Math.max(0, Math.round(face.x + face.w / 2 - size / 2));
  const cy = Math.max(0, Math.round(face.y + face.h / 2 - size / 2));

  try {
    const { data } = await sharp(buffer)
      .extract({ left: cx, top: cy, width: size, height: size })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let r = 0, g = 0, b = 0;
    const n = data.length / 3;
    for (let i = 0; i < data.length; i += 3) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r /= n;
    g /= n;
    b /= n;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum > 210) return 'fair';
    if (lum > 170) return 'medium';
    if (lum > 120) return 'tan';
    return 'deep';
  } catch {
    return 'medium';
  }
}
