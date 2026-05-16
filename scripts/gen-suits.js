const sharp = require('sharp');
const path = require('path');

/**
 * 生成正装覆盖图：更大的 SVG 西装，采用全填充设计覆盖身部区域。
 *
 * 设计要点：
 * - 西装从上到下填满整个画布（will be placed at gravity: south）
 * - 上半部是 V 领西装外套 + 白衬衫领子 + 领带
 * - 下半部是完全不透明的西装，确保完全遮盖原有服装
 * - 宽高比例设计为证件照的底部 ~55%，顶部渐变融入
 */
async function generateSuit(name, jacketColor, lapelColor) {
  const w = 600;
  const h = 400;
  // 纽扣颜色
  const btnColor = '#111';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <!-- 西装上半部渐变：从透明（融入人物颈部）到完全不透明 -->
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${jacketColor}" stop-opacity="0"/>
        <stop offset="12%" stop-color="${jacketColor}" stop-opacity="0.6"/>
        <stop offset="22%" stop-color="${jacketColor}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${jacketColor}" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="lapelL" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${lapelColor}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${jacketColor}" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="lapelR" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lapelColor}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${jacketColor}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- 西装主体：填满整个底部 -->
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#topFade)"/>
    <!-- 左侧翻领 -->
    <path d="M30,0 L250,200 L250,400 L0,400 Z" fill="url(#lapelL)"/>
    <!-- 右侧翻领 -->
    <path d="M570,0 L350,200 L350,400 L600,400 Z" fill="url(#lapelR)"/>
    <!-- 白衬衫 V 区 -->
    <path d="M250,0 L300,160 L350,0 Z" fill="#ffffff" opacity="0.85"/>
    <!-- 领带 -->
    <path d="M287,10 L300,200 L313,10 Z" fill="#1a1a2e"/>
    <!-- 领带结 -->
    <ellipse cx="300" cy="30" rx="16" ry="12" fill="#151530"/>
    <!-- 左肩线 -->
    <path d="M0,60 L250,200" stroke="${jacketColor}" stroke-width="3" fill="none" opacity="0.5"/>
    <!-- 右肩线 -->
    <path d="M600,60 L350,200" stroke="${jacketColor}" stroke-width="3" fill="none" opacity="0.5"/>
    <!-- 纽扣 -->
    <circle cx="300" cy="260" r="5" fill="${btnColor}" opacity="0.6"/>
    <circle cx="300" cy="310" r="5" fill="${btnColor}" opacity="0.6"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .resize(w, h)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'suits', `${name}.png`));

  console.log(`Generated ${name}.png (${w}x${h})`);
}

async function main() {
  // 男款：深藏青西装 + 浅灰翻领
  await generateSuit('male', '#1a1a2e', '#2d3047');
  // 女款：深蓝西装 + 柔灰翻领
  await generateSuit('female', '#16213e', '#2a2f4a');
  // 学生款：深灰西装 + 白翻领
  await generateSuit('student', '#2d3436', '#3d4448');
}

main().catch(console.error);
