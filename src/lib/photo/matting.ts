import sharp from 'sharp';
import type { FaceBox } from './crop';

/**
 * 使用 @imgly/background-removal-node 做人像抠图。
 * 返回前景（无背景的人像 PNG）和 mask（黑白图，白=人像）。
 */
export interface MattingResult {
  /** 扣出的人像（透明背景 PNG） */
  foreground: Buffer;
  /** 人像 mask 灰度图（白=人像，黑=背景） */
  mask: Buffer;
  width: number;
  height: number;
}

/**
 * 人像抠图：使用 rembg 等价算法。
 * 失败时返回 null（由调用方降级处理）。
 */
export async function removeBackground(
  buffer: Buffer,
  options: {
    /** 目标尺寸（可选，默认保持原尺寸） */
    width?: number;
    height?: number;
  } = {}
): Promise<MattingResult | null> {
  try {
    // webpackIgnore: 此包含原生 .node 二进制，必须跳过 webpack 编译，运行时由 Node.js 直接加载
    const bgRemoval = await import(/* webpackIgnore: true */ '@imgly/background-removal-node').catch(() => null);
    if (!bgRemoval) {
      console.warn('[Matting] @imgly/background-removal-node not available');
      return null;
    }

    const started = Date.now();
    console.log('[Matting] removing background...');

    // 转换为 Blob 供 SDK 使用
    // Blob constructor accepts Buffer but type defs are narrow; force cast
    const blob = new Blob([buffer as unknown as BlobPart], { type: 'image/png' });

    // 抠图
    const resultBlob = await bgRemoval.removeBackground(blob, {
      model: 'medium',    // v1.4.5 仅支持 small/medium 模型
      output: {
        format: 'image/png',
      },
    });

    const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

    // 缩放（如果需要）
    let final: Buffer = resultBuffer;
    let w = options.width;
    let h = options.height;

    if (options.width && options.height) {
      final = await sharp(resultBuffer)
        .resize(options.width, options.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      w = options.width;
      h = options.height;
    } else {
      const meta = await sharp(final).metadata();
      w = meta.width ?? 0;
      h = meta.height ?? 0;
    }

    // 从透明前景提取 alpha 通道作为 mask（必须 .png() 确保输出标准格式）
    const rawMask = await sharp(final)
      .ensureAlpha()
      .extractChannel(3) // alpha channel → 单通道灰度
      .png()              // 必须：输出 PNG 格式（否则为 raw 像素，下游无法解码）
      .toBuffer();

    // 膨胀 mask 3px，防止抠图边缘损失人物轮廓（发丝、肩膀等细节）
    const mask = await sharp(rawMask)
      .blur(1.5)         // 微模糊软化边缘
      .linear(1.15, -20) // 提亮 + 降低暗部阈值 → 白区扩大约 3px
      .png()
      .toBuffer();

    console.log('[Matting] done in', Date.now() - started, 'ms, size:', w, 'x', h);

    return {
      foreground: final,
      mask,
      width: w!,
      height: h!,
    };
  } catch (err: any) {
    console.warn('[Matting] failed:', err?.message || err);
    return null;
  }
}

/**
 * 生成一个简单的人像 mask 降级方案：
 * 基于人脸 bbox 构造椭圆形蒙版（当 rembg 不可用时使用）。
 */
export function fallbackMask(
  face: FaceBox | null,
  width: number,
  height: number
): Buffer {
  const svg = buildFallbackMaskSvg(face, width, height);
  return Buffer.from(svg);
}

function buildFallbackMaskSvg(
  face: FaceBox | null,
  width: number,
  height: number
): string {
  // 基于人脸框构造纵向渐变 mask：
  // 顶部 → 人脸上方 → 人像主体 → 底部，由黑到白再到黑
  // 这样整个画面都被遮罩覆盖，不会漏出原背景
  if (face) {
    const topWhite = Math.max(0, (face.y - face.h * 0.4) / height);
    const botWhite = Math.min(1, (face.y + face.h * 1.3) / height);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black"/>
          <stop offset="${Math.round(topWhite * 100)}%" stop-color="white"/>
          <stop offset="${Math.round(botWhite * 100)}%" stop-color="white"/>
          <stop offset="100%" stop-color="black"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
  }

  // 完全无人脸时：全幅柔和过渡
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black"/>
        <stop offset="15%" stop-color="white"/>
        <stop offset="85%" stop-color="white"/>
        <stop offset="100%" stop-color="black"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
}
