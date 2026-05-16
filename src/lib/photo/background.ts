import sharp from 'sharp';

/**
 * 将前景图（带透明或已抠出）合成到纯色/渐变背景上。
 * 若 color 以 "gradient:" 前缀开头，则绘制垂直线性渐变，例如
 * "gradient:#8b5cf6,#f97316"
 */
export async function replaceBackground(
  foreground: Buffer,
  width: number,
  height: number,
  color = '#438EDB'
): Promise<Buffer> {
  const bg = await makeBackground(width, height, color);

  // 先把前景 resize 到目标尺寸的 cover 模式，保证比例
  const fit = await sharp(foreground)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toBuffer();

  return sharp(bg)
    .composite([{ input: fit, blend: 'over' }])
    .png()
    .toBuffer();
}

async function makeBackground(
  width: number,
  height: number,
  color: string
): Promise<Buffer> {
  if (color.startsWith('gradient:')) {
    const [from, to] = color.replace('gradient:', '').split(',');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();
}
