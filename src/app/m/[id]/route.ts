import { NextRequest, NextResponse } from 'next/server';
import { db, loveColumnRecords, users } from '@/db';
import { eq } from 'drizzle-orm';
import { renderMemoirToHtml, buildMemoirShareHtml } from '@/lib/love-column/memoir-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /m/[id]
 * 公开分享页：返回完整 HTML5 页面（不需要登录）。
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const acceptLang = req.headers.get('accept-language') || '';
  const locale: 'zh' | 'en' = acceptLang.toLowerCase().includes('zh') ? 'zh' : 'en';

  const record = await db.query.loveColumnRecords.findFirst({
    where: eq(loveColumnRecords.id, id),
  });

  if (!record || record.type !== 'memoir') {
    return new NextResponse(notFoundHtml(locale), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const payload =
    record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
      ? (record.payload as Record<string, any>)
      : {};
  const memoirText: string = payload.output?.memoir || '';
  const title: string = payload.title || (locale === 'en' ? 'Our Love Memoir' : '我们的恋爱回忆录');

  if (!memoirText) {
    return new NextResponse(notFoundHtml(locale), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let authorName: string | null = null;
  try {
    const author = await db.query.users.findFirst({
      where: eq(users.id, record.userId),
    });
    authorName = author?.name || null;
  } catch {
    /* ignore */
  }

  const body = renderMemoirToHtml(memoirText);
  const html = buildMemoirShareHtml({
    title,
    body,
    createdAt: record.createdAt,
    authorName,
    locale,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

function notFoundHtml(locale: 'zh' | 'en'): string {
  const lang = locale === 'en' ? 'en' : 'zh-CN';
  const msg = locale === 'en' ? 'Memoir not found' : '回忆录不存在或已被删除';
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>404</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#fff1f2;color:#475569;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.box{text-align:center;padding:32px}.emoji{font-size:48px}.msg{margin-top:16px;font-size:16px}</style></head><body><div class="box"><div class="emoji">💔</div><div class="msg">${msg}</div></div></body></html>`;
}
