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

  // Hero pool: small static list the homepage picks from (daily rotation),
  // so the hero never waits on a live catalog fetch. Prefer recent years.
  // Only horizontal or square pieces are eligible — the hero is a wide band,
  // and a portrait painting cropped to fill it shows an unrecognisable slice.
  const withImg = products.filter(p => p.img);
  const recent  = withImg.filter(p => p.year && [2025, 2026].includes(parseInt(p.year)));
  const candidates = recent.length ? recent : withImg;

  const measured = [];
  for (const p of candidates) {
    const dim = await imageSize(p.img);
    if (!dim) continue;
    measured.push({ ...p, ratio: dim.width / dim.height });
  }
  const wideEnough = measured.filter(p => p.ratio >= 0.98);

  // never ship an empty hero: fall back to unfiltered if measuring fails
  const chosen = wideEnough.length ? wideEnough : candidates;
  if (!wideEnough.length) {
    console.warn('hero-pool: no horizontal/square images measured, falling back to all');
  }
  const pool = chosen.map(p => ({ img: p.img, title: p.title }));
  console.log(`hero-pool: ${wideEnough.length} of ${measured.length} measured images are horizontal or square`);
  fs.writeFileSync(
    path.join(process.cwd(), 'hero-pool.js'),
    `window.__HERO_POOL__ = ${JSON.stringify(pool)};\n`,
    'utf8'
  );
  console.log(`Wrote hero-pool.js with ${pool.length} entries`);
}

/**
 * Read intrinsic dimensions from a remote JPEG/PNG by fetching only the header
 * bytes and parsing the markers. Avoids adding an image library dependency.
 * Returns { width, height } or null if it can't be determined.
 */
async function imageSize(url) {
  let buf;
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-131071' } });
    if (!res.ok && res.status !== 206) return null;
    buf = Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
  if (buf.length < 24) return null;

  // PNG: IHDR width/height at fixed offsets
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk segments to the SOF marker that carries the dimensions
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0-SOF15, excluding DHT(c4), JPG(c8) and DAC(cc)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      if (len < 2) return null;
      i += 2 + len;
    }
  }
  return null;
}

main().catch(e => {
  console.error('generate-prints failed:', e.message);
  process.exit(1);
});
