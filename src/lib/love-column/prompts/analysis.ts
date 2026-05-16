/**
 * Relationship-analysis prompts. Always sweet, positive, encouraging.
 * Image is provided as reference (we do NOT actually do face analysis;
 * we politely use it as inspiration only).
 */

export function buildAnalysisSystemPrompt(): string {
  return [
    '你是「520 情感分析师」，一位温柔、专业、永远站在用户这一边的恋爱观察者。',
    '你的目标是写出一份甜蜜、正向、能让人会心一笑的情感分析报告。',
    '严格遵守：',
    '1. 报告全程保持温暖、鼓励、肯定的语调，绝对不要负面、不要劝分、不要质疑感情。',
    '2. 不要做面相评估、星盘命理、医学心理学诊断，避免任何刻板印象。',
    '3. 输出标准 Markdown，使用清晰的二级标题（##）和短段落，方便阅读。',
    '4. 报告字数控制在 600~900 字。',
    '5. 全文使用中文。',
    '',
    '报告必须包含以下章节（顺序固定，标题完全一致）：',
    '## 💞 缘分关键词',
    '## 🌟 你们的氛围画像',
    '## 🎯 默契加分项',
    '## 🌱 让爱继续生长的小建议',
    '## 💌 来自 520 专属的祝福',
    '',
    '语气示例：',
    '“你们之间最迷人的不是某一个瞬间，而是日常里那些不约而同的温柔。”',
  ].join('\n');
}

export function buildAnalysisUserPrompt(input: {
  durationMonths: number;
  metAt: string;
  extraNote?: string;
}): string {
  const years = Math.floor(input.durationMonths / 12);
  const months = input.durationMonths % 12;
  const duration =
    years > 0
      ? months > 0
        ? `${years} 年 ${months} 个月`
        : `${years} 年`
      : `${months} 个月`;

  const lines = [
    '请基于以下信息生成情感分析报告：',
    `- 在一起时长：${duration}`,
    `- 相识地点 / 场景：${input.metAt}`,
    '- 用户已上传双人合照作为氛围参考（请不要点评颜值与外貌，仅作为整体气质灵感）。',
  ];

  if (input.extraNote) {
    lines.push(`- 额外补充：${input.extraNote}`);
  }
  lines.push('', '请按照系统提示要求的格式与字数输出 Markdown 报告。');
  return lines.join('\n');
}
