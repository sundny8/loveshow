/**
 * LoveShow 证件照规格库。
 *
 * 所有尺寸以像素（300 DPI）为准。bgColor 为默认背景色（hex，不含透明通道）。
 * 生产中用户可在工作台自由覆盖。
 */

export interface PhotoSpec {
  id: string;
  label: string;
  width: number;   // px
  height: number;  // px
  dpi: number;
  bgColor: string; // hex, eg #438EDB
  suitHint: 'male' | 'female' | 'student' | 'none';
  description: string;
}

export const PHOTO_SPECS: PhotoSpec[] = [
  {
    id: 'one_inch',
    label: '一寸照',
    width: 295,
    height: 413,
    dpi: 300,
    bgColor: '#FFFFFF',
    suitHint: 'male',
    description: '身份证 / 普通登记照，白底免冠。',
  },
  {
    id: 'two_inch',
    label: '二寸照',
    width: 413,
    height: 579,
    dpi: 300,
    bgColor: '#438EDB',
    suitHint: 'male',
    description: '毕业证 / 简历常用，蓝底商务正装。',
  },
  {
    id: 'passport',
    label: '护照照',
    width: 413,
    height: 531,
    dpi: 300,
    bgColor: '#FFFFFF',
    suitHint: 'male',
    description: '中国护照标准：白底、正面免冠、双耳可见。',
  },
  {
    id: 'visa',
    label: '签证照',
    width: 413,
    height: 531,
    dpi: 300,
    bgColor: '#FFFFFF',
    suitHint: 'male',
    description: '美、加、申根等通用 2x2 英寸白底签证照。',
  },
  {
    id: 'resume',
    label: '简历照',
    width: 413,
    height: 579,
    dpi: 300,
    bgColor: '#F2F2F2',
    suitHint: 'female',
    description: '灰/米底商务简历照，微笑、自然光。',
  },
  {
    id: 'student',
    label: '学生证',
    width: 295,
    height: 413,
    dpi: 300,
    bgColor: '#DC2626',
    suitHint: 'student',
    description: '红底校服风，适合学籍 / 学生证补办。',
  },
  {
    id: 'driver',
    label: '驾照',
    width: 260,
    height: 378,
    dpi: 300,
    bgColor: '#FFFFFF',
    suitHint: 'none',
    description: '机动车驾驶证白底人像照。',
  },
  {
    id: 'free',
    label: '自由创作',
    width: 600,
    height: 800,
    dpi: 300,
    bgColor: '#8B5CF6',
    suitHint: 'none',
    description: '创意肖像，用户自定义背景与风格。',
  },
];

export function getSpec(id: string | undefined | null): PhotoSpec {
  return PHOTO_SPECS.find((s) => s.id === id) ?? PHOTO_SPECS[1]; // default 二寸
}

export const COST_PER_PHOTO = 10;
