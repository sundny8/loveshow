/**
 * 把 memoir 的 markdown-like 文本渲染成 HTML 字符串。
 * 用于公开分享页面（非 React 环境）。
 *
 * 支持语法：
 *  - # / ## / ### 标题
 *  - > 引用
 *  - - 列表项
 *  - ![alt](url) 图片
 *  - 普通段落
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMemoirToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  let inList = false;

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${escapeHtml(para.join(' '))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      closeList();
      continue;
    }
    const imgMatch = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushPara();
      closeList();
      const url = escapeHtml(imgMatch[1]);
      out.push(`<figure><img src="${url}" alt="memoir" loading="lazy" /></figure>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      closeList();
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      flushPara();
      closeList();
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      flushPara();
      closeList();
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('> ')) {
      flushPara();
      closeList();
      out.push(`<blockquote>${escapeHtml(line.slice(2))}</blockquote>`);
    } else if (line.startsWith('- ')) {
      flushPara();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else {
      closeList();
      para.push(line);
    }
  }
  flushPara();
  closeList();
  return out.join('\n');
}

/**
 * 完整的分享页 HTML 文档（自包含样式）。
 */
export function buildMemoirShareHtml(params: {
  title: string;
  body: string;
  createdAt?: Date | string | null;
  authorName?: string | null;
  locale?: 'zh' | 'en';
}): string {
  const lang = params.locale === 'en' ? 'en' : 'zh-CN';
  const safeTitle = escapeHtml(params.title || (lang === 'en' ? 'Love Memoir' : '恋爱回忆录'));
  const date = params.createdAt
    ? new Date(params.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const author = params.authorName ? escapeHtml(params.authorName) : '';
  const tagline = lang === 'en' ? 'A love story crafted by LoveShow' : '由 LoveShow 为你定格的爱情故事';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#fb7185" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${tagline}" />
<title>${safeTitle}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    background: linear-gradient(180deg, #fff1f2 0%, #fdf4ff 60%, #ffffff 100%);
    color: #1f2937;
    line-height: 1.75;
    min-height: 100vh;
    padding: 24px 16px 80px;
  }
  .wrap {
    max-width: 720px;
    margin: 0 auto;
    background: rgba(255,255,255,0.85);
    border-radius: 24px;
    box-shadow: 0 12px 36px rgba(244, 63, 94, 0.12);
    padding: 32px 24px;
    backdrop-filter: blur(8px);
  }
  .header { text-align: center; margin-bottom: 28px; }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    background: linear-gradient(90deg, #fb7185, #ec4899);
    color: white;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .title-main {
    font-size: 28px;
    font-weight: 800;
    margin: 14px 0 6px;
    color: #be123c;
  }
  .meta { font-size: 13px; color: #94a3b8; }
  .content h1 {
    font-size: 26px;
    font-weight: 800;
    color: #be123c;
    text-align: center;
    margin: 28px 0 14px;
  }
  .content h2 {
    font-size: 20px;
    font-weight: 700;
    color: #db2777;
    margin: 22px 0 10px;
  }
  .content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #db2777;
    margin: 18px 0 8px;
  }
  .content p { margin: 12px 0; color: #334155; }
  .content blockquote {
    border-left: 4px solid #fda4af;
    padding: 8px 14px;
    margin: 16px 0;
    background: rgba(254, 226, 226, 0.45);
    border-radius: 0 12px 12px 0;
    font-style: italic;
    color: #475569;
  }
  .content ul { padding-left: 22px; margin: 12px 0; }
  .content li { margin: 6px 0; color: #334155; }
  .content figure { margin: 20px 0; text-align: center; }
  .content img {
    max-width: 100%;
    max-height: 480px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    object-fit: cover;
  }
  .footer {
    text-align: center;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px dashed #fecdd3;
    color: #94a3b8;
    font-size: 12px;
  }
  .footer a { color: #e11d48; text-decoration: none; font-weight: 600; }
  @media (max-width: 480px) {
    body { padding: 12px 8px 64px; }
    .wrap { padding: 22px 16px; border-radius: 18px; }
    .title-main { font-size: 22px; }
    .content h1 { font-size: 22px; }
    .content h2 { font-size: 18px; }
  }
</style>
</head>
<body>
  <main class="wrap">
    <header class="header">
      <span class="badge">${lang === 'en' ? 'Love Memoir' : '恋爱回忆录'}</span>
      <h1 class="title-main">${safeTitle}</h1>
      <p class="meta">${[author, date].filter(Boolean).join(' · ')}</p>
    </header>
    <article class="content">
${params.body}
    </article>
    <footer class="footer">
      <p>${tagline}</p>
      <p><a href="/">LoveShow</a></p>
    </footer>
  </main>
</body>
</html>`;
}
