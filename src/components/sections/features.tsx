import { Scissors, Wand2, SunMedium, Shirt, Layers, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Scissors,
    title: '智能构图',
    description: 'MediaPipe 实时定位五官，自动按证件照规范裁切头肩比例，肩线居中无需手动调整。',
  },
  {
    icon: Wand2,
    title: '双引擎生成',
    description:
      '首选 OpenAI gpt-image 进行高保真换底与正装合成，失败时自动降级到 Gemini，并保留 Sharp 纯本地通路作为最终兜底。',
  },
  {
    icon: SunMedium,
    title: '补光与肤色',
    description: '自动侦测肤色档位，智能提亮欠曝区域，保留自然质感，让证件照摆脱蜡黄与死白。',
  },
  {
    icon: Layers,
    title: '8 种规格一键切换',
    description: '内置一寸 / 二寸 / 护照 / 签证 / 简历 / 学生证 / 驾照 / 自由创作，dpi 与背景色精准符合官方要求。',
  },
  {
    icon: Shirt,
    title: '正装智能合成',
    description: '根据用户选择的引擎和规格，合成男 / 女款衬衫或西装，保持领口自然过渡，支持跳过。',
  },
  {
    icon: ShieldCheck,
    title: '积分与事务',
    description: '点数扣减、退款、订单记录均使用数据库事务保障一致性，生成失败自动原路返还。',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            一条流水线解决<span className="text-gradient">所有细节</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            从人脸定位到成片导出，每一步都经过严格调校，你只需要按下生成。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="surface-card p-6 hover:-translate-y-0.5 transition-transform"
            >
              <div className="h-11 w-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
