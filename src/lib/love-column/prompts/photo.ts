/** Scene presets for couple photo shoots. */
export type PhotoScene =
  | 'beach-sunset'
  | 'cherry-blossom'
  | 'starry-night'
  | 'cafe-date'
  | 'paris-street'
  | 'autumn-park'
  | 'wedding-style'
  | 'film-grain';

export const PHOTO_SCENES: Array<{
  id: PhotoScene;
  labelZh: string;
  labelEn: string;
  promptHint: string;
}> = [
  {
    id: 'beach-sunset',
    labelZh: '夕阳沙滩',
    labelEn: 'Beach Sunset',
    promptHint:
      'golden-hour beach with warm sunset glow, soft rim light, gentle waves, the couple holding hands, cinematic film quality',
  },
  {
    id: 'cherry-blossom',
    labelZh: '樱花树下',
    labelEn: 'Cherry Blossom',
    promptHint:
      'a peaceful park under blooming cherry blossom trees, pink petals drifting, dreamy bokeh, soft daylight, tender romantic mood',
  },
  {
    id: 'starry-night',
    labelZh: '星空夜景',
    labelEn: 'Starry Night',
    promptHint:
      'a quiet hilltop under a vast starry sky and milky way, the couple cuddling, faint city lights below, deep blue tones, fairy-tale atmosphere',
  },
  {
    id: 'cafe-date',
    labelZh: '咖啡馆约会',
    labelEn: 'Cafe Date',
    promptHint:
      'warm vintage cafe interior, soft golden tungsten lights, the couple smiling across a small wooden table, latte art steaming, cozy magazine aesthetic',
  },
  {
    id: 'paris-street',
    labelZh: '巴黎街头',
    labelEn: 'Paris Street',
    promptHint:
      'a romantic Parisian street, the Eiffel Tower in soft focus background, cobblestones, lifestyle vogue editorial photography, the couple walking hand in hand',
  },
  {
    id: 'autumn-park',
    labelZh: '秋日公园',
    labelEn: 'Autumn Park',
    promptHint:
      'golden autumn park, fallen maple leaves, soft warm sunlight filtering through trees, the couple in cozy coats hugging, nostalgic film tone',
  },
  {
    id: 'wedding-style',
    labelZh: '韩式婚纱',
    labelEn: 'Korean Wedding',
    promptHint:
      'pure white minimal studio, soft natural light, the couple in elegant Korean-style wedding attire, fine art wedding photography, gentle smiles, premium magazine quality',
  },
  {
    id: 'film-grain',
    labelZh: '胶片复古',
    labelEn: 'Film Grain',
    promptHint:
      'kodak portra 400 film aesthetic, warm tones, slight grain, daily-life candid moment of the couple, retro 90s vibe, casual outfits',
  },
];

export function buildCouplePhotoPrompt(input: {
  scene: PhotoScene;
  customNote?: string;
}): string {
  const meta =
    PHOTO_SCENES.find((s) => s.id === input.scene) ?? PHOTO_SCENES[0];

  const lines = [
    'You are a professional couple-portrait photographer + AI image generator.',
    'Task: Take the two people from the provided reference photo and create a NEW high-quality couple portrait in the requested scene.',
    '',
    'Strict rules:',
    '- Preserve the FACIAL identity, gender presentation, hairstyle, and approximate age of both people from the reference. Do not alter their faces.',
    '- It must clearly look like the same two people from the reference photo, in a new scene.',
    '- The two people should be naturally interacting (holding hands, hugging, looking at each other, smiling, etc.) in a sweet, loving, tasteful manner. No explicit content.',
    '- Refresh outfits and lighting to match the scene, but keep the people\'s natural skin tone and body proportions realistic.',
    '- Final image should be photographic quality, sharp focus on the couple, soft cinematic lighting, vertical 4:5 framing preferred.',
    '',
    `Scene: ${meta.labelEn} (${meta.labelZh})`,
    `Scene description: ${meta.promptHint}`,
  ];

  if (input.customNote) {
    lines.push(`Additional user note: ${input.customNote}`);
  }

  lines.push('', 'Output: a single high-quality image. Keep both people in frame.');
  return lines.join('\n');
}
