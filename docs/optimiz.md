# LoveShow 520 — SEO / GEO 优化实施计划

> 目标站点：https://loveshow.life （Next.js 15 + next-intl，Cloudflare CDN，默认语言 EN）
> 文档版本：v1.0（2026-05）
> GEO = Generative Engine Optimization（生成式引擎优化：让 ChatGPT / Perplexity / Google AI Overviews / 豆包 / Kimi 等 AI 搜索在回答中引用并推荐本站）

---

## 0. 现状盘点

### 已具备 ✅
| 项 | 位置 | 状态 |
|---|---|---|
| robots.txt | `src/app/robots.ts` | 已屏蔽 api/dashboard/admin/auth/uploads |
| sitemap.xml | `src/app/sitemap.ts` | 每个 (locale, path) 一条，含 hreflang |
| hreflang + canonical | `src/app/[locale]/layout.tsx` | 已有 x-default → /en |
| JSON-LD 结构化数据 | 同上 | Organization + WebSite + SearchAction |
| OG / Twitter 卡片 | 同上 | 有，但图片复用 `suits/female.png`（非专用 OG 图） |
| 多语言 | next-intl，7 语言文案 | 默认 EN，路由仅 zh/en |
| HTTPS + CDN | Cloudflare 橙云（已修复 525） | 全球加速可用 |
| 博客系统 | `/[locale]/blog` | 框架已有，内容量不足 |

### 主要短板 ❌
1. **内容量极少**：可索引页面 ~10 个，博客几乎为空 → 搜索引擎没有理由收录/排名
2. **未提交搜索引擎**：Google Search Console / Bing Webmaster / IndexNow 均未接入
3. **无专用 OG 图**（1200×630），社交分享点击率低
4. **无外链**：域名新、零反向链接，权重为 0
5. **GEO 为零**：无 FAQ/HowTo 结构化数据、无可被 AI 引用的"事实块"内容
6. **sitemap 与实际路由不完全一致**（如 `/520-meaning`、`/ai-image-editor`、`/portrait`、`/music` 需核对是否已上线并可 200 访问）
7. **性能未度量**：Core Web Vitals 无基线数据

---

## 1. 目标与 KPI（3 个月）

| 指标 | 当前 | 1 个月 | 3 个月 |
|---|---|---|---|
| Google 收录页面数 | ≈0 | ≥ 30 | ≥ 120 |
| 自然搜索点击 / 周 | ≈0 | 50+ | 500+ |
| 核心词进前 50 名数量 | 0 | 3 | 15 |
| 被 AI 引擎引用（Perplexity/AI Overview 抽查） | 0 | 出现 1 次 | 稳定出现 |
| CWV 通过率（移动端） | 未知 | LCP<2.5s | 三项全绿 |
| 外链引用域名数 | 0 | 5 | 30 |

核心关键词方向（EN 为主战场）：
- `520 meaning` / `what does 520 mean in chinese`（信息词，流量入口）
- `AI love letter generator` / `AI couple portrait` / `AI love song generator`（产品词，转化入口）
- `romantic AI photo generator` / `anniversary gift ideas AI`（长尾词）
- 中文侧：`520表白文案`、`AI情侣写真`、`AI写情书`

---

## 2. 阶段一：技术 SEO 基建（第 1–2 周）

### 2.1 搜索引擎接入（最高优先级，当天可完成）
- [ ] 注册 **Google Search Console**，用 DNS TXT（Cloudflare 面板添加）验证 `loveshow.life`
- [ ] 提交 `https://loveshow.life/sitemap.xml`，对首页/核心落地页手动"请求编入索引"
- [ ] 注册 **Bing Webmaster Tools**（可从 GSC 一键导入），Bing 数据同时供 ChatGPT 搜索使用 → 这是 GEO 的关键入口
- [ ] 接入 **IndexNow**（Bing/Yandex 即时收录）：`public/` 放 key 文件，发布新内容时 ping API
- [ ] 中文侧可选：百度搜索资源平台（需要备案则放弃，仅做 Bing/Google 中文收录）

### 2.2 页面级 metadata 补全
- [ ] 每个公开页面（首页、blog、blog/[slug]、gallery、workspace、privacy、terms、docs）实现独立 `generateMetadata`：唯一 title（≤60 字符）+ 唯一 description（140–160 字符），禁止全站共用一套
- [ ] 制作专用 **OG 图 1200×630**（品牌 + 主标语），替换 layout 中的 `suits/female.png`；博客文章可用动态 OG（`next/og` ImageResponse 按标题生成）
- [ ] 核对 `src/app/sitemap.ts` 中所有 path 与真实路由一一对应，删除 404 项、补充遗漏项（如 `/docs`）
- [ ] blog/[slug] 增加 `Article` JSON-LD（headline、datePublished、author、image）

### 2.3 抓取与渲染
- [ ] 确认公开页全部为 SSR/SSG 输出完整 HTML（`curl -A Googlebot https://loveshow.life/en | grep '<h1'` 验证），登录墙内容不影响
- [ ] `next.config.ts` 开启 `images` 优化，公开页图片全部走 `next/image` + 描述性 `alt`
- [ ] 404/500 页面返回正确状态码；`/` → `/en` 使用 307/308 且仅一跳
- [ ] Cloudflare 侧：确认没有对 Googlebot 的 Bot Fight/挑战规则误伤（Security → Bots 设为放行已验证爬虫）
- [ ] robots.ts 增加对 AI 爬虫的**显式放行**（GEO 需要）：`GPTBot`、`OAI-SearchBot`、`PerplexityBot`、`ClaudeBot`、`Google-Extended`、`Bytespider` 允许抓取公开页

---

## 3. 阶段二：内容引擎（第 2–8 周，持续）

> 没有内容就没有排名。这一阶段权重占整个计划的 50%。

### 3.1 核心落地页（Money Pages）
为每个 AI 功能建立独立、可索引的营销落地页（非登录墙内的 workspace）：

| 页面 | 目标词 | 结构 |
|---|---|---|
| `/en/ai-love-letter` | AI love letter generator | H1 + 演示样例 + 步骤 HowTo + FAQ + CTA |
| `/en/ai-couple-portrait` | AI couple portrait generator | 同上（含前后对比图） |
| `/en/ai-love-song` | AI love song generator | 同上（含可播放示例） |
| `/en/520-meaning` | 520 meaning | 权威解释 + 文化背景 + 用法示例 |

每页要求：≥800 词原创内容、1 个 H1、语义化 H2/H3、内链到相关博客、`FAQPage` + `HowTo` JSON-LD。

### 3.2 博客内容日历（每周 2 篇，EN 为主 + ZH 精选翻译）
第一批 12 篇选题（按搜索量×竞争度排序）：
1. What Does 520 Mean? The Complete Guide to Chinese Internet Love Slang
2. 100+ Romantic Messages to Send on 520 Day
3. How to Create an AI Couple Portrait (Step-by-Step)
4. 10 AI-Generated Love Song Ideas for Your Anniversary
5. 520 vs 521: What's the Difference?
6. Long-Distance Relationship Gift Ideas Powered by AI
7. How to Write a Love Letter with AI (Without It Sounding Robotic)
8. Chinese Number Slang Explained: 520, 1314, 88…
9. Best Anniversary Photo Ideas 2026
10. AI Music for Weddings: A Practical Guide
11. 七夕 vs Valentine's Day vs 520
12. How We Built an AI Love Studio（技术向，吸引开发者外链）

写作规范：
- 开头 80 词内直接给出答案（Featured Snippet / AI 引用友好）
- 每篇含 1 个数据表格或步骤列表（AI 引擎偏好结构化内容）
- 每篇内链 ≥3 条（落地页 ↔ 博客互链），外链 1–2 条权威来源
- 文末 FAQ 3–5 问 + `FAQPage` JSON-LD

### 3.3 程序化 SEO（Programmatic，第 6 周起）
- 模板页批量生成长尾：`/en/love-message/[occasion]`（anniversary / valentines / proposal / apology…，每页独立文案 + 示例），一次上线 20–50 页
- 用户公开画廊（`/gallery`）：为每个公开作品生成独立可索引详情页（标题含风格关键词），UGC 即内容

---

## 4. 阶段三：GEO（生成式引擎优化，与阶段二并行）

AI 搜索引用来源的偏好：**结构清晰、有明确事实句、有 FAQ、被第三方提及**。

- [ ] **可引用事实块**：每个落地页首屏后放一段 "LoveShow 520 is an AI love studio that generates love letters, couple portraits and love songs…" 式的自描述（AI 抓取时直接可复述）
- [ ] **FAQPage / HowTo / Article JSON-LD 全覆盖**（阶段二已列，GEO 复用）
- [ ] **llms.txt**：在 `public/llms.txt` 提供站点结构与核心页面摘要（新兴标准，Perplexity 等已开始读取）
- [ ] **robots 放行 AI 爬虫**（见 2.3）
- [ ] **第三方语料占位**：在 Reddit（r/ChatGPT、r/LongDistance）、Product Hunt、Quora（"what does 520 mean"高赞问题）、知乎（520 相关问题）留下自然、有价值的回答并附链接 —— AI 引擎大量引用这些平台
- [ ] **Product Hunt 发布**一次（同时收获外链 + AI 语料 + 首批用户）
- [ ] **Wikipedia/Wikidata**：不直接建品牌词条（会被删），但可在 "520 (number)" / "Chinese Internet slang" 相关词条的 External links 合规参与讨论页建议
- [ ] 每月抽查：在 ChatGPT Search / Perplexity / Google AI Overview 问 "best AI love letter generator"、"what does 520 mean"，记录本站是否被引用

---

## 5. 阶段四：站外与外链（第 3 周起，持续）

优先级从高到低：
1. **Product Hunt / Hacker News（Show HN）发布** — 一次性高质量外链 + 流量脉冲
2. **AI 工具目录站收录**（免费，量大）：There's An AI For That、Futurepedia、Toolify、AI 工具集（中文）等 20+ 目录，逐个提交
3. **客座内容**：给 AI/情感/礼物类博客投稿（附 1 条 dofollow 链接）
4. **数字公关**：制作一份 "520 Day 数据报告/文化图解"（可用站内 AI 生成配图），投放给报道中国互联网文化的英文媒体
5. **社交信号**：X/TikTok/小红书 发布 AI 生成的情侣写真/情歌片段，统一带落地页短链（社交流量间接助推 SEO）

红线：不买链接、不做 PBN、不参与链接农场 —— 新域名极易被算法惩罚。

---

## 6. 阶段五：性能与体验（第 2–4 周）

- [ ] 用 PageSpeed Insights 建立基线（移动端优先），记录 LCP/INP/CLS
- [ ] LCP：首页 hero 图预加载（`priority`）、压缩为 WebP/AVIF、字体 `display: swap`
- [ ] Cloudflare：开启 Brotli、Early Hints、`/_next/static` 缓存命中率检查（已有 365d 规则）
- [ ] JS 减重：公开营销页避免引入 dashboard 级组件包（动态 import 分割）
- [ ] 移动端适配抽查：落地页在 375px 宽度下无横向滚动、CTA 可触达

---

## 7. 监测与迭代（长期）

| 工具 | 用途 | 频率 |
|---|---|---|
| Google Search Console | 收录、查询词、CTR、CWV | 每周 |
| Bing Webmaster | Bing/ChatGPT 侧收录 | 每周 |
| 站内 analytics（`src/lib/analytics.ts`） | 转化漏斗：落地页→注册→生成 | 每周 |
| Ahrefs Webmaster Tools（免费版） | 外链增长、关键词排名 | 每两周 |
| 手动 AI 引用抽查 | GEO 效果 | 每月 |

迭代规则：
- GSC 中"曝光高、CTR<1%"的页面 → 重写 title/description
- 排名 5–15 名的词 → 加内链、扩充内容冲首页
- 零曝光超过 6 周的博客 → 合并或重定向到相关强页

---

## 8. 执行排期总览

| 周次 | 里程碑 |
|---|---|
| W1 | GSC/Bing/IndexNow 接入；robots 放行 AI 爬虫；OG 图上线；sitemap 校准 |
| W2 | 4 个核心落地页上线（含 FAQ/HowTo JSON-LD）；性能基线 + LCP 优化 |
| W3–4 | 博客前 4 篇发布；AI 目录站提交 20 个；llms.txt 上线 |
| W5–6 | Product Hunt 发布；博客累计 8 篇；Quora/Reddit 布点 |
| W7–8 | 程序化长尾页第一批（20+）；数字公关素材制作 |
| W9–12 | 内容持续（每周 2 篇）；外链拓展；按 GSC 数据迭代 title/内链 |

---

## 附录 A：本次已完成的代码改动
- `src/i18n/routing.ts`：`localeDetection: false` — 全站默认英文，不再按浏览器语言自动跳转 `/zh`（配合 SEO：x-default 指向 /en，与实际行为一致）

## 附录 B：代码任务清单（✅ 已全部完成 2026-05）
1. ✅ `src/app/robots.ts` — 显式放行 GPTBot / OAI-SearchBot / PerplexityBot / ClaudeBot / Google-Extended / Bytespider 等 10 个 AI 爬虫
2. ✅ `public/llms.txt` — 站点结构 + 核心页面 + 可引用事实块
3. ✅ 动态 OG 图 — `src/app/api/og/route.tsx`（next/og，1200×630，支持中文标题按需子集字体）；全站默认 OG 与博客无封面兜底均已切换
4. ✅ 3 个新营销落地页 — `/ai-love-letter`、`/ai-couple-portrait`、`/ai-love-song`（`/520-meaning` 原已存在），各含 ≥800 词双语内容 + 可引用事实块 + FAQPage/HowTo JSON-LD + 互链
5. ✅ 通用 JSON-LD 组件 — `src/components/seo/json-ld.tsx`（JsonLd 渲染器 + faqPageLd/howToLd/articleLd builders）
6. ✅ blog/[slug] — 完整 generateMetadata（canonical/OG article/twitter/publishedTime）+ Article JSON-LD + 清理 StartFast 模板遗留文案
7. ✅ IndexNow — `src/lib/indexnow.ts` + `public/f7c3a9d24e814b06b5e18c2d90a47f31.txt`，博客创建/更新为已发布时自动 ping Bing/Yandex
8. ✅ sitemap.ts — 补 `/docs` + 3 个新落地页；改为 async 动态收录数据库中已发布的博客文章
