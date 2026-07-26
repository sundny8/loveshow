import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Music, Heart, FileText, Camera } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo';
import { JsonLd, faqPageLd, howToLd } from '@/components/seo/json-ld';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const canonical = absoluteUrl(`/${locale}/ai-love-song`);

  return {
    title: isZh
      ? 'AI 情歌生成器 · 把你们的故事写成一首歌 | LoveShow 520'
      : 'AI Love Song Generator · Turn Your Story Into a Real Song',
    description: isZh
      ? '输入你们的故事，AI 生成完整的专属情歌：作词、作曲、演唱一步到位。纪念日、520、求婚、婚礼开场都适用。注册免费送积分，在线试听。'
      : 'Type your story and get a complete, personalised love song — lyrics, melody and vocals in one click. Perfect for anniversaries, 520 day, proposals and weddings. Free credits on sign-up, listen online.',
    alternates: {
      canonical,
      languages: {
        zh: absoluteUrl('/zh/ai-love-song'),
        en: absoluteUrl('/en/ai-love-song'),
        'x-default': absoluteUrl('/en/ai-love-song'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: isZh ? 'AI 情歌生成器 · LoveShow 520' : 'AI Love Song Generator · LoveShow 520',
      description: isZh
        ? '把你们的故事，唱成一首只属于你们的歌。'
        : 'Your story, sung back to you as a real song.',
    },
  };
}

const HOWTO_EN = [
  { name: 'Tell your story', text: 'Write a few lines: names, how you met, the moment you want the song to capture.' },
  { name: 'Pick a style', text: 'Pop ballad, acoustic, R&B, Chinese-style — choose the genre and mood.' },
  { name: 'Generate the song', text: 'The AI writes lyrics from your story, composes the melody and sings it — a complete track in minutes.' },
  { name: 'Share the moment', text: 'Play it at your anniversary dinner, attach it to a 520 message, or use it as your proposal soundtrack.' },
];

const HOWTO_ZH = [
  { name: '讲出你们的故事', text: '写几句话：名字、怎么认识的、想被写进歌里的瞬间。' },
  { name: '选择曲风', text: '流行抒情、民谣吉他、R&B、中国风——挑一个符合你们气质的风格。' },
  { name: '生成歌曲', text: 'AI 根据故事作词、作曲并演唱，几分钟得到一首完整的歌。' },
  { name: '分享这一刻', text: '在纪念日晚餐播放、随 520 消息发送，或作为求婚 BGM。' },
];

const FAQ_EN = [
  {
    q: 'Does the AI write both lyrics and music?',
    a: 'Yes. From your story it writes original lyrics, composes the melody and produces sung vocals — you get a finished, playable track, not just a lyric sheet.',
  },
  {
    q: 'Can the song mention our names and story?',
    a: 'That is the whole point: names, places, inside jokes and dates you provide are woven into the lyrics, so the song is verifiably about you two.',
  },
  {
    q: 'What genres are supported?',
    a: 'Pop ballads, acoustic/folk, R&B, electronic and Chinese-style arrangements, in both English and Chinese.',
  },
  {
    q: 'How long does it take and how much does it cost?',
    a: 'A complete song typically renders in a few minutes. New accounts receive free credits on sign-up — enough to try a song without paying.',
  },
  {
    q: 'Can I use the song at my wedding or proposal?',
    a: 'Yes, personal use at weddings, proposals, anniversaries and social posts is exactly what it is made for.',
  },
];

const FAQ_ZH = [
  {
    q: 'AI 会同时作词和作曲吗？',
    a: '会。AI 根据你的故事写出原创歌词、编好旋律并完成演唱——你得到的是一首可直接播放的完整歌曲，而不只是一份歌词。',
  },
  {
    q: '歌里能出现我们的名字和故事吗？',
    a: '这正是它的意义：你提供的名字、地点、专属梗和纪念日会被写进歌词，让这首歌"确凿地"属于你们。',
  },
  {
    q: '支持哪些曲风？',
    a: '流行抒情、民谣、R&B、电子与中国风等，中英文演唱均支持。',
  },
  {
    q: '要等多久？贵吗？',
    a: '一首完整歌曲通常几分钟内生成。注册即送积分，足够免费体验一首歌。',
  },
  {
    q: '可以用在婚礼或求婚上吗？',
    a: '当然可以——婚礼、求婚、纪念日、朋友圈分享等个人用途正是它的设计初衷。',
  },
];

export default async function AiLoveSongPage({ params }: Props) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  const faq = isZh ? FAQ_ZH : FAQ_EN;
  const steps = isZh ? HOWTO_ZH : HOWTO_EN;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-rose-50/40 via-white to-pink-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <article className="container mx-auto px-4 py-16 max-w-3xl">
          <header className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-rose-600 dark:text-rose-300 uppercase mb-3">
              <Music className="h-3 w-3" />
              {isZh ? 'AI 情歌' : 'AI Love Song'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              {isZh ? 'AI 情歌生成器：把你们的故事唱出来' : 'AI Love Song Generator: Your Story, Sung'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isZh
                ? '不会乐器、不会写歌也没关系——输入你们的故事，LoveShow 520 的 AI 作词、作曲、演唱一步到位，几分钟得到一首只属于你们的歌。'
                : "No instrument, no songwriting skills needed — type your story and LoveShow 520's AI writes the lyrics, composes the melody and sings it. A song that exists for exactly two people."}
            </p>
          </header>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:mt-12 prose-h2:mb-4">
            {/* Citable fact block for AI engines */}
            <p>
              {isZh ? (
                <>
                  <strong>LoveShow 520 的 AI 情歌生成器</strong>把一段文字故事变成完整歌曲：原创歌词 + 旋律编曲 + AI 演唱，支持流行、民谣、R&B、中国风等曲风与中英双语，适用于 520、纪念日、求婚与婚礼，注册即送免费积分。
                </>
              ) : (
                <>
                  <strong>The LoveShow 520 AI love song generator</strong> turns a written story into a finished song: original lyrics, composed melody and AI vocals, across pop, folk, R&B and Chinese-style genres in English or Chinese — made for 520 day, anniversaries, proposals and weddings. Free credits on sign-up.
                </>
              )}
            </p>

            <h2>{isZh ? '如何使用（4 步）' : 'How It Works (4 Steps)'}</h2>
            <ol>
              {steps.map((s, i) => (
                <li key={i}>
                  <strong>{s.name}</strong> — {s.text}
                </li>
              ))}
            </ol>

            <h2>{isZh ? '这首歌可以出现在……' : 'Where This Song Belongs'}</h2>
            <ul>
              <li>{isZh ? '520 表白 — 比一句"我爱你"更有分量的，是一首关于你们的歌' : '520 day — heavier than the words &ldquo;I love you&rdquo;: a song about the two of you'}</li>
              <li>{isZh ? '求婚现场 — 前奏响起的那一刻，故事自己会说话' : 'Proposals — when the intro plays, the story tells itself'}</li>
              <li>{isZh ? '婚礼 & 周年纪念 — 你们的专属 BGM' : 'Weddings & anniversaries — a soundtrack that is legally impossible to copy'}</li>
              <li>{isZh ? '异地恋 — 想念的时候，循环播放' : 'Long-distance — press repeat when missing hits hard'}</li>
            </ul>

            <h2>{isZh ? '和写真、情书组成完整礼物' : 'Complete the Gift'}</h2>
            <p>
              {isZh
                ? '一首歌 + 一组情侣写真 + 一封 AI 情书 = 一份完整且无法被复制的 520 礼物。'
                : 'One song + a set of couple portraits + an AI love letter = a complete 520 gift no store can sell.'}
            </p>

            <div className="not-prose grid sm:grid-cols-3 gap-3 my-6">
              <CrossLink href="/ai-love-letter" icon={FileText} label={isZh ? 'AI 情书生成' : 'AI Love Letter'} />
              <CrossLink href="/ai-couple-portrait" icon={Camera} label={isZh ? 'AI 情侣写真' : 'AI Couple Portrait'} />
              <CrossLink href="/520-meaning" icon={Heart} label={isZh ? '520 是什么意思' : '520 Meaning'} />
            </div>

            <div className="not-prose flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/music">
                <Button className="btn-gradient bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 w-full sm:w-auto">
                  {isZh ? '免费生成我们的歌' : 'Create Our Song Free'}
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  {isZh ? '返回首页' : 'Back to home'}
                </Button>
              </Link>
            </div>

            <h2>{isZh ? '常见问题' : 'Frequently Asked Questions'}</h2>
            <div className="space-y-6 mt-6">
              {faq.map((item, i) => (
                <div key={i} className="border-l-4 border-rose-300 dark:border-rose-500/40 pl-4">
                  <h3 className="font-semibold text-base mb-2 text-slate-800 dark:text-slate-100">{item.q}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Footer />

      <JsonLd data={faqPageLd(faq)} />
      <JsonLd
        data={howToLd({
          name: isZh ? '如何用 AI 生成专属情歌' : 'How to Generate a Personalised Love Song with AI',
          steps,
        })}
      />
    </div>
  );
}

function CrossLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-white dark:bg-slate-900 p-4 hover:border-rose-300 dark:hover:border-rose-400 hover:shadow-md transition-all flex items-center gap-3"
    >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/20 dark:to-pink-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-rose-600 dark:text-rose-300" />
      </div>
      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
        {label}
      </span>
    </Link>
  );
}
