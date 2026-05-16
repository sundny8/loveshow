/** 每次 AI 音乐生成消耗积分 */
export const COST_PER_MUSIC = 20;

/** Suno API 可用模型 */
export const SUNO_MODELS = [
  { value: 'V4_5ALL', label: 'V4·5 All — 更好歌曲结构' },
  { value: 'V4_5', label: 'V4·5 — 智能提示词理解' },
  { value: 'V4_5PLUS', label: 'V4·5 Plus — 更丰富音色' },
  { value: 'V5', label: 'V5 — 最新模型' },
] as const;

export type SunoModel = (typeof SUNO_MODELS)[number]['value'];

/** 常用曲风预设 */
export const MUSIC_STYLES = [
  '流行', '摇滚', '电子', '说唱', 'R&B',
  '爵士', '民谣', '古典', '金属', '乡村',
  '舞曲', '拉丁', '朋克', '布鲁斯', '雷鬼',
] as const;

/** 曲风中→英映射（用于 Suno prompt） */
export const STYLE_EN_MAP: Record<string, string> = {
  '流行': 'pop',
  '摇滚': 'rock',
  '电子': 'electronic',
  '说唱': 'rap/hip-hop',
  'R&B': 'R&B',
  '爵士': 'jazz',
  '民谣': 'folk',
  '古典': 'classical',
  '金属': 'metal',
  '乡村': 'country',
  '舞曲': 'dance',
  '拉丁': 'Latin',
  '朋克': 'punk',
  '布鲁斯': 'blues',
  '雷鬼': 'reggae',
};

/** 情感类型 */
export const MOOD_TYPES = [
  '欢快', '浪漫', '平静', '悲伤',
  '激昂', '梦幻', '温暖', '神秘',
] as const;

export type MoodType = (typeof MOOD_TYPES)[number];

/** 情感中→英映射（用于 Suno prompt） */
export const MOOD_EN_MAP: Record<string, string> = {
  '欢快': 'cheerful/upbeat',
  '浪漫': 'romantic',
  '平静': 'calm/peaceful',
  '悲伤': 'sad/melancholic',
  '激昂': 'epic/passionate',
  '梦幻': 'dreamy/ethereal',
  '温暖': 'warm',
  '神秘': 'mysterious',
};

/** 人声选择 */
export const VOCAL_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'm', label: '男声' },
  { value: 'f', label: '女声' },
  { value: 'duet', label: '男女对唱' },
  { value: 'chorus', label: '合唱' },
] as const;

export type VocalOption = (typeof VOCAL_OPTIONS)[number]['value'];

/** 歌曲时长 */
export const DURATION_OPTIONS = [
  { value: '', label: '不限' },
  { value: '30s', label: '30 秒' },
  { value: '1m', label: '1 分钟' },
  { value: '2m', label: '2 分钟' },
  { value: '4m', label: '4 分钟' },
] as const;

export type DurationOption = (typeof DURATION_OPTIONS)[number]['value'];
