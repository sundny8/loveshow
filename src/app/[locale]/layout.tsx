import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
