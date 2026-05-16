'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: '生成一张证件照需要多少积分？',
    a: '当前每张消耗 10 积分，无论是同步生成还是批量生成都按张数计费。若因 AI 服务失败导致任务中止，积分会自动原路退回。',
  },
  {
    q: '没有配置 OpenAI / Gemini API Key 也能用吗？',
    a: '可以。流水线会自动降级到 Sharp 本地处理通路，完成基础换底、裁切、提亮、正装合成，保证有可下载的成片，但艺术效果会稍弱。',
  },
  {
    q: '支持哪些规格？',
    a: '内置 8 种：一寸、二寸、护照、签证、简历（蓝底）、学生证（蓝底）、驾照（白底）、自由创作。可在工作台左侧边栏一键切换。',
  },
  {
    q: '批量上传有张数限制吗？',
    a: '单次批量最多 20 张。任务创建后点数即时扣减，后台并发 3 张并行处理，你可以离开页面，稍后在画廊查看结果。',
  },
  {
    q: '生成的照片保存多久？',
    a: '创作者版 30 天，工作室版 90 天。建议生成后立即下载保存到本地。',
  },
  {
    q: 'AI 肖像场景引擎什么时候上线？',
    a: '我们正在内测职业形象、艺术写真、节日主题与团体合成等场景。工作室版用户将优先获得内测资格。',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/40">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            常见<span className="text-gradient">问题</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            如果下面没有你想问的，欢迎在工作台右下角联系我们。
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((f, i) => {
            const open = openIndex === i;
            return (
              <div
                key={f.q}
                className="surface-card overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
