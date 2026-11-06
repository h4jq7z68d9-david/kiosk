#!/usr/bin/env node
/* tools/site/smoke.js — headless browser pass over the public site and one page per study course.
   Usage: node tools/site/smoke.js [slug]        slug = also screenshot that course's home (1440) and a work page (390)
   Needs: npm i playwright (any folder on NODE_PATH, or next to the repo) and Chromium or Google Chrome.
   Serves the repo on a local port, blocks analytics hosts, and writes screenshots to tools/site/out/ (gitignored).
   Exit 1 on any FAIL. Study-site-builder §9.7 is this file. */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const FOCUS = process.argv[2] || null;
const PORT = 8731;
const BLOCK = /googletagmanager|google-analytics|facebook\.(com|net)|pinimg|pinterest|doubleclick|googleads/;
/* Gated or tool pages: logged-out render only — load, no errors, no sideways scroll, gate or UI present. */
const GATED = [['/admin.html', '#gate', [1440, 390]], ['/expenses-jill-nicholson.html', '#gate', [1440, 390]], ['/kiosk.html', 'body', [1024, 820]], ['/booth.html', 'body', [1440, 820]]];   // kiosk and booth are iPad tools, not phone pages
const MAIN_PAGES = ['/', '/gallery.html', '/originals.html', '/shipping.html', '/varied-readings.html', '/study.html',
  '/art-westport-2026.html', '/lawrence-art-in-the-park-2026.html', '/overland-park-2026.html'];

let pw;
try { pw = require('playwright'); } catch (e) {
  try { pw = require(path.join(ROOT, '..', 'pw', 'node_modules', 'playwright')); } catch (e2) {
    console.error('playwright not found: run  mkdir -p ../pw && cd ../pw && npm i playwright  (outside the repo), then rerun'); process.exit(2);
  }
}

/* ---------- static server ---------- */
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', jpg: 'image/jpeg', png: 'image/png', xml: 'application/xml', json: 'application/json', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', txt: 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).slice(1)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

/* ---------- course pages ---------- */
const courseDir = path.join(ROOT, 'tools/study/courses');
const courses = fs.readdirSync(courseDir).filter((f) => f.endsWith('.json')).map((f) => {
  const slug = f.slice(0, -5);
  const cfg = JSON.parse(fs.readFileSync(path.join(courseDir, f), 'utf8'));
  const base = (cfg.basePath || '/study/art-history').replace(/\/$/, '');
  const dir = path.join(ROOT, base, slug);
  /* first part folder, first page in it that is not the part page itself = a work/concept page */
  let work = null;
  const sub = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== 'img').map((e) => e.name).sort()[0];
  if (sub) { const files = fs.readdirSync(path.join(dir, sub)).filter((x) => x.endsWith('.html')).sort(); work = files[1] ? `${base}/${slug}/${sub}/${files[1]}` : null; }
  return { slug, home: `${base}/${slug}.html`, work, credits: `${base}/${slug}/credits.html` };
});

const fails = [], notes = [];
const fail = (s) => fails.push(s);

async function visit(page, url, width, checks) {
  const errs = [];
  const onErr = (e) => errs.push(e.message || String(e));
  const onCon = (m) => { if (m.type() === 'error') errs.push(m.text()); };
  page.on('pageerror', onErr); page.on('console', onCon);
  await page.setViewportSize({ width, height: width > 700 ? 900 : 844 });
  const r = await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'load', timeout: 30000 });
  if (!r || r.status() !== 200) fail(`${url} @${width}: HTTP ${r && r.status()}`);
  await page.waitForTimeout(400);
  const tag = `${url} @${width}`;
  for (const e of errs) if (!/net::ERR_|Failed to load resource/.test(e)) fail(`${tag}: console error: ${e.slice(0, 160)}`);
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  if (sw[0] > sw[1] + 1) fail(`${tag}: sideways scroll (${sw[0]} > ${sw[1]})`);
  const missingImg = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.loading).map((i) => i.getAttribute('src')));
  for (const s of missingImg.slice(0, 5)) fail(`${tag}: image did not load ${s}`);
  if (checks) await checks(page, tag, width);
  page.off('pageerror', onErr); page.off('console', onCon);
}

async function menuCheck(page, tag) {
  const btn = await page.$('#menu-btn');
  if (!btn) return fail(`${tag}: no #menu-btn`);
  await btn.click(); await page.waitForTimeout(250);
  const open = await page.evaluate(() => { const p = document.getElementById('menu-panel'); return p && p.classList.contains('on') && p.querySelectorAll('a').length; });
  if (!open) fail(`${tag}: menu did not open or is empty`);
  else {
    const missing = await page.evaluate((hrefs) => hrefs.filter((h) => !document.querySelector(`#menu-panel a[href="${h}"]`)), courses.map((c) => c.home));
    for (const h of missing) fail(`${tag}: menu lacks course link ${h}`);
  }
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
}

async function courseCheck(page, tag, width) {
  const r = await page.evaluate(() => {
    const bar = document.querySelector('#prev') && document.querySelector('#prev').closest('.bar');
    const b = bar && bar.getBoundingClientRect();
    return {
      sitebar: !!document.querySelector('.topbar, #site-bar, header'),
      barVisible: !!b && b.top >= 0 && b.bottom <= window.innerHeight + 1 && b.height > 0,
      docScrolls: document.scrollingElement.scrollHeight > window.innerHeight + 1,
      search: !!document.getElementById('q'),
      outline: !!document.getElementById('outline'),
      nextHref: (document.getElementById('next') || {}).getAttribute && document.getElementById('next').getAttribute('href')
    };
  });
  if (!r.sitebar) fail(`${tag}: no site bar`);
  if (!r.search) fail(`${tag}: no search box`);
  if (!r.outline) fail(`${tag}: no outline`);
  if (width <= 700) {
    if (r.docScrolls) fail(`${tag}: document scrolls on phone (only .app may scroll)`);
    if (!r.barVisible) fail(`${tag}: Prev/Next bar not within the viewport on phone`);
  }
  if (width > 700) {
    /* search returns something */
    await page.fill('#q', 'the'); await page.waitForTimeout(500);
    const n = await page.evaluate(() => document.querySelectorAll('#results a, #results li').length);
    if (!n) fail(`${tag}: search for "the" returned nothing`);
    await page.fill('#q', '');
  }
  return r;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((res) => server.listen(PORT, res));
  let browser;
  try { browser = await pw.chromium.launch(); } catch (e) {
    try { browser = await pw.chromium.launch({ channel: 'chrome' }); } catch (e2) { browser = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' }); }
  }
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  await ctx.route(BLOCK, (route) => route.abort());
  const page = await ctx.newPage();
  const shot = (name) => page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });

  for (const u of MAIN_PAGES) {
    for (const w of [1440, 390]) {
      await visit(page, u, w, async (p, tag) => { await menuCheck(p, tag); });
      if (u === '/' || u === '/study.html' || u === '/gallery.html' || FOCUS === 'main') await shot(`${u === '/' ? 'index' : u.replace(/[\/.]/g, '_').replace(/^_/, '').replace(/_html$/, '')}-${w}`);
    }
  }
  for (const [u, sel, widths] of GATED) for (const w of widths) {
    await visit(page, u, w, async (p, tag) => { if (!(await p.$(sel))) fail(`${tag}: ${sel} not present`); });
  }
  /* index hero fits */
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' }); await page.waitForTimeout(800);
  const hero = await page.evaluate(() => { const i = document.querySelector('.hero img, #hero img, img[fetchpriority="high"]'); if (!i) return null; const b = i.getBoundingClientRect(); return { w: b.width, h: b.height, fits: b.width <= innerWidth && b.height <= innerHeight }; });
  if (!hero) notes.push('index: no hero image found (hero-pool.js is build-time; expected locally)'); else if (!hero.fits) fail(`index @1440: hero ${Math.round(hero.w)}×${Math.round(hero.h)} does not fit the viewport`);

  for (const c of courses) {
    const pages = [c.home, c.work, c.credits].filter(Boolean);
    for (const u of pages) for (const w of [1440, 390]) {
      await visit(page, u, w, async (p, tag, width) => {
        const r = await courseCheck(p, tag, width);
        if (u === c.credits && r.nextHref) {
          if (width > 700) notes.push(`${c.slug} credits Next → ${r.nextHref}`);
        }
        if (width > 700) await menuCheck(p, tag);
      });
      if (FOCUS === c.slug && u === c.home && w === 1440) await shot(`${c.slug}-home-1440`);
      if (FOCUS === c.slug && u === c.work && w === 390) {
        await shot(`${c.slug}-work-390`);
        /* lightbox opens and closes */
        const img = await page.$('.slide img, #slide img'); if (img) { await img.click(); await page.waitForTimeout(300); const on = await page.evaluate(() => { const lb = document.getElementById('lb'); return lb && (lb.classList.contains('on') || lb.open || getComputedStyle(lb).display !== 'none'); }); if (!on) fail(`${u} @390: lightbox did not open`); await page.keyboard.press('Escape'); }
        /* bookmark survives reload */
        const bm = await page.$('#bm'); if (bm) { await bm.click(); await page.waitForTimeout(200); await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(400); const kept = await page.evaluate(() => { const b = document.getElementById('bm'); return b && (b.getAttribute('aria-pressed') === 'true' || /bookmarked/i.test(b.textContent) || b.classList.contains('on')); }); if (!kept) fail(`${u} @390: bookmark did not survive reload`); }
      }
    }
  }

  await browser.close(); server.close();
  console.log(`smoke: ${MAIN_PAGES.length} main pages, ${GATED.length} gated pages (logged out), ${courses.length} courses × 3 pages, at 1440 and 390 px`);
  if (notes.length) { console.log('\nNOTES'); notes.forEach((n) => console.log('  ' + n)); }
  if (fails.length) { console.log(`\nFAIL (${fails.length})`); fails.forEach((f) => console.log('  ' + f)); }
  else console.log('\nsmoke: PASS');
  console.log(`screenshots: ${path.relative(ROOT, OUT)}/`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
