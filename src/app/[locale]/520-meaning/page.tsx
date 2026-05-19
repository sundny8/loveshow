import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, ImageIcon, Music, FileText, BookHeart } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const canonical = absoluteUrl(`/${locale}/520-meaning`);

  return {
    title: isZh
      ? '520 是什么意思？520 = 我爱你 完整解读 | LoveShow 520'
      : '520 Meaning: What Does 520 Mean? · "I Love You" Decoded',
    description: isZh
      ? '520 在中文网络中代表「我爱你」，因发音相近成为表白密码；5 月 20 日（5/20）也是网络情人节。本文完整解读 520 含义、历史、520 文化与如何用 LoveShow 520 把这三个数字变成专属作品。'
      : '"520" is internet shorthand for "I love you" in Chinese — 五 (wǔ) ≈ 我 (wǒ), 二 (èr) ≈ 爱 (ài), 零 (líng) ≈ 你 (nǐ). May 20 (5/20) became China’s online Valentine’s Day. Read the full meaning, origin and how to turn 520 into a personalised AI gift on LoveShow 520.',
    alternates: {
      canonical,
      languages: {
        zh: absoluteUrl('/zh/520-meaning'),
        en: absoluteUrl('/en/520-meaning'),
        'x-default': absoluteUrl('/en/520-meaning'),
      },
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: isZh
        ? '520 是什么意思？520 = 我爱你 完整解读'
        : '520 Meaning · "I Love You" in Chinese Internet Culture',
      description: isZh
        ? '520 = 我爱你。5/20 网络情人节由来、520 数字情书文化与 AI 创作灵感。'
        : 'What 520 means, why May 20 became online Valentine’s Day, and how to turn the meaning into AI-crafted love.',
    },
    twitter: {
      card: 'summary_large_image',
      title: isZh
        ? '520 是什么意思？520 = 我爱你 完整解读'
        : '520 Meaning · "I Love You" in Chinese Internet Culture',
      description: isZh
        ? '520 = 我爱你。5/20 网络情人节由来与 AI 浪漫创作灵感。'
        : 'What 520 means + how to turn it into AI-crafted love letters, photos and songs.',
    },
  };
}

export default async function FiveTwentyMeaningPage({ params }: Props) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  // FAQPage schema for rich result eligibility on Google.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (isZh ? FAQ_ZH : FAQ_EN).map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  };

  // Article schema gives the page topical authority for the "520 meaning" entity.
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: isZh ? '520 是什么意思？520 = 我爱你 完整解读' : 'What Does 520 Mean? "I Love You" in Numbers',
    inLanguage: isZh ? 'zh-CN' : 'en',
    author: { '@type': 'Organization', name: 'LoveShow 520' },
    publisher: {
      '@type': 'Organization',
      name: 'LoveShow 520',
      logo: { '@type': 'ImageObject', url: absoluteUrl('/suits/female.png') },
    },
    mainEntityOfPage: absoluteUrl(`/${locale}/520-meaning`),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-rose-50/40 via-white to-pink-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <article className="container mx-auto px-4 py-16 max-w-3xl">
          <header className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-rose-600 dark:text-rose-300 uppercase mb-3">
              <Heart className="h-3 w-3 fill-current" />
              {isZh ? '520 文化解读' : '520 Culture'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              {isZh ? '520 是什么意思？520 = 我爱你' : 'What Does 520 Mean? "520" = "I Love You"'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isZh
                ? '一篇文章看懂 520 的来历、谐音逻辑与 5 月 20 日网络情人节文化，并用 LoveShow 520 把它做成只属于你们的礼物。'
                : 'Everything you need to know about 520 — the Chinese internet shorthand for "I love you" — and how to turn it into a personalised AI-crafted gift on LoveShow 520.'}
            </p>
          </header>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:mt-12 prose-h2:mb-4">
            {isZh ? <ContentZh /> : <ContentEn />}

            <h2>{isZh ? '把 520 变成 AI 作品' : 'Turn 520 Into AI-Crafted Love'}</h2>
            <div className="not-prose grid sm:grid-cols-2 gap-3 my-6">
              <FeatureCard
                href="/blog"
                icon={FileText}
                title={isZh ? '520 文案' : '520 Love Letter'}
                desc={isZh ? '一句关键词，AI 写一段属于你们的告白' : 'AI-written love letters anchored on your story'}
              />
              <FeatureCard
                href="/blog"
                icon={ImageIcon}
                title={isZh ? '情侣写真' : 'Couple Portrait'}
                desc={isZh ? '上传合照，生成多场景情侣艺术写真' : 'AI couple portraits across romantic scenes'}
              />
              <FeatureCard
                href="/blog"
                icon={Sparkles}
                title={isZh ? '情感分析' : 'Relationship Insight'}
                desc={isZh ? '关键词 + 时间，AI 分析你们的感情' : 'AI relationship analysis based on your story'}
              />
              <FeatureCard
                href="/blog"
                icon={Music}
                title={isZh ? '情侣音乐' : 'Couple Song'}
                desc={isZh ? '把文案变成一首甜歌，专属于 520' : 'Turn your story into a personalised song'}
              />
              <FeatureCard
                href="/blog"
                icon={BookHeart}
                title={isZh ? '恋爱回忆录' : 'Love Memoir'}
                desc={isZh ? '上传时间线 + 聊天，AI 帮你写回忆录' : 'AI-crafted memoirs from your timeline & chats'}
              />
              <FeatureCard
                href="/portrait"
                icon={ImageIcon}
                title={isZh ? '艺术肖像' : 'Art Portrait'}
                desc={isZh ? '10 种风格的高质感肖像照' : 'Studio-quality AI portraits in 10 styles'}
              />
            </div>

            <div className="not-prose flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/blog">
                <Button className="btn-gradient bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 w-full sm:w-auto">
                  {isZh ? '进入 520 专栏' : 'Open 520 Studio'}
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
              {(isZh ? FAQ_ZH : FAQ_EN).map((item, i) => (
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

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
    </div>
  );
}

function FeatureCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-white dark:bg-slate-900 p-4 hover:border-rose-300 dark:hover:border-rose-400 hover:shadow-md transition-all flex items-start gap-3"
    >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/20 dark:to-pink-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-rose-600 dark:text-rose-300" />
      </div>
      <div>
        <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</div>
      </div>
    </Link>
  );
}

const FAQ_ZH = [
  {
    q: '520 在网络上是什么意思？',
    a: '520 在中文互联网中是「我爱你」的谐音密码：5（wǔ）≈ 我（wǒ）、2（èr）≈ 爱（ài）、0（líng）≈ 你（nǐ）。最早从短信、QQ 时代流行至今，是中文网络最常见的数字情书表达。',
  },
  {
    q: '为什么 5 月 20 日（5/20）会变成网络情人节？',
    a: '因为日期数字 5/20 直接对应「520 = 我爱你」，所以 5 月 20 日被网友称为"网络情人节 / 表白日"。每年这天，社交平台、电商、品牌都会围绕「520 表白」做活动，许多情侣选择在这天告白、纪念或求婚。',
  },
  {
    q: '520 和 521 有什么区别？',
    a: '521 谐音「我爱你」中的「我愿意」，常被解读为对告白的回应。所以网络上常见组合：一方说 520（我爱你），另一方回 521（我也愿意 / 我愿意）。两个数字搭配使用，被称为「520 521 组合」。',
  },
  {
    q: '1314 和 520 是什么关系？',
    a: '1314 谐音「一生一世」，常和 520 组合成 「520 1314」（我爱你一生一世），是中文情书最经典的数字组合之一，常被用作红包金额（5.20 / 13.14 / 520.13 / 1314.52 等）。',
  },
  {
    q: 'LoveShow 520 是做什么的？',
    a: 'LoveShow 520 是围绕「520 = 我爱你」打造的 AI 浪漫创作平台，提供 520 文案生成、情侣写真、情侣大头贴、情感分析、恋爱回忆录、情侣专属音乐等 AI 创作能力，把这三个数字变成可以保存、分享、打印的礼物。',
  },
  {
    q: '我没有恋爱对象也能用 LoveShow 吗？',
    a: '可以。LoveShow 同样支持通用 AI 证件照、艺术肖像、AI 音乐创作等能力，不局限于情侣场景。注册即赠送积分，可以体验全部功能。',
  },
];

const FAQ_EN = [
  {
    q: 'What does 520 mean?',
    a: '"520" is internet shorthand for "I love you" in Chinese. The numbers 5-2-0 sound similar to 我爱你 (wǒ ài nǐ): 5 (wǔ) ≈ 我 (wǒ), 2 (èr) ≈ 爱 (ài), 0 (líng) ≈ 你 (nǐ). It originated in the SMS/QQ era and is now the most popular numeric love code in Chinese-language internet culture.',
  },
  {
    q: 'Why is May 20 (5/20) called online Valentine’s Day?',
    a: 'Because the date 5/20 spells out 520 → "I love you", May 20 has become a de facto online Valentine’s Day in Greater China. Every year couples send red packets, post love letters, propose, or buy gifts on this date, and brands run dedicated 520 campaigns.',
  },
  {
    q: 'What’s the difference between 520 and 521?',
    a: '521 sounds like 我愿意 ("I am willing / I do"), used as a reply to 520. The classic exchange is: one side says 520 (I love you), the other replies 521 (I am willing / I love you too). Together they form the "520 / 521" couple combo.',
  },
  {
    q: 'How are 1314 and 520 related?',
    a: '1314 sounds like 一生一世 ("for one whole life"). The combo "520 1314" means "I love you for one whole life" and is one of the most iconic numeric love phrases in Chinese culture, often sent as red-packet amounts like 5.20, 13.14, 520.13 or 1314.52.',
  },
  {
    q: 'What is LoveShow 520?',
    a: 'LoveShow 520 is an AI love studio built around the meaning of 520. It offers AI love-letter copy, couple portraits, couple avatars, relationship analysis, love memoirs and personalised couple songs — turning the three digits into something you can save, share or print as a gift.',
  },
  {
    q: 'Can I use LoveShow without a partner?',
    a: 'Yes. LoveShow also supports general AI ID photos, artistic portraits and AI music creation. Sign up and you get free credits to try every feature.',
  },
];

function ContentZh() {
  return (
    <>
      <h2>520 = 我爱你 — 三个数字的浪漫密码</h2>
      <p>
        在中文互联网中，<strong>520</strong> 是「<strong>我爱你</strong>」的谐音密码：
      </p>
      <ul>
        <li>
          <strong>5</strong>（wǔ）≈ 我（wǒ）
        </li>
        <li>
          <strong>2</strong>（èr）≈ 爱（ài）
        </li>
        <li>
          <strong>0</strong>（líng）≈ 你（nǐ）
        </li>
      </ul>
      <p>
        这是中文世界最广为人知的数字情书：从短信时代、QQ 时代延续到今天的微信、微博、抖音、小红书。在中文社交平台上，如果你看到一句"520"，几乎可以默认它就是"我爱你"。
      </p>

      <h2>5 月 20 日 — 网络情人节的诞生</h2>
      <p>
        因为日期格式 <strong>5/20</strong> 正好对应"520"，所以 <strong>5 月 20 日</strong>被中文网友自发命名为"<strong>网络情人节</strong>"或"<strong>表白日</strong>"。每年到了这天：
      </p>
      <ul>
        <li>情侣发 5.20 元 / 13.14 元 / 52.0 元 / 520.0 元等"谐音红包"。</li>
        <li>电商围绕 520 做大型促销，被称作"520 大促"。</li>
        <li>许多人选择在这天告白、求婚、注册结婚或纪念恋爱周年。</li>
        <li>品牌、媒体、明星会在 520 当天发情人节相关 campaign。</li>
      </ul>
      <p>520 已经从一个数字谐音演化成了一种文化符号，承载着这个时代中文互联网的浪漫表达方式。</p>

      <h2>520 1314 521 — 数字情书全家桶</h2>
      <p>
        围绕「520」还衍生出一整套数字情书词汇：
      </p>
      <ul>
        <li>
          <strong>521</strong> = 我愿意（用作对 520 的回应，"我也爱你 / 我愿意"）
        </li>
        <li>
          <strong>1314</strong> = 一生一世
        </li>
        <li>
          <strong>520 1314</strong> = 我爱你一生一世（最经典的告白组合）
        </li>
        <li>
          <strong>53719</strong> = 我深情依旧
        </li>
        <li>
          <strong>770</strong> = 亲亲你
        </li>
        <li>
          <strong>880</strong> = 抱抱你
        </li>
      </ul>
      <p>这些数字本身没有任何感情色彩，但因为发音上的巧合，成了情侣之间最简洁、最温柔的表达。</p>

      <h2>520 该怎么过？让 AI 帮你做点不一样的</h2>
      <p>
        每年 520 大家都在发红包、发朋友圈、买礼物——但真正能被对方收藏的"礼物"，往往是有专属感的。<strong>LoveShow 520</strong> 围绕这个意图，做了一整套 AI 创作能力，把"520 = 我爱你"延伸成可以保存、分享、打印的作品：
      </p>
    </>
  );
}

function ContentEn() {
  return (
    <>
      <h2>520 = "I Love You" — The Three-Digit Love Code</h2>
      <p>
        On the Chinese-language internet, <strong>520</strong> is shorthand for the phrase &ldquo;
        <strong>I love you</strong>&rdquo;. It works because the numbers sound very similar to the Chinese
        phrase 我爱你 (<em>wǒ ài nǐ</em>):
      </p>
      <ul>
        <li>
          <strong>5</strong> (wǔ) ≈ 我 (wǒ) — &ldquo;I&rdquo;
        </li>
        <li>
          <strong>2</strong> (èr) ≈ 爱 (ài) — &ldquo;love&rdquo;
        </li>
        <li>
          <strong>0</strong> (líng) ≈ 你 (nǐ) — &ldquo;you&rdquo;
        </li>
      </ul>
      <p>
        It’s the most widely-recognised numeric love code in Chinese culture, dating back to the SMS / QQ era and
        now firmly part of WeChat, Weibo, Douyin and Xiaohongshu. If you see &ldquo;520&rdquo; in a Chinese chat,
        you can almost always read it as &ldquo;I love you.&rdquo;
      </p>

      <h2>May 20 — China’s Online Valentine’s Day</h2>
      <p>
        Because the date <strong>5/20</strong> spells out the same digits, May 20 has become an unofficial online
        Valentine’s Day across Greater China. On this day:
      </p>
      <ul>
        <li>Couples send red packets in symbolic amounts (¥5.20, ¥13.14, ¥52.0, ¥520.0).</li>
        <li>E-commerce platforms run large &ldquo;520 sales&rdquo; campaigns.</li>
        <li>Many people propose, marry, or celebrate anniversaries on this date.</li>
        <li>Celebrities and brands publish 520-themed posts and content.</li>
      </ul>
      <p>
        520 has evolved from a number-sound coincidence into a full cultural symbol of romantic expression in the
        modern Chinese-speaking internet.
      </p>

      <h2>The Number-Love-Letter Family — 520, 521, 1314</h2>
      <p>520 anchors a whole vocabulary of numeric love codes:</p>
      <ul>
        <li>
          <strong>521</strong> = &ldquo;I am willing&rdquo; (the classic reply to 520)
        </li>
        <li>
          <strong>1314</strong> = &ldquo;一生一世&rdquo; / &ldquo;for one whole life&rdquo;
        </li>
        <li>
          <strong>520 1314</strong> = &ldquo;I love you for one whole life&rdquo; — the most iconic combo
        </li>
        <li>
          <strong>53719</strong> = &ldquo;my love is still as deep&rdquo;
        </li>
        <li>
          <strong>770</strong> = a kiss
        </li>
        <li>
          <strong>880</strong> = a hug
        </li>
      </ul>

      <h2>How to Celebrate 520 — Let AI Make It Personal</h2>
      <p>
        Every year on 520, everyone sends red packets and gift cards — but the most memorable gift is the one
        that feels uniquely yours. <strong>LoveShow 520</strong> is an AI love studio built around exactly this
        idea: turn &ldquo;520 = I love you&rdquo; into something you can save, share or print as a real gift.
      </p>
    </>
  );
}
