/** Cartoon avatar styles for couple sticker generation. */
export type AvatarStyle =
  | 'chibi'
  | 'studio-ghibli'
  | 'pixar3d'
  | 'korean-manhwa'
  | 'sticker-doodle';

export const AVATAR_STYLES: Array<{
  id: AvatarStyle;
  labelZh: string;
  labelEn: string;
  promptHint: string;
}> = [
  {
    id: 'chibi',
    labelZh: 'Q版萌系',
    labelEn: 'Chibi Cute',
    promptHint:
      'super-deformed chibi style with oversized adorable heads, tiny bodies, big sparkling eyes, soft pastel palette, sticker-pack vibes, thick clean outlines',
  },
  {
    id: 'studio-ghibli',
    labelZh: '宫崎骏风',
    labelEn: 'Ghibli Anime',
    promptHint:
      'studio-ghibli inspired hand-drawn anime style, gentle warm colors, soft brushy textures, dreamy atmosphere, watercolor highlights',
  },
  {
    id: 'pixar3d',
    labelZh: '皮克斯3D',
    labelEn: 'Pixar 3D',
    promptHint:
      'pixar 3d animation style, cute stylized proportions, glossy hair shader, soft global illumination, friendly happy expressions, premium 3d render quality',
  },
  {
    id: 'korean-manhwa',
    labelZh: '韩漫风',
    labelEn: 'Korean Manhwa',
    promptHint:
      'modern korean webtoon manhwa style, clean lineart, semi-realistic faces, soft cell shading, trendy outfits, romantic light atmosphere',
  },
  {
    id: 'sticker-doodle',
    labelZh: '贴纸涂鸦',
    labelEn: 'Sticker Doodle',
    promptHint:
      'flat sticker design, thick white border around the figures, simple doodle outlines, vivid pop-color fills, transparent / pure white background, ready to print as messaging sticker',
  },
];

export function buildAvatarPrompt(input: {
  style: AvatarStyle;
  customNote?: string;
}): string {
  const meta = AVATAR_STYLES.find((s) => s.id === input.style) ?? AVATAR_STYLES[0];

  const lines = [
    'You are an AI illustrator generating a couple cartoon-avatar / sticker image.',
    'Task: From the provided reference photo of two people, draw a stylized cartoon double-portrait of the SAME couple in the requested style.',
    '',
    'Strict rules:',
    '- Both people must clearly resemble their reference (hairstyle, gender presentation, glasses, distinctive features).',
    '- The two should be posed sweetly together: heads close, leaning, hugging, peace sign, or similar cute couple pose.',
    '- Pure decorative background (solid color, soft gradient, or hearts pattern). NO realistic photographic background.',
    '- Centered composition, square framing 1:1.',
    '- Friendly, wholesome, suitable for chat avatars and stickers.',
    '',
    `Style: ${meta.labelEn} (${meta.labelZh})`,
    `Style description: ${meta.promptHint}`,
  ];

  if (input.customNote) {
    lines.push(`Additional user note: ${input.customNote}`);
  }

  lines.push('', 'Output: one high-quality square cartoon image of the couple.');
  return lines.join('\n');
}
