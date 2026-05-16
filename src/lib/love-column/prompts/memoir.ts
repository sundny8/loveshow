/**
 * Love memoir prompts. Generates a heartwarming illustrated story
 * weaving the user's photos, timeline, and chat snippets into a
 * Markdown narrative organized around photo placements.
 */

export interface MemoirPhoto {
  url: string;
  caption?: string;
}

export interface MemoirTimelineItem {
  date: string;
  event: string;
}

export function buildMemoirSystemPrompt(): string {
  return [
    '你是「520 恋爱回忆录」御用编辑兼诗人，擅长把零散的照片、聊天片段和时间线，编织成一篇有温度、有节奏的图文回忆录。',
    '严格遵守：',
    '1. 输出标准 Markdown，全文使用中文。',
    '2. 总字数 800~1200 字之间。',
    '3. 必须出现的章节（按顺序）：# 标题、## 序章、## 时光卷轴、## 心动碎片、## 写在最后的悄悄话。',
    '4. 在「时光卷轴」中按时间顺序串起用户的时间线条目，每条单独成段，配上一两句细腻描述。',
    '5. 在「心动碎片」中从用户提供的聊天记录里挑选最甜的瞬间作为引言（用 Markdown 引用 > 包裹），并附上你的旁白。',
    '6. 用户上传的照片以占位符 [[PHOTO_1]]、[[PHOTO_2]]… 标注，请你把它们均匀穿插在文章合适位置（不要全部堆在开头）。最多使用与提供照片数量相等的占位符。',
    '7. 行文温柔细腻，多用比喻、画面感、五感描写，绝对正向，不要负面情绪。',
    '8. 不要输出本提示中的任何说明文字。',
  ].join('\n');
}

export function buildMemoirUserPrompt(input: {
  photoCount: number;
  timeline: MemoirTimelineItem[];
  chatExcerpt: string;
  title?: string;
  extraNote?: string;
}): string {
  const lines = [
    '请创作一篇 520 恋爱回忆录。素材如下：',
    '',
    `【建议标题】${input.title || '（你来取一个最甜的标题）'}`,
    '',
    '【照片】',
    `用户上传了 ${input.photoCount} 张照片，请使用占位符 ${Array.from(
      { length: input.photoCount },
      (_, i) => `[[PHOTO_${i + 1}]]`
    ).join('、')} 穿插到正文中。`,
    '',
    '【时间线】',
    ...input.timeline.map((item) => `- ${item.date}：${item.event}`),
    '',
    '【聊天记录节选】（请从中挑选 1~3 句最有代表性的甜句作为引文）',
    input.chatExcerpt.trim(),
  ];

  if (input.extraNote) {
    lines.push('', `【额外说明】${input.extraNote}`);
  }

  lines.push('', '请按系统提示的格式与字数要求输出 Markdown。');
  return lines.join('\n');
}
