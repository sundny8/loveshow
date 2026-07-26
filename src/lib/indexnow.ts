import { getSiteUrl } from '@/lib/seo';

/**
 * IndexNow integration — instantly notifies Bing / Yandex (and by extension
 * ChatGPT Search, which consumes the Bing index) when content is published
 * or updated, instead of waiting for the next crawl.
 *
 * The key must also be served at https://<host>/<key>.txt — see
 * public/<key>.txt. Override via INDEXNOW_KEY if you rotate the key
 * (remember to add the matching public key file).
 */
const DEFAULT_KEY = 'f7c3a9d24e814b06b5e18c2d90a47f31';

export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY || DEFAULT_KEY;
}

/**
 * Fire-and-forget ping. Never throws — indexing hints must not break the
 * publishing flow. Pass site-relative paths like `/en/blog/my-post`.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  // Skip on localhost/dev — IndexNow rejects unverifiable hosts anyway.
  const siteUrl = getSiteUrl();
  if (siteUrl.includes('localhost')) return;

  const key = getIndexNowKey();
  const host = new URL(siteUrl).host;

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList: paths.map((p) => `${siteUrl}${p.startsWith('/') ? p : `/${p}`}`),
      }),
    });
    if (!res.ok) {
      console.warn(`[indexnow] ping failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.warn('[indexnow] ping error:', err);
  }
}
