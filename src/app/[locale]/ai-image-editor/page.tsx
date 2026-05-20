import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Smile, Sparkles, Heart, Camera, ShieldCheck } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const canonical = absoluteUrl(`/${locale}/ai-image-editor`);

  return {
    title: isZh
      ? 'AI 图片编辑器（在线免费试用） · LoveShow 520'
      : 'AI Image Editor — Free to Try Online · LoveShow 520',
    description: isZh
      ? '上传一张照片，用 LoveShow 520 的 AI 图片编辑器在线生成证件照、艺术肖像、情侣写真和情侣大头贴。基于参考图的图像编辑（image-to-image），注册免费送积分，无需信用卡即可试用。请遵守服务条款中的可接受使用政策。'
      : 'Upload a reference photo and use LoveShow 520’s AI image editor online to create ID photos, art portraits, couple shots and couple avatars. Reference-photo (image-to-image) editing — sign up gets free credits, no credit card needed. Please follow the Acceptable Use Policy in our Terms.',
    alternates: {
      canonical,
      languages: {
        zh: absoluteUrl('/zh/ai-image-editor'),
        en: absoluteUrl('/en/ai-image-editor'),
        'x-default': absoluteUrl('/en/ai-image-editor'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: isZh
        ? 'AI 图片编辑器（在线免费试用） · LoveShow 520'
        : 'AI Image Editor — Free to Try Online · LoveShow 520',
      description: isZh
        ? '上传一张照片，AI 在线生成证件照、艺术肖像、情侣写真。注册即送积分，无需信用卡。'
        : 'Upload a reference photo, generate ID photos, art portraits and couple shots online. Sign up gets free credits.',
    },
    twitter: {
      card: 'summary_large_image',
      title: isZh
        ? 'LoveShow 520 · AI 图片编辑器（在线免费试用）'
        : 'LoveShow 520 · AI Image Editor (free to try online)',
      description: isZh
        ? '上传一张照片，AI 在线生成多种风格作品，注册即送积分。'
        : 'Upload one photo, generate multiple styles online. Sign up gets free credits.',
    },
  };
}

export default async function AiImageEditorPage({ params }: Props) {
  const { locale } = await params;
  const isZh = locale === 'zh';

  // Honest, schema.org-friendly structured data describing the product.
  // No exaggerated claims — uses generic free trial framing that matches
  // the actual product (signup credits, paid plans for heavier use).
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LoveShow 520 · AI Image Editor',
    applicationCategory: 'PhotographyApplication',
    operatingSystem: 'Web',
    description: isZh
      ? '基于参考图的 AI 图片编辑器：上传一张照片，生成证件照、艺术肖像、情侣写真与情侣大头贴。注册即送积分免费试用。'
      : 'Reference-photo AI image editor: upload one photo and generate ID photos, art portraits, couple photos and couple avatars. Sign up to try with free credits.',
    url: absoluteUrl(`/${locale}/ai-image-editor`),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description: isZh
        ? '注册即赠送积分用于免费试用；额外用量按积分套餐付费。'
        : 'Sign up to receive free credits for trial; additional usage available via paid credit packs.',
    },
  };

  const faq = isZh ? FAQ_ZH : FAQ_EN;
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-violet-50/40 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <article className="container mx-auto px-4 py-16 max-w-3xl">
          <header className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-violet-600 dark:text-violet-300 uppercase mb-3">
              <Sparkles className="h-3 w-3" />
              {isZh ? 'AI 图片编辑器' : 'AI Image Editor'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-rose-600 bg-clip-text text-transparent mb-4 leading-tight">
              {isZh
                ? 'AI 图片编辑器：上传一张照片，AI 帮你做出多种作品'
                : 'AI Image Editor: Upload One Photo, Get Multiple Stylised Works'}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isZh
                ? 'LoveShow 520 是一款基于参考图的 AI 图片编辑器（image-to-image）：你上传一张清晰自拍或合照，AI 在保持人物身份的基础上生成证件照、艺术肖像、情侣写真和情侣大头贴。注册即送积分，可在线免费试用。'
                : 'LoveShow 520 is a reference-photo AI image editor (image-to-image). Upload a clear selfie or couple photo and the AI generates ID photos, art portraits, couple photos and couple avatars while preserving the person’s identity. Sign up to try online with free credits.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/portrait">
                <Button className="btn-gradient bg-gradient-to-r from-violet-500 to-rose-500 text-white border-0">
                  {isZh ? '免费试用' : 'Try free'}
                </Button>
              </Link>
              <Link href="/workspace">
                <Button variant="outline">
                  {isZh ? '生成证件照' : 'Generate ID photo'}
                </Button>
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {isZh
                ? '注册即赠送积分；超出免费额度按套餐付费。无需信用卡即可试用。'
                : 'Free credits on signup; paid packs available for heavier use. No credit card required to try.'}
            </p>
          </header>

          <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:mt-12 prose-h2:mb-4">
            {isZh ? <ContentZh /> : <ContentEn />}

            <h2>{isZh ? '可以做什么' : 'What you can create'}</h2>
            <div className="not-prose grid sm:grid-cols-2 gap-3 my-6">
              <FeatureCard
                href="/workspace"
                icon={Camera}
                title={isZh ? 'AI 证件照' : 'AI ID Photo'}
                desc={
                  isZh
                    ? '一寸 / 二寸 / 护照 / 签证等规格，自动换装与背景。'
                    : 'One-/two-inch, passport, visa specs with auto outfit and background.'
                }
              />
              <FeatureCard
                href="/portrait"
                icon={ImageIcon}
                title={isZh ? '艺术肖像' : 'Art Portrait'}
                desc={
                  isZh
                    ? '10 种风格：日系、胶片、黑白、暗黑情绪等。'
                    : '10 styles incl. Japanese, film, B&W, dark mood.'
                }
              />
              <FeatureCard
                href="/blog"
                icon={Heart}
                title={isZh ? '情侣写真' : 'Couple Photo'}
                desc={
                  isZh
                    ? '上传合照，生成多场景情侣艺术写真。'
                    : 'Upload a couple photo, get multi-scene art shots.'
                }
              />
              <FeatureCard
                href="/blog"
                icon={Smile}
                title={isZh ? '情侣大头贴' : 'Couple Avatar'}
                desc={
                  isZh
                    ? '可爱风、3D、漫画风等多种大头贴风格。'
                    : 'Cute, 3D, comic-style couple avatars.'
                }
              />
            </div>

            <h2>{isZh ? '为什么是"图片编辑器"而不是纯文生图' : 'Why we call it an image editor (not pure text-to-image)'}</h2>
            <p>
              {isZh
                ? '我们想做诚实的产品描述：LoveShow 520 的所有图像功能都需要你先上传一张参考图（自拍 / 合照），再由 AI 在保持你身份特征的前提下生成新作品。这是 image-to-image 的工作方式，更接近"AI 图片编辑器"，而不是凭空生成任何图像的"AI image generator"。我们不想夸大其词。'
                : 'We try to describe the product honestly: every image feature in LoveShow 520 requires a reference photo you upload, and the AI generates new artworks while preserving your identity. That makes it an image-to-image editor, closer to an "AI image editor" than a free-form "AI image generator". We try not to overpromise.'}
            </p>

            <h2>{isZh ? '内容安全与合规' : 'Content safety & compliance'}</h2>
            <ul className="not-prose space-y-3 my-6">
              <SafetyItem
                icon={ShieldCheck}
                title={isZh ? '可接受使用政策' : 'Acceptable Use Policy'}
                desc={
                  isZh
                    ? '我们对违规账户保留警告、限制功能、终止服务的权利。详细规则见服务条款 §7。'
                    : 'We reserve the right to warn, restrict features, or terminate violating accounts. See Terms §7 for the full Acceptable Use Policy.'
                }
              />
              <SafetyItem
                icon={ShieldCheck}
                title={isZh ? '禁止 NSFW 与未成年内容' : 'NSFW & minor content prohibited'}
                desc={
                  isZh
                    ? '严禁生成 NSFW、性暗示、未成年相关、仇恨、暴力、深度伪造或非法内容。'
                    : 'NSFW, sexual, minor-related, hateful, violent, deepfake or illegal content is strictly prohibited.'
                }
              />
              <SafetyItem
                icon={ShieldCheck}
                title={isZh ? '上传前自查' : 'Bring photos you have rights to'}
                desc={
                  isZh
                    ? '请只上传你有合法权利使用的照片（自己 / 已获授权的他人）。冒充真人、未授权的他人面部图像同样禁止。'
                    : 'Please only upload photos you have the legal right to use. Impersonation and non-consensual face images of others are not allowed.'
                }
              />
            </ul>

            <h2>{isZh ? '常见问题' : 'Frequently asked questions'}</h2>
            <div className="space-y-6 mt-6">
              {faq.map((item, i) => (
                <div key={i} className="border-l-4 border-violet-300 dark:border-violet-500/40 pl-4">
                  <h3 className="font-semibold text-base mb-2 text-slate-800 dark:text-slate-100">{item.q}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="not-prose mt-12 flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup">
                <Button className="btn-gradient bg-gradient-to-r from-violet-500 to-rose-500 text-white border-0 w-full sm:w-auto">
                  {isZh ? '注册免费试用' : 'Sign up to try free'}
                </Button>
              </Link>
              <Link href="/520-meaning">
                <Button variant="outline" className="w-full sm:w-auto">
                  {isZh ? '了解 520 是什么意思' : 'What does 520 mean?'}
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
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
      className="group rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-white dark:bg-slate-900 p-4 hover:border-violet-300 dark:hover:border-violet-400 hover:shadow-md transition-all flex items-start gap-3"
    >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-100 to-rose-100 dark:from-violet-500/20 dark:to-rose-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
      </div>
      <div>
        <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</div>
      </div>
    </Link>
  );
}

function SafetyItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 p-4">
      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
      </div>
      <div>
        <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">{desc}</div>
      </div>
    </li>
  );
}

const FAQ_ZH = [
  {
    q: 'LoveShow 520 是 AI 图片编辑器还是 AI 图像生成器？',
    a: '更准确的描述是 AI 图片编辑器（image-to-image）。所有图像功能都需要你先上传一张参考图（自拍 / 合照），AI 再在保持人物身份的前提下生成新作品。我们不会从空白文字凭空生成任意图像，这是为了保证身份还原度和减少误用风险。',
  },
  {
    q: '可以免费在线试用吗？',
    a: '可以。注册账号即赠送积分，可用于体验全部 AI 图像功能（证件照、肖像照、情侣写真、情侣大头贴）。无需绑定信用卡即可试用。超出免费额度后可购买积分套餐继续使用。',
  },
  {
    q: '生成需要多久？',
    a: '生成时间取决于具体模型与服务负载。证件照通常在 30 秒内出图；艺术肖像和情侣写真因为图像更复杂、分辨率更高，单张通常在 1-2 分钟。所有任务可在"作品库"页面查看历史。',
  },
  {
    q: '支持哪些图片输入和输出格式？',
    a: '支持上传 JPG / PNG 格式的清晰人脸照片，输出为高清 JPG / PNG。建议参考图分辨率不低于 1024×1024，五官清晰，光线均匀，单人或合影均可。',
  },
  {
    q: '生成的图片版权归谁？',
    a: '在你遵守服务条款的前提下，你拥有自己生成作品的使用权（个人或商业）。你必须对自己上传的原图负责——只能上传你有合法权利使用的照片。详细条款见 /terms。',
  },
  {
    q: '上传的照片会被用于模型训练吗？',
    a: '不会。我们仅在生成流程中使用你上传的照片，并保存生成结果用于你在"作品库"中回看。不会把你的照片用于训练任何第三方或我方的模型。',
  },
  {
    q: '为什么提示词会被拒绝？',
    a: '生成可能因模型自身的安全策略被拒绝，或因违反服务条款中的可接受使用政策（NSFW、性暗示、未成年相关、仇恨、暴力、深度伪造或违法内容）。详见服务条款的 Acceptable Use 章节。',
  },
];

const FAQ_EN = [
  {
    q: 'Is LoveShow 520 an AI image editor or an AI image generator?',
    a: 'A more accurate description is AI image editor (image-to-image). Every image feature requires you to upload a reference photo (selfie / couple shot); the AI then creates new artworks while preserving the person’s identity. We don’t generate arbitrary images from a blank text prompt — this keeps identity fidelity high and reduces misuse risk.',
  },
  {
    q: 'Is it free to try online?',
    a: 'Yes. Signing up gives you free credits to try every image feature (ID photos, portraits, couple photos, couple avatars). No credit card is required to start. Once free credits run out you can buy credit packs to continue.',
  },
  {
    q: 'How long does generation take?',
    a: 'Generation time depends on the model and current load. ID photos typically finish within 30 seconds; art portraits and couple photos usually take 1–2 minutes per image because they are higher-resolution and more complex. You can review history in the Gallery page.',
  },
  {
    q: 'Which input and output formats are supported?',
    a: 'Upload clear JPG / PNG portraits; output is high-resolution JPG / PNG. We recommend reference photos at 1024×1024 or higher with clean facial features and even lighting. Both single-person and couple photos are supported.',
  },
  {
    q: 'Who owns the generated images?',
    a: 'As long as you follow the Terms of Service, you own the right to use your generated outputs (personal or commercial). You are responsible for the photos you upload — you must only upload photos you have the legal right to use. See /terms for details.',
  },
  {
    q: 'Will my uploaded photos be used to train models?',
    a: 'No. Your uploaded photos are only used in the generation flow and stored so you can review outputs in your Gallery. They are not used to train any third-party or in-house models.',
  },
  {
    q: 'Why was my prompt rejected?',
    a: 'Generation may be rejected if the underlying AI model flags the request as unsafe, or if it falls under our Acceptable Use Policy (NSFW, sexual, minor-related, hateful, violent, deepfake or illegal content). See the Acceptable Use section of our Terms of Service for the full policy.',
  },
];

function ContentZh() {
  return (
    <>
      <h2>核心能力 · 一张参考图，多种作品</h2>
      <p>
        LoveShow 520 把"AI 图片编辑"做得更具体：上传一张清晰的自拍或合照后，你可以在不同模块里选择想要的最终形态。每一个生成都是 image-to-image，模型会尽量保留人物的身份特征（脸型、五官、肤色），同时按选择的风格改变服装、背景、光影或排版。
      </p>
      <ul>
        <li>
          <strong>AI 证件照</strong>：自动裁剪 + 换装 + 合规背景，支持一寸、二寸、护照、签证等多种规格。
        </li>
        <li>
          <strong>AI 艺术肖像</strong>：10 种风格（日系、胶片、黑白纪实、暗黑情绪、影棚等）。
        </li>
        <li>
          <strong>情侣写真 / 情侣大头贴</strong>：上传合照，生成多场景情侣作品；不会随机替换人脸。
        </li>
        <li>
          <strong>520 文案 / 情感分析 / 恋爱回忆录</strong>：以文字为主的浪漫创作，搭配 AI 文本模型生成。
        </li>
        <li>
          <strong>情侣音乐</strong>：基于 Suno 的音乐生成，配合 LoveShow 自有的歌词与文案模板。
        </li>
      </ul>

      <h2>诚实的"免费"说明</h2>
      <p>
        在中文搜索里"AI 图像生成 免费 / AI image generator free"是高频词，但很多产品在这里夸大其词。LoveShow 的免费策略是这样的：
      </p>
      <ul>
        <li>注册账号即赠送积分（可在"账单与积分"中查看），可立刻试用所有 AI 图像功能。</li>
        <li>积分用完后，可以选择继续付费购买积分套餐，也可以使用兑换码。</li>
        <li>不会"无限免费"——AI 模型的算力是真实成本，需要靠付费用户分摊。</li>
        <li>无需绑定信用卡即可试用。</li>
      </ul>
    </>
  );
}

function ContentEn() {
  return (
    <>
      <h2>One reference photo, multiple stylised works</h2>
      <p>
        LoveShow 520 keeps the &ldquo;AI image editing&rdquo; concept concrete: upload a clear selfie or couple
        photo, then pick the output you want. Every generation is image-to-image — the model preserves identity
        cues (face shape, features, skin tone) while applying a chosen style for outfit, background, lighting or
        layout.
      </p>
      <ul>
        <li>
          <strong>AI ID photo</strong> — auto crop + outfit + compliant background for one-inch, two-inch,
          passport and visa formats.
        </li>
        <li>
          <strong>AI art portrait</strong> — 10 styles incl. Japanese, film, B&amp;W, dark mood, studio.
        </li>
        <li>
          <strong>Couple photo / couple avatar</strong> — upload a real couple photo to keep both faces; we
          don&rsquo;t swap people in or out.
        </li>
        <li>
          <strong>520 copy, romance analysis, love memoir</strong> — text-first features powered by AI text
          models.
        </li>
        <li>
          <strong>Couple song</strong> — Suno-based music generation paired with our own lyric prompts.
        </li>
      </ul>

      <h2>An honest note about &ldquo;free&rdquo;</h2>
      <p>
        Search keywords like &ldquo;AI image generator free / free online AI image editor&rdquo; are popular,
        and a lot of sites overpromise here. Our free policy is concrete:
      </p>
      <ul>
        <li>Signing up adds free credits to your account; you can try every image feature immediately.</li>
        <li>When free credits run out you can buy a credit pack or use a redeem code to continue.</li>
        <li>
          We don&rsquo;t advertise &ldquo;unlimited free&rdquo; — model compute is a real cost shared across
          paying users.
        </li>
        <li>No credit card is required to start the free trial.</li>
      </ul>
    </>
  );
}
