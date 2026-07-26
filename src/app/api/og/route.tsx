import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

/**
 * Dynamic Open Graph image (1200×630).
 *
 * Usage:
 *   /api/og                          → brand default card
 *   /api/og?title=...&subtitle=...   → per-page card (blog posts, landing pages)
 *
 * Referenced from metadata `openGraph.images` — an explicit URL avoids the
 * cascade/override pitfalls of the file-based opengraph-image convention
 * (which would clobber blog cover images set in generateMetadata).
 */

/**
 * Fetch a glyph-subset font covering exactly the characters we render.
 * Required for CJK titles — the built-in ImageResponse font is Latin-only.
 * Returns null on failure so we can degrade gracefully.
 */
async function loadSubsetFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (
      await fetch(cssUrl, {
        // Old UA → Google serves TTF (satori can't parse woff2).
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20100101 Firefox/12.0' },
      })
    ).text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'AI Love Studio · 520 = I Love You').slice(0, 90);
  const subtitle = (
    searchParams.get('subtitle') ||
    'AI love letters · couple portraits · personalised songs'
  ).slice(0, 120);

  const fontData = await loadSubsetFont(`${title}${subtitle}LoveShow 520 · loveshow.life`);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #881337 0%, #be123c 45%, #db2777 100%)',
          color: 'white',
          fontFamily: fontData ? 'NotoSansSC' : 'sans-serif',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              fontSize: 32,
            }}
          >
            ❤️
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>LoveShow 520</div>
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 40 ? 52 : 64,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 28, opacity: 0.85, maxWidth: 960 }}>{subtitle}</div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            opacity: 0.8,
          }}
        >
          <div style={{ display: 'flex' }}>loveshow.life</div>
          <div style={{ display: 'flex' }}>520 = I LOVE YOU</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fontData
        ? { fonts: [{ name: 'NotoSansSC', data: fontData, weight: 700 as const, style: 'normal' as const }] }
        : {}),
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
