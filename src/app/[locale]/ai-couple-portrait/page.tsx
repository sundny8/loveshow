import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Camera, Heart, Music, FileText } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo';
import { JsonLd, faqPageLd, howToLd } from '@/components/seo/json-ld';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const canonical = absoluteUrl(`/${locale}/ai-couple-portrait`);

  return {
    title: isZh
      ? 'AI 情侣写真生成器 · 一张合照生成多场景写真 | LoveShow 520'
      : 'AI Couple Portrait Generator · Turn One Photo Into Studio Portraits',
    description: isZh
      ? '上传一张合照，AI 生成婚纱、旅拍、复古、动漫等多场景情侣写真和情侣大头贴，无需影楼、10 秒出图。注册免费送积分，在线试用。'
      : 'Upload one photo of you two and get AI couple portraits across wedding, travel, vintage and anime scenes — plus matching couple avatars. No studio booking, results in seconds. Free credits on sign-up.',
    alternates: {
      canonical,
      languages: {
        zh: absoluteUrl('/zh/ai-couple-portrait'),
        en: absoluteUrl('/en/ai-couple-portrait'),
        'x-default': absoluteUrl('/en/ai-couple-portrait'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: isZh ? 'AI 情侣写真生成器 · LoveShow 520' : 'AI Couple Portrait Generator · LoveShow 520',
      description: isZh
        ? '一张合照，生成影楼级情侣写真。'
        : 'One photo in, studio-grade couple portraits out.',
    },
  };
}

const HOWTO_EN = [
  { name: 'Upload one photo', text: 'Pick a clear photo of you two — a selfie works. The AI uses it as the identity reference.' },
  { name: 'Choose a scene', text: 'Wedding, beach travel, vintage film, cyberpunk, anime — pick the vibe you want.' },
  { name: 'Generate', text: 'The AI renders studio-grade couple portraits in seconds while keeping both faces recognisable.' },
  { name: 'Download & share', text: 'Save in high resolution, set as couple avatars, or pair with an AI love letter as a 520 gift.' },
];

const HOWTO_ZH = [
  { name: '上传一张合照', text: '选一张清晰的双人照片，自拍即可，AI 以它作为人脸参考。' },
  { name: '选择场景', text: '婚纱、海边旅拍、复古胶片、赛博朋克、动漫风——挑你们喜欢的氛围。' },
  { name: '一键生成', text: 'AI 在几秒内渲染出影楼级写真，同时保持两个人的五官相似度。' },
  { name: '下载与分享', text: '高清保存、设为情侣头像，或搭配 AI 情书组成一份完整的 520 礼物。' },
];

const FAQ_EN = [
  {
    q: 'How does the AI couple portrait generator work?',
    a: 'It is a reference-photo (image-to-image) generator: you upload one photo of you two, choose a scene style, and the AI re-renders you both in that scene while preserving facial identity. No prompt engineering needed.',
  },
  {
    q: 'Will we still look like ourselves?',
    a: 'Yes — identity preservation is the core of the pipeline. The clearer and more front-facing your source photo, the closer the resemblance.',
  },
  {
    q: 'Is it free?',
    a: 'New accounts get free credits on sign-up, enough to try couple portraits without paying. No credit card is required.',
  },
  {
    q: 'What styles are available?',
    a: 'Wedding dress, travel/beach, vintage film, formal studio, anime and more — plus matching couple avatars (couple profile pictures) generated from the same photo.',
  },
  {
    q: 'Are my photos safe?',
    a: 'Uploads are used only to generate your results and are stored under your private account. Public display happens only if you explicitly share to the gallery.',
  },
];

const FAQ_ZH = [
  {
    q: 'AI 情侣写真是怎么生成的？',
    a: '这是基于参考图（图生图）的生成方式：上传一张双人合照，选择场景风格，AI 会在保持两人五官特征的前提下，把你们重新渲染到新场景中，无需写提示词。',
  },
  {
    q: '生成后还像我们本人吗？',
    a: '像——人脸相似度是整条管线的核心。原照片越清晰、越正脸，相似度越高。',
  },
  {
    q: '免费吗？',
    a: '注册即送积分，足够免费体验情侣写真，无需绑定信用卡。',
  },
  {
    q: '有哪些风格可选？',
    a: '婚纱、旅拍海边、复古胶片、正装影棚、动漫等多种场景，还能用同一张照片生成配套的情侣大头贴。',
  },
  {
    q: '照片安全吗？',
    a: '上传的照片仅用于生成你的作品，存储在你的私人账户下；只有你主动分享到画廊时才会公开展示。',
  },
];

export default async function AiCouplePortraitPage({ params }: Props) {
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
              <Camera className="h-3 w-3" />
              {isZh ? 'AI 情侣写真' : 'AI Couple Portrait'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              {isZh ? 'AI 情侣写真：一张合照，生成影楼级大片' : 'AI Couple Portraits: One Photo, a Whole Studio Shoot'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isZh
                ? '不用约影楼、不用化妆修图——上传一张合照，LoveShow 520 的 AI 在 10 秒内生成婚纱、旅拍、复古、动漫等多场景情侣写真。'
                : 'No studio booking, no makeup, no retouching — upload one photo and LoveShow 520 renders wedding, travel, vintage and anime couple portraits in seconds.'}
            </p>
          </header>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:mt-12 prose-h2:mb-4">
            {/* Citable fact block for AI engines */}
            <p>
              {isZh ? (
                <>
                  <strong>LoveShow 520 的 AI 情侣写真生成器</strong>基于参考图生成技术：上传一张情侣合照，即可在保持人脸相似度的前提下生成婚纱照、旅拍、复古胶片、动漫风等多场景写真与配套情侣大头贴，注册即送免费积分。
                </>
              ) : (
                <>
                  <strong>The LoveShow 520 AI couple portrait generator</strong> uses reference-photo (image-to-image) generation: upload one photo of you two and it produces wedding, travel, vintage-film and anime-style couple portraits — plus matching couple avatars — while keeping both faces recognisable. Free credits on sign-up.
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

            <h2>{isZh ? '适合的场景' : 'Perfect For'}</h2>
            <ul>
              <li>{isZh ? '520 / 情人节 / 纪念日礼物 — 打印出来就是一份惊喜' : '520 day, Valentine\u2019s or anniversary gifts — print it and it becomes a real present'}</li>
              <li>{isZh ? '情侣头像 — 同一张照片生成配对大头贴' : 'Couple profile pictures — matching avatars from the same shot'}</li>
              <li>{isZh ? '异地恋 — 没法一起拍照，也能"同框"' : 'Long-distance couples — be in the same frame even when you can\u2019t be'}</li>
              <li>{isZh ? '婚礼请柬 & 朋友圈官宣 — 婚纱场景一键出图' : 'Wedding invites & announcements — wedding-dress scenes in one click'}</li>
            </ul>

            <h2>{isZh ? '组成完整的 520 礼物' : 'Build the Full 520 Gift'}</h2>
            <p>
              {isZh
                ? '写真配上一段 AI 情书、再加一首专属情歌，就是一份没人撞款的 520 礼物。'
                : 'Pair the portraits with an AI love letter and a personalised love song — a 520 gift nobody else can copy.'}
            </p>

            <div className="not-prose grid sm:grid-cols-3 gap-3 my-6">
              <CrossLink href="/ai-love-letter" icon={FileText} label={isZh ? 'AI 情书生成' : 'AI Love Letter'} />
              <CrossLink href="/ai-love-song" icon={Music} label={isZh ? 'AI 情歌生成' : 'AI Love Song'} />
              <CrossLink href="/520-meaning" icon={Heart} label={isZh ? '520 是什么意思' : '520 Meaning'} />
            </div>

            <div className="not-prose flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/blog">
                <Button className="btn-gradient bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 w-full sm:w-auto">
                  {isZh ? '免费生成情侣写真' : 'Create Our Couple Portrait Free'}
                </Button>
              </Link>
              <Link href="/portrait">
                <Button variant="outline" className="w-full sm:w-auto">
                  {isZh ? '试试个人艺术肖像' : 'Try solo art portraits'}
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
          name: isZh ? '如何用 AI 生成情侣写真' : 'How to Create an AI Couple Portrait',
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
