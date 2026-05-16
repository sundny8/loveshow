import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import { Nunito, Noto_Serif_SC } from 'next/font/google';
import { cn } from '@/lib/utils';

// UI body font: rounded humanist sans for clean interface elements
const cereal = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

// Display / heading font: Noto Serif SC — classical literary warmth,
// evokes the romantic editorial feel of "用创意留住爱".
// Supports full CJK character set with multiple weights.
const serif = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LoveShow · 用创意留住爱 | AI 证件照 / 肖像一键生图',
  description:
    'LoveShow — 用创意留住爱。上传一张自拍，10 秒生成合规证件照；双引擎（OpenAI + Gemini）驱动，未来还将支持商务头像、写真、旅行肖像等场景。',
  openGraph: {
    title: 'LoveShow · 用创意留住爱',
    description:
      '用创意留住爱。AI 证件照首发：支持一寸 / 二寸 / 护照 / 签证等多规格，智能识别 + 双引擎（GPT + Gemini）。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoveShow · 用创意留住爱',
    description:
      '上传一张自拍，AI 自动裁剪、换装、换背景，秒级输出合规证件照。',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={cn('font-sans', cereal.variable, serif.variable)}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
