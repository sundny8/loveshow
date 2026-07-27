/**
 * One-off IndexNow bulk submission.
 *
 * Fetches all published blog posts from the live site, builds the URL list
 * (posts + homepage + blog index), and POSTs it to api.indexnow.org using
 * the site's IndexNow key.
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs            # dry run — print URL list only
 *   node scripts/indexnow-submit.mjs --submit   # actually submit
 */

const SITE_URL = process.env.SITE_URL || 'https://loveshow.life';
const KEY = process.env.INDEXNOW_KEY || 'f7c3a9d24e814b06b5e18c2d90a47f31';

const submit = process.argv.includes('--submit');

async function main() {
  const host = new URL(SITE_URL).host;

  // 1. Collect published posts from the public blog API
  const res = await fetch(`${SITE_URL}/api/blog?locale=all&limit=100`);
  if (!res.ok) throw new Error(`Failed to fetch blog list: ${res.status}`);
  const { posts } = await res.json();

  // 2. Build URL list: core pages + every published post
  const urls = [
    `${SITE_URL}/en`,
    `${SITE_URL}/zh`,
    `${SITE_URL}/en/blog`,
    ...posts.map((p) => `${SITE_URL}/${p.locale}/blog/${p.slug}`),
  ];

  console.log(`IndexNow ${submit ? 'SUBMIT' : 'DRY RUN'} — ${urls.length} URLs for host ${host}:\n`);
  urls.forEach((u) => console.log('  ' + u));

  if (!submit) {
    console.log('\nDry run only. Re-run with --submit to send.');
    return;
  }

  // 3. Submit to IndexNow (shared across Bing / Yandex / Seznam / Naver)
  const resp = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: KEY,
      keyLocation: `${SITE_URL}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  console.log(`\nIndexNow response: ${resp.status} ${resp.statusText}`);
  if (resp.status === 200 || resp.status === 202) {
    console.log('Submitted successfully.');
  } else {
    const body = await resp.text().catch(() => '');
    console.error('Submission failed:', body);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
