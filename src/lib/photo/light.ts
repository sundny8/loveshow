import sharp from 'sharp';

/**
 * 证件照专用提亮 + 肤质优化：
 * - 明显提高亮度（面部和颈部皮肤更白皙通透）
 * - 微降饱和度（避免提亮后过饱和造成的"假脸"感）
 * - 轻度锐化（发丝和五官边缘更清晰）
 */
export async function brighten(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .modulate({
      brightness: 1.12,   // +12% 亮度：显著提亮面部和颈部
      saturation: 0.98,   // 微降饱和度：保持肤色自然
    })
    .sharpen({ sigma: 0.7 })
    .toBuffer();
}
