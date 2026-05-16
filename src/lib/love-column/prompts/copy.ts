/** Style options for the 520 copywriter. */
export type CopyStyle = 'sincere' | 'literary' | 'playful' | 'cool' | 'cheeky';

export const COPY_STYLES: Array<{ id: CopyStyle; labelZh: string; labelEn: string }> = [
  { id: 'sincere', labelZh: '深情', labelEn: 'Sincere' },
  { id: 'literary', labelZh: '文艺', labelEn: 'Literary' },
  { id: 'playful', labelZh: '俏皮', labelEn: 'Playful' },
  { id: 'cool', labelZh: '耍酷', labelEn: 'Cool' },
  { id: 'cheeky', labelZh: '贱贱的', labelEn: 'Cheeky' },
];

const STYLE_HINT: Record<CopyStyle, string> = {
  sincere:
    '深情、真挚、温柔。用心写出最动人的感情，避免华而不实，注重细节与回忆，让对方感受到诚意。',
  literary:
    '文艺、富有诗意。运用比喻、意象、引用古诗词或经典文学，节奏舒缓而克制，画面感强。',
  playful:
    '俏皮可爱，带轻微撒娇。可以使用网络流行语和小调侃，整体活泼、阳光，像是日常对话。',
  cool: '酷炫不羁，淡淡的疏离感。用克制的字句表达深情，有点像电影台词，节奏短促有力。',
  cheeky:
    '贱贱的、毒舌、互怼风格。表面调侃打趣，实则深爱，要让人笑着看到糖。注意不要冒犯，是亲昵的玩笑。',
};

export function buildCopySystemPrompt(style: CopyStyle): string {
  const base = [
    '你是「520 浪漫文案」专属创作助手，专长是为情侣、伴侣、暗恋对象写真挚动人的中文情话。',
    '请严格遵循下列规则：',
    '1. 输出纯文本，不要包含 Markdown、列表、表情符号外的特殊字符（💕 等小爱心 emoji 可以适度使用）。',
    '2. 总字数控制在 80-180 字之间（含标点），宁可少一点也必须语义完整。',
    '3. 必须以完整句子结尾，结尾必须落在 。！？.!? 等收束性标点上，绝对不能停在逗号、顿号、半句话或省略号上。',
    '4. 写完后请在心里默念一遍——如果最后一句听起来像没说完，就必须重写或自行收住。',
    '5. 保持温暖正向、避免低俗、不涉及敏感话题。',
    '6. 如果用户提供关键词或回忆细节，必须自然融入文案。',
  ];
  if (style === 'literary') {
    base.push('7. 请以现代诗的形式创作，注意分行与节奏感，意象优美，不要写成散文。最后一行也必须是完整意象，不要悬而未决。');
  } else {
    base.push('7. 不要给出多段方案或分隔线，直接输出一段连贯文案。');
  }
  return base.join('\n');
}

export function buildCopyUserPrompt(input: {
  keyword: string;
  style: CopyStyle;
  scenario?: string;
}): string {
  const styleLabel = COPY_STYLES.find((s) => s.id === input.style)?.labelZh ?? input.style;
  const lines = [
    `请以「${styleLabel}」的风格，为下面的关键字 / 主题创作 520 浪漫文案：`,
    `关键字 / 主题：${input.keyword}`,
    `风格说明：${STYLE_HINT[input.style]}`,
  ];
  if (input.scenario) {
    lines.push(`使用场景或补充信息：${input.scenario}`);
  }
  if (input.style === 'literary') {
    lines.push('请直接输出一首现代诗，控制在 80-180 字之间，最后一行必须是完整收束的意象。');
  } else {
    lines.push('请直接输出文案正文，控制在 80-180 字之间，必须以完整句子（句号/感叹号/问号）收尾。');
  }
  return lines.join('\n');
}
