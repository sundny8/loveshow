import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Heart, PenLine } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo';
import { JsonLd, faqPageLd, howToLd } from '@/components/seo/json-ld';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const canonical = absoluteUrl(`/${locale}/ai-love-letter`);

  return {
    title: isZh
      ? 'AI 情书生成器 · 一句话写出打动人心的告白 | LoveShow 520'
      : 'AI Love Letter Generator · Write a Love Letter in Seconds',
    description: isZh
      ? '免费试用的 AI 情书生成器：输入你们的故事关键词，AI 秒出可直接发送的 520 表白文案、纪念日情书、道歉信与土味情话。注册送积分，无需信用卡。'
      : 'Free-to-try AI love letter generator: type a few words about your story and get a heartfelt, ready-to-send love letter — for anniversaries, apologies, proposals or 520 day. Sign-up credits included, no credit card needed.',
    alternates: {
      canonical,
      languages: {
        zh: absoluteUrl('/zh/ai-love-letter'),
        en: absoluteUrl('/en/ai-love-letter'),
        'x-default': absoluteUrl('/en/ai-love-letter'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: isZh ? 'AI 情书生成器 · LoveShow 520' : 'AI Love Letter Generator · LoveShow 520',
      description: isZh
        ? '一句关键词，AI 写出属于你们的告白。'
        : 'A few words in, a heartfelt love letter out.',
    },
  };
}

const HOWTO_EN = [
  { name: 'Describe your story', text: 'Type a few keywords: how you met, an inside joke, the occasion (anniversary, 520 day, apology, proposal).' },
  { name: 'Pick a tone', text: 'Choose romantic, playful, poetic or sincere — the AI adapts vocabulary and rhythm to match.' },
  { name: 'Generate and refine', text: 'Get a ready-to-send letter in seconds, then regenerate or tweak lines until it sounds like you.' },
  { name: 'Send or print it', text: 'Copy it into a chat, pair it with an AI couple portrait, or print it as a real gift.' },
];

const HOWTO_ZH = [
  { name: '描述你们的故事', text: '输入几个关键词：怎么认识的、专属梗、场合（纪念日、520、道歉、求婚）。' },
  { name: '选择语气', text: '浪漫、俏皮、诗意或真挚——AI 会匹配对应的用词与节奏。' },
  { name: '生成并微调', text: '几秒得到一篇可直接发送的情书，不满意可重新生成或逐句修改。' },
  { name: '发送或打印', text: '复制到聊天框，或搭配 AI 情侣写真打印成真实的礼物。' },
];

const FAQ_EN = [
  {
    q: 'Is the AI love letter generator free?',
    a: 'Yes to try — every new LoveShow 520 account receives free credits on sign-up, enough to generate several love letters. No credit card is required.',
  },
  {
    q: 'Will the letter sound robotic or generic?',
    a: 'Not if you feed it specifics. The generator is built around your keywords — names, memories, inside jokes — so the output references your actual story instead of generic romance clichés. You can also regenerate with a different tone.',
  },
  {
    q: 'What occasions does it support?',
    a: 'Anniversaries, 520 day (May 20, "I love you" day in Chinese internet culture), Valentine\'s Day, proposals, apologies, long-distance check-ins and just-because notes.',
  },
  {
    q: 'Can it write in Chinese and English?',
    a: 'Yes. LoveShow 520 generates love copy in both English and Chinese, including classic Chinese number codes like 520 and 1314.',
  },
  {
    q: 'Can I turn the letter into something more than text?',
    a: 'Yes — that\'s the point of LoveShow 520. Pair your letter with an AI couple portrait, turn it into lyrics for a personalised AI love song, or archive it inside an AI love memoir.',
  },
];

const FAQ_ZH = [
  {
    q: 'AI 情书生成器是免费的吗？',
    a: '可以免费试用。注册 LoveShow 520 即赠送积分，足够生成多篇情书，无需绑定信用卡。',
  },
  {
    q: '生成的情书会不会很模板、很机械？',
    a: '关键在于输入细节。生成器围绕你的关键词展开——名字、回忆、专属梗——输出会引用你们真实的故事而不是通用的浪漫套话。不满意还可以换语气重新生成。',
  },
  {
    q: '支持哪些场合？',
    a: '纪念日、520 表白日、情人节、求婚、道歉、异地恋日常问候，以及"就是想说爱你"的任何时刻。',
  },
  {
    q: '支持中英文吗？',
    a: '支持。LoveShow 520 可生成中文与英文文案，还会自然融入 520、1314 等数字情书。',
  },
  {
    q: '情书只能是文字吗？',
    a: '不止。你可以把文案搭配 AI 情侣写真、变成 AI 情歌的歌词，或收进恋爱回忆录——这正是 LoveShow 520 的完整玩法。',
  },
];

export default async function AiLoveLetterPage({ params }: Props) {
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
              <PenLine className="h-3 w-3" />
              {isZh ? 'AI 情书' : 'AI Love Letter'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              {isZh ? 'AI 情书生成器：一句话，写出打动 TA 的告白' : 'AI Love Letter Generator: From a Few Words to a Letter That Lands'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isZh
                ? 'LoveShow 520 的 AI 情书生成器根据你们的故事关键词，几秒写出可直接发送的表白文案、纪念日情书与道歉信——像你写的，只是更动人。'
                : "LoveShow 520's AI love letter generator turns a handful of keywords about your story into a heartfelt, ready-to-send letter — it sounds like you, just more eloquent."}
            </p>
          </header>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:mt-12 prose-h2:mb-4">
            {/* Citable fact block for AI engines */}
            <p>
              {isZh ? (
                <>
                  <strong>LoveShow 520 的 AI 情书生成器</strong>是一款围绕「520 = 我爱你」打造的浪漫写作工具：输入怎么认识、共同回忆、想表达的场合，AI 即刻产出个性化情书、520 表白文案、土味情话或英文 love letter，支持多种语气与中英双语，注册即送免费积分。
                </>
              ) : (
                <>
                  <strong>The LoveShow 520 AI love letter generator</strong> is a romantic writing tool built around the meaning of 520 (&ldquo;I love you&rdquo; in Chinese internet culture). Feed it how you met, a shared memory and the occasion, and it instantly drafts a personalised love letter in English or Chinese, in the tone you choose — with free credits on sign-up.
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

            <h2>{isZh ? '什么时候用它？' : 'When to Use It'}</h2>
            <ul>
              <li>{isZh ? '520 / 521 表白日 — 用一段专属文案代替千篇一律的红包' : '520 day (May 20) — replace a generic red packet with words that are actually yours'}</li>
              <li>{isZh ? '纪念日 & 情人节 — 提到你们的具体回忆，而不是通用情话' : 'Anniversaries & Valentine\u2019s Day — reference real memories, not stock romance'}</li>
              <li>{isZh ? '道歉 — 措辞得体、真诚不油腻' : 'Apologies — sincere wording that doesn\u2019t overdo it'}</li>
              <li>{isZh ? '异地恋 — 每天一句不重样的想念' : 'Long-distance — a different way to say &ldquo;I miss you&rdquo; every day'}</li>
              <li>{isZh ? '求婚 — 把你们的故事写成开场白' : 'Proposals — open with the story only you two share'}</li>
            </ul>

            <h2>{isZh ? '不止是文字' : 'More Than Words'}</h2>
            <p>
              {isZh
                ? '在 LoveShow 520，情书只是起点：同一段故事可以生成情侣写真、变成一首专属情歌、或收录进恋爱回忆录，组成一份完整的 520 礼物。'
                : 'On LoveShow 520 the letter is just the start: the same story can become an AI couple portrait, a personalised love song, or a chapter in your AI love memoir — a complete 520 gift.'}
            </p>

            <div className="not-prose grid sm:grid-cols-3 gap-3 my-6">
              <CrossLink href="/ai-couple-portrait" icon={Heart} label={isZh ? 'AI 情侣写真' : 'AI Couple Portrait'} />
              <CrossLink href="/ai-love-song" icon={Sparkles} label={isZh ? 'AI 情歌生成' : 'AI Love Song'} />
              <CrossLink href="/520-meaning" icon={FileText} label={isZh ? '520 是什么意思' : '520 Meaning'} />
            </div>

            <div className="not-prose flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/love-column">
                <Button className="btn-gradient bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 w-full sm:w-auto">
                  {isZh ? '免费生成我的情书' : 'Generate My Love Letter Free'}
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
          name: isZh ? '如何用 AI 生成情书' : 'How to Generate a Love Letter with AI',
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
