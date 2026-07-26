/** One-off: verify published blog rendering (inline links, JSON-LD) on local dev. */
const BASE = process.env.BASE_URL || 'http://localhost:3001';
const slugs = [
  'what-does-520-mean',
  'how-to-create-ai-couple-portrait',
  'how-we-built-an-ai-love-studio',
];

for (const slug of slugs) {
  const res = await fetch(`${BASE}/en/blog/${slug}`);
  const html = await res.text();
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/g, '');

  const internalLinks = (noScripts.match(/<a [^>]*href="\/en\/[a-z0-9\-/]+"/g) || []).length;
  const externalLinks = (noScripts.match(/<a [^>]*target="_blank"/g) || []).length;
  const faqLd = html.includes('"FAQPage"');
  const articleLd = html.includes('"Article"');
  const rawMdLinks = /\[[^\]]+\]\(\/(en|zh)\//.test(noScripts);
  const rawBold = /\*\*[^*]+\*\*/.test(noScripts);
  const strongTags = (noScripts.match(/<strong[^>]*>/g) || []).length;

  console.log(`\n📄 /en/blog/${slug} (HTTP ${res.status}, ${html.length} bytes)`);
  console.log(`   internal <a> links : ${internalLinks}`);
  console.log(`   external <a> links : ${externalLinks}`);
  console.log(`   <strong> tags      : ${strongTags}`);
  console.log(`   FAQPage JSON-LD    : ${faqLd ? '✅' : '❌'}`);
  console.log(`   Article JSON-LD    : ${articleLd ? '✅' : '❌'}`);
  console.log(`   raw [md](links)    : ${rawMdLinks ? '❌ LEAKED' : '✅ none'}`);
  console.log(`   raw **bold**       : ${rawBold ? '❌ LEAKED' : '✅ none'}`);
}

// Blog index should list the new posts
const idx = await fetch(`${BASE}/en/blog`);
const idxHtml = await idx.text();
const count = slugs.filter((s) => idxHtml.includes(`/blog/${s}`)).length;
console.log(`\n📚 /en/blog index (HTTP ${idx.status}): ${count}/${slugs.length} sampled slugs listed`);
const postLinks = [...new Set(idxHtml.match(/href="\/en\/blog\/[a-z0-9-]+"/g) || [])];
console.log(`   distinct post links on index: ${postLinks.length}`);
postLinks.slice(0, 15).forEach((l) => console.log('   ', l));
