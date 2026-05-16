import { Star } from 'lucide-react';

const stories = [
  {
    name: '林小姐',
    role: '求职者',
    avatar: '林',
    rating: 5,
    quote:
      '早上临时通知要提交证件照，用 LoveShow 在工位上拍了一张，十几秒就拿到白底一寸，HR 说比照相馆的还干净。',
  },
  {
    name: 'Alex',
    role: '留学申请',
    avatar: 'A',
    rating: 5,
    quote:
      '签证照对背景和裁切要求很严，手动调了三次都被拒。LoveShow 一次通过，不用再跑照相馆。',
  },
  {
    name: '王同学',
    role: '学生证补办',
    avatar: '王',
    rating: 5,
    quote: '作为学生，一次拍好几个版本很划算，关键是 30 点真的便宜。',
  },
  {
    name: '陈老师',
    role: '在编教师',
    avatar: '陈',
    rating: 5,
    quote:
      '年审要电子版证件照，双引擎确实稳，之前用过其他工具经常排队失败，这里几乎是秒出。',
  },
  {
    name: 'Kevin',
    role: '自由职业',
    avatar: 'K',
    rating: 5,
    quote:
      '简历蓝底、领英白底、驾照反光橙底一次生成三份，还能批量下载，节省了我 40 分钟。',
  },
  {
    name: '张女士',
    role: 'HR',
    avatar: '张',
    rating: 5,
    quote:
      '公司招聘季要大量员工工牌照，LoveShow 的批量上传和统一规格出图帮我们把一天活儿压到一个小时。',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            来自真实用户的<span className="text-gradient">口碑</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            超过 98% 的用户认为 LoveShow 比传统照相馆更快、更便宜、更规范。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {stories.map((s) => (
            <div key={s.name} className="surface-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-loveshow-gradient text-white flex items-center justify-center font-semibold">
                  {s.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: s.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                &ldquo;{s.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
