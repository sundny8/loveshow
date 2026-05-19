/**
 * Central SEO config for LoveShow.
 *
 * Keep all SEO-critical strings (site URL, brand name, core keywords, OG defaults)
 * in one place so they stay consistent across layout, sitemap, robots, JSON-LD
 * and individual pages.
 *
 * Keyword strategy: anchor everything around the core search intent
 * "520 meaning" / "520 我爱你" / "520 是什么意思" — this is the highest-volume
 * romantic-numbers query in Chinese internet culture and a strong long-tail
 * gateway in English/Asian-diaspora search. The brand "LoveShow 520" pairs
 * naturally with that intent.
 */

/** Public site URL used for canonical, OG and structured data. */
export function getSiteUrl(): string {
  // Production should set NEXT_PUBLIC_SITE_URL=https://loveshow.life.
  // Falls back to NEXT_PUBLIC_APP_URL (used by auth) or the production host.
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'https://loveshow.life')
  ).replace(/\/$/, '');
}

export const BRAND = {
  name: 'LoveShow',
  legalName: 'LoveShow',
  tagline: {
    zh: '用创意留住爱 · 520 我爱你 AI 创作平台',
    en: '520 Meaning · I Love You in Numbers · AI Love Studio',
  },
} as const;

/**
 * Locale-aware default metadata strings.
 *
 * "520" 在中文网络中是 "我爱你" 的谐音（5=wǔ→wǒ, 2=èr→ài, 0=líng→nǐ），
 * 5 月 20 日（5/20）也因此被称为"网络情人节 / 表白日"。
 * 这些核心语义贯穿在 title/description/keywords 中，并对 EN 用户做 transliteration
 * + meaning 解释，配合 Hreflang 把流量导到对应语言版本。
 */
export const DEFAULT_SEO = {
  zh: {
    title: 'LoveShow 520 · AI 图片编辑器 / AI 图像生成 · 520 我爱你 AI 创作',
    description:
      'LoveShow 520 是一款基于参考图的 AI 图片编辑器（AI image editor），围绕「520 = 我爱你」打造：上传一张照片，10 秒生成证件照、情侣写真、情侣大头贴、艺术肖像，再加上 520 文案、情感分析、恋爱回忆录与情侣专属音乐。注册免费送积分，无需信用卡即可在线试用。',
    keywords: [
      '520',
      '520 我爱你',
      '520 是什么意思',
      '520 meaning',
      '520 含义',
      '520 表白',
      '520 网络情人节',
      '5月20日',
      '5.20 表白日',
      '我爱你 数字',
      'AI 情书生成',
      'AI 文案生成',
      '情侣 AI 写真',
      '情侣大头贴',
      '情感分析 AI',
      '恋爱回忆录',
      '情侣音乐生成',
      'LoveShow',
      'LoveShow 520',
      'AI 浪漫创作',
      'AI 图片编辑器',
      'AI 图像编辑',
      'AI 图像生成',
      'AI 照片生成',
      'AI 在线图像编辑',
      '在线 AI 图像编辑器',
      'AI 证件照生成',
      'AI 肖像照',
      '免费 AI 图像编辑',
      'AI 图片处理',
      'ai image editor',
      'ai image generator',
      'free ai image editor online',
    ],
    ogTitle: 'LoveShow 520 · AI 图片编辑器 + 520 我爱你 浪漫创作',
    ogDescription:
      '上传一张照片，AI 帮你完成证件照、艺术肖像、情侣写真，再加上 520 文案、专属音乐与恋爱回忆录。注册免费送积分。',
  },
  en: {
    title: 'LoveShow 520 · AI Image Editor & AI Love Studio · Free to Try',
    description:
      'LoveShow 520 is a reference-photo AI image editor that turns one selfie into ID photos, couple portraits, couple avatars and 10 portrait styles — plus AI-written love copy, romance analysis, love memoirs and personalised couple songs around the meaning of 520 ("I love you" in Chinese). Sign up gets free credits, no credit card needed to try.',
    keywords: [
      '520 meaning',
      '520 i love you',
      'what does 520 mean',
      '520 in chinese',
      '520 may 20',
      'china internet valentine',
      'i love you in numbers',
      'AI love letter',
      'AI love quote generator',
      'AI couple photo',
      'AI couple avatar',
      'AI relationship analysis',
      'AI love song',
      'love memoir AI',
      'LoveShow',
      'LoveShow 520',
      'ai image editor',
      'ai image editor online',
      'ai image generator',
      'ai image generator free',
      'ai image generator free online',
      'free ai image editor',
      'free online ai image editor',
      'ai photo editor',
      'ai photo editor online',
      'online ai image editor',
      'ai portrait generator',
      'ai id photo',
      'ai couple photo editor',
      'image to image ai',
      'photo to photo ai editor',
    ],
    ogTitle: 'LoveShow 520 · AI Image Editor + AI Love Studio',
    ogDescription:
      'Free-to-try AI image editor for portraits, ID photos and couple shots — plus AI-written love copy, songs and memoirs around the meaning of 520.',
  },
} as const;

export type SeoLocale = keyof typeof DEFAULT_SEO;

/** Resolve a locale-aware default SEO bundle. */
export function getDefaultSeo(locale: string): (typeof DEFAULT_SEO)[SeoLocale] {
  return locale === 'zh' ? DEFAULT_SEO.zh : DEFAULT_SEO.en;
}

/** Build canonical absolute URL for a path under the current site. */
export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return base + '/';
  return base + (path.startsWith('/') ? path : `/${path}`);
}

/** All locales we publish content for (must match next-intl routing). */
export const LOCALES = ['zh', 'en'] as const;
