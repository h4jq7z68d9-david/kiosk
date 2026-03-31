#!/usr/bin/env node
// generate-prints.js
// Fetches the product catalog and generates a static HTML file per product
// in the prints/ directory. Each file has correct OG tags and redirects to
// gallery.html with the product modal pre-opened.

import https from 'https';
import fs from 'fs';
import path from 'path';

const SITE     = 'https://davidnicholsonart.com';
const API_BASE = 'https://doqg3wcta7.execute-api.us-east-1.amazonaws.com';
const OUT  = path.join(process.cwd(), 'prints');

function get(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const reqOpts = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DavidNicholsonArt-Build/1.0)',
        'Accept': 'application/json',
      }
    };
    https.request(reqOpts, res => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch {
          console.error('Status:', res.statusCode);
          console.error('Body:', data.slice(0, 500));
          reject(new Error('Parse error from ' + url));
        }
      });
    }).on('error', reject).end();
  });
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHtml(p) {
  const productSlug = slug(p.title);
  const canonicalUrl = `${SITE}/prints/${productSlug}.html`;
  const galleryUrl   = `${SITE}/gallery.html?view=${encodeURIComponent(p.id)}`;
  const imgUrl       = p.rawImg || p.img || `${SITE}/og-image.jpg`;
  const title        = `${p.title} — David Nicholson Art`;
  const desc         = p.desc
    ? p.desc.slice(0, 200)
    : `${p.title} — fine art giclée print by David Nicholson. Available in multiple sizes.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(canonicalUrl)}">

  <!-- Open Graph -->
  <meta property="og:type"        content="product">
  <meta property="og:title"       content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image"       content="${esc(imgUrl)}">
  <meta property="og:url"         content="${esc(canonicalUrl)}">
  <meta property="og:site_name"   content="David Nicholson Art">

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image"       content="${esc(imgUrl)}">

  <script>window.location.replace("${galleryUrl}");</script>
</head>
<body>
  <p>Redirecting to <a href="${esc(galleryUrl)}">${esc(p.title)}</a>…</p>
</body>
</html>`;
}

async function main() {
  console.log('Fetching product catalog…');
  const data = await get(`${API_BASE}/products`);
  const products = data.products || [];

  if (!products.length) {
    console.error('No products returned — aborting');
    process.exit(1);
  }

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // Track slugs to handle duplicates
  const seen = {};
  let count = 0;

  for (const p of products) {
    if (!p.variations || !p.variations.length) continue;

    let s = slug(p.title);
    if (seen[s]) {
      s = `${s}-${p.id.slice(-4).toLowerCase()}`;
    }
    seen[s] = true;

    const html = buildHtml(p);
    const file = path.join(OUT, `${s}.html`);
    fs.writeFileSync(file, html, 'utf8');
    count++;
  }

  console.log(`Generated ${count} print pages in prints/`);
}

main().catch(e => {
  console.error('generate-prints failed:', e.message);
  process.exit(1);
});
