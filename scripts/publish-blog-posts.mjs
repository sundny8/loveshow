/**
 * Publish blog drafts from content/blog/*.md through the admin backend.
 *
 * Flow: sign in via Better-Auth (email/password) → POST each draft to
 * /api/admin/content with published: true. The API itself fires the
 * IndexNow ping for every post that goes live, so no extra step is needed.
 *
 * Usage:
 *   node scripts/publish-blog-posts.mjs                          # dry-run against BASE_URL
 *   node scripts/publish-blog-posts.mjs --publish                # actually publish
 *   BASE_URL=https://loveshow.life ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *     node scripts/publish-blog-posts.mjs --publish
 *
 * Env (falls back to .env.local):
 *   BASE_URL        target site (default: NEXT_PUBLIC_APP_URL or http://localhost:3000)
 *   ADMIN_EMAIL     admin account email
 *   ADMIN_PASSWORD  admin account password
 */
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'content', 'blog');

// Load .env.local for defaults
try {
  const content = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  /* .env.local optional */
}

const BASE_URL = (process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DO_PUBLISH = process.argv.includes('--publish');
// The Origin header must match where we POST, since Better-Auth trusts requests
// whose Origin equals its configured base URL (which equals BASE_URL in prod).
// Default to BASE_URL; allow an explicit AUTH_ORIGIN override for dev port quirks
// (e.g. dev server on :3001 while BETTER_AUTH_URL is :3000).
const AUTH_ORIGIN = (process.env.AUTH_ORIGIN || BASE_URL).replace(/\/$/, '');

/** Parse a markdown file with simple `---` frontmatter. */
function parseDraft(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`No frontmatter in ${filePath}`);

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    meta[key] = value;
  }

  // Normalize CRLF so the renderer's \n\n paragraph splitting always works.
  const content = match[2].trim().replace(/\r\n/g, '\n');
  return {
    slug: meta.slug,
    title: meta.title,
    excerpt: meta.excerpt || null,
    content,
    locale: meta.locale || 'en',
    category: meta.category || null,
    tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    readingTime: meta.readingTime || null,
    metaTitle: meta.metaTitle || null,
    metaDescription: meta.metaDescription || null,
    published: true,
  };
}

async function signIn() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to publish.');
  }
  const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    // Better-Auth CSRF protection rejects requests without an Origin header.
    headers: { 'Content-Type': 'application/json', Origin: AUTH_ORIGIN },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sign-in failed (${res.status}): ${body.slice(0, 200)}`);
  }
  // Better-Auth returns session cookies via Set-Cookie headers.
  const cookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);
  if (!cookies.length) throw new Error('Sign-in succeeded but no session cookie received.');
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

async function publishPost(cookie, post) {
  const res = await fetch(`${BASE_URL}/api/admin/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: AUTH_ORIGIN },
    body: JSON.stringify(post),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, error: data.error };
}

async function main() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md')).sort();
  console.log(`📚 Found ${files.length} drafts in content/blog/`);
  console.log(`🎯 Target: ${BASE_URL} ${DO_PUBLISH ? '(PUBLISH mode)' : '(dry-run — add --publish to go live)'}\n`);

  const posts = files.map((f) => parseDraft(join(CONTENT_DIR, f)));

  // Validate before touching the network
  for (const p of posts) {
    if (!p.slug || !p.title) throw new Error(`Draft missing slug/title: ${p.title || p.slug}`);
    const words = p.content.split(/\s+/).length;
    console.log(`  • ${p.slug}  [${p.category}]  ~${words} words, ${p.tags.length} tags`);
  }

  if (!DO_PUBLISH) {
    console.log('\n✅ Dry-run complete. All drafts parsed OK.');
    return;
  }

  console.log('\n🔐 Signing in…');
  const cookie = await signIn();
  console.log('✅ Signed in.\n');

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const post of posts) {
    const result = await publishPost(cookie, post);
    if (result.ok) {
      ok++;
      console.log(`✅ Published: ${post.slug}  →  ${BASE_URL}/${post.locale}/blog/${post.slug}`);
    } else if (result.status === 400 && /already exists/i.test(result.error || '')) {
      skipped++;
      console.log(`⏭️  Skipped (slug exists): ${post.slug}`);
    } else {
      failed++;
      console.log(`❌ Failed (${result.status}): ${post.slug} — ${result.error || 'unknown error'}`);
    }
  }

  console.log(`\n🎉 Done. Published: ${ok}, skipped: ${skipped}, failed: ${failed}.`);
  if (ok > 0) console.log('📡 IndexNow pings were fired server-side for each published post.');
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
