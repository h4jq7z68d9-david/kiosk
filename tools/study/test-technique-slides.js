#!/usr/bin/env node
/* tools/study/test-technique-slides.js — test of the technique slide model (topen, concept, ex + lightbox).
   Usage: node tools/study/test-technique-slides.js [--keep]
   Copies the repo to a temp folder, installs the fixture in tools/study/fixtures/technique-slides/ there (images and
   credits from the Color Theory course), builds it with the real generator and checks it statically and in headless
   Chromium at phone (390), iPad portrait/landscape and desktop (1440). Nothing is written to the repo except
   screenshots in tools/site/out/ (gitignored). The fixture is never installed in the repo, linked or in the sitemap.
   Needs Playwright on NODE_PATH or in ../pw (same as tools/site/smoke.js). Exit 1 on any FAIL. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const vm = require('vm');
const { execSync, spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const FIX = path.join(__dirname, 'fixtures', 'technique-slides');
const SLUG = 'technique-slide-fixture';
const FROM = 'study/color-theory';
const OUT = path.join(REPO, 'tools', 'site', 'out');
const KEEP = process.argv.includes('--keep');
const fails = [], notes = [];
const fail = (s) => fails.push(s);
const ok = (c, s) => { if (!c) fail(s); };

/* ---------- 1. temp copy of the repo with the fixture installed ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tslides-'));
execSync(`tar --exclude=.git --exclude=tools/site/out -cf - . | tar -xf - -C ${JSON.stringify(TMP)}`, { cwd: REPO, stdio: 'pipe', maxBuffer: 1 << 30 });
const CDIR = path.join(TMP, 'study', SLUG);
fs.mkdirSync(path.join(CDIR, 'img'), { recursive: true });
fs.copyFileSync(path.join(FIX, 'data.js'), path.join(CDIR, 'data.js'));
fs.copyFileSync(path.join(FIX, 'sources.js'), path.join(CDIR, 'sources.js'));
fs.copyFileSync(path.join(FIX, 'settings.json'), path.join(TMP, 'tools/study/courses', SLUG + '.json'));
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(CDIR, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(REPO, FROM, 'credits.js'), 'utf8'), ctx);
const slides = ctx.SITE.handouts[0].slides, concept = slides.find((s) => s.type === 'concept'), ex = concept.ex;
const keys = [slides[0].img, concept.img, ex.key];
const cred = {};
for (const k of keys) { cred[k] = ctx.CREDITS[k]; fs.copyFileSync(path.join(REPO, FROM, 'img', k + '.jpg'), path.join(CDIR, 'img', k + '.jpg')); }
fs.writeFileSync(path.join(CDIR, 'credits.js'), 'window.CREDITS = ' + JSON.stringify(cred, null, 1) + ';\n');

/* ---------- 2. build with the real generator ---------- */
const b = spawnSync(process.execPath, ['tools/study/build-course.js', SLUG], { cwd: TMP, encoding: 'utf8' });
console.log((b.stdout || '').trim()); if (b.status !== 0) { console.error(b.stderr); process.exit(1); }
const HOME = `/study/${SLUG}.html`;
const CONCEPT = `/study/${SLUG}/fixture-section/fixture-concept.html`;
const CREDITS = `/study/${SLUG}/credits.html`;
const read = (u) => fs.readFileSync(path.join(TMP, u), 'utf8');

/* ---------- 3. static checks ---------- */
{
  const home = read(HOME), con = read(CONCEPT), cr = read(CREDITS);
  ok(home.includes('Fixture opening slide') && home.includes('class="htitle"'), 'home is the topen slide');
  ok(!/data-lightbox|lightbox\.(css|js)/.test(home), 'home (no ex) must not load the lightbox');
  ok((con.match(/class="ex"/g) || []).length === 1, 'concept page has one example block');
  ok(/lightbox\.css\?v=\d+/.test(con) && /lightbox\.js\?v=\d+/.test(con), 'concept page loads lightbox.css and lightbox.js');
  ok(!/<img[^>]+src="[^"]*\/img\/vangogh-night-cafe\.jpg"/.test(con), 'full example image must not be an <img src> on the page');
  ok(/<img src="[^"]*\/img\/thumb\/vangogh-night-cafe\.jpg"[^>]*loading="lazy"/.test(con), 'thumbnail is lazy and from img/thumb/');
  const eyebrow = (con.match(/<p class="eyebrow">([^<]*)<\/p>/) || [])[1] || '';
  ok(!/theme|concept/i.test(eyebrow), `concept eyebrow must not say Theme/Concept (got "${eyebrow}")`);
  ok(!/>\s*(Theme|Concept|Statement|Example|Definition)\s*</.test(con.replace(/<script[\s\S]*?<\/script>/g, '')), 'no visible field labels besides "Look at"');
  for (const k of keys) ok(cr.includes(cred[k].file), `credits page lists ${k}`);
  ok(fs.existsSync(path.join(CDIR, 'img/thumb', ex.key + '.jpg')), 'thumbnail file written');
  const si = read('/study/search-index.js');
  const sctx = { window: {} }; vm.createContext(sctx); vm.runInContext(si, sctx);
  const S = sctx.window.STUDY_SEARCH, ci = S.courses.findIndex((c) => c.slug === SLUG);
  const row = S.items.find((r) => r[0] === ci && r[3] === ex.title && r[4] === ex.artist);
  ok(ci >= 0 && S.courses[ci].name === 'Technique Slide Fixture', 'search index names the course');
  ok(row && row[1] === CONCEPT, 'search index has the example (artist + title) pointing at its concept page');
  const sm = read('/sitemap.xml');
  ok(sm.includes(SLUG), '(temp copy) sitemap block written by the build');   // only in the temp copy
  ok(!fs.readFileSync(path.join(REPO, 'sitemap.xml'), 'utf8').includes(SLUG), 'repo sitemap.xml must not mention the fixture');
  ok(!fs.existsSync(path.join(REPO, 'study', SLUG)), 'repo must not contain the fixture course');
}

/* ---------- 4. browser checks ---------- */
let pw;
try { pw = require('playwright'); } catch (e) { pw = require(path.join(REPO, '..', 'pw', 'node_modules', 'playwright')); }
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', jpg: 'image/jpeg', png: 'image/png', xml: 'application/xml', json: 'application/json', svg: 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(TMP, p);
  if (!f.startsWith(TMP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).slice(1)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const PORT = 8742, BASE = `http://localhost:${PORT}`;
const BLOCK = /googletagmanager|google-analytics|doubleclick/;
const DEVICES = [
  { name: 'phone-390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, thumb: 110 },
  { name: 'ipad-portrait-820', viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, thumb: 140 },
  { name: 'ipad-landscape-1180', viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, thumb: 140 },
  { name: 'desktop-1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1, thumb: 140 },
];

async function load(page, url, tag, errs) {
  const r = await page.goto(BASE + url, { waitUntil: 'load' });
  ok(r && r.status() === 200, `${tag}: HTTP ${r && r.status()}`);
  await page.waitForTimeout(300);
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  ok(sw[0] <= sw[1] + 1, `${tag}: sideways scroll (${sw[0]} > ${sw[1]})`);
  /* load every image (lazy ones too) and count the broken ones */
  const broken = await page.evaluate(async () => {
    const ims = [...document.images]; ims.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(ims.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 5000); }))));
    return ims.filter((i) => i.getAttribute('src') && i.naturalWidth === 0).map((i) => i.getAttribute('src'));
  });
  broken.forEach((s) => fail(`${tag}: broken image ${s}`));
  return errs;
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  let browser;
  try { browser = await pw.chromium.launch(); } catch (e) { browser = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' }); }
  fs.mkdirSync(OUT, { recursive: true });
  for (const dev of DEVICES) {
    const context = await browser.newContext({ viewport: dev.viewport, isMobile: dev.isMobile, hasTouch: dev.hasTouch, deviceScaleFactor: dev.deviceScaleFactor });
    await context.route(BLOCK, (r) => r.abort());
    const page = await context.newPage();
    const errs = [], reqs = [];
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('request', (r) => reqs.push(r.url()));
    const T = (s) => `${dev.name} ${s}`;

    for (const u of [HOME, CREDITS]) { await load(page, u, T(u), errs); }
    await page.goto(BASE + HOME, { waitUntil: 'load' }); await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, `fixture-topen-${dev.name}.png`) });

    /* concept page, lazy thumbnail: full image must not be requested before the lightbox opens */
    reqs.length = 0;
    await page.goto(BASE + CONCEPT, { waitUntil: 'load' }); await page.waitForTimeout(400);
    const fullUrl = `/study/${SLUG}/img/${ex.key}.jpg`;
    ok(!reqs.some((u) => u.endsWith(fullUrl)), T('full example image requested before the lightbox opened'));
    await page.screenshot({ path: path.join(OUT, `fixture-concept-${dev.name}.png`) });
    const thumbW = await page.$eval('.ex-th', (b) => Math.round(b.getBoundingClientRect().width));
    ok(Math.abs(thumbW - dev.thumb) <= 2, T(`thumbnail ${thumbW}px wide, want ~${dev.thumb}`));
    /* layout: image beside text on wide screens, stacked on phones */
    const lay = await page.evaluate(() => { const p = document.querySelector('.slide > .pic').getBoundingClientRect(), n = document.querySelector('.slide > .notes').getBoundingClientRect(); return { side: n.left >= p.right - 1, stacked: n.top >= p.bottom - 1 }; });
    if (dev.viewport.width <= 900) ok(lay.stacked, T('phone/portrait: image should stack above the text')); else ok(lay.side, T('desktop: image left, text right'));

    const isOpen = () => page.evaluate(() => { const d = document.querySelector('.dlb'); return !!d && !d.hidden && getComputedStyle(d).display !== 'none'; });
    const openBy = async (how) => {
      await page.$eval('.ex-th', (b) => b.scrollIntoView({ block: 'center' }));
      if (how === 'tap') await page.tap('.ex-th'); else if (how === 'click') await page.click('.ex-th');
      else { await page.focus('.ex-th'); await page.keyboard.press(how); }
      await page.waitForTimeout(250);
    };
    const how = dev.hasTouch ? 'tap' : 'click';

    /* open by click/tap: dialog, focus, full image loads, capped at natural size and viewport, caption */
    const scroller = dev.viewport.width <= 900 ? '.app' : '.notes';
    await openBy(how);
    ok(await isOpen(), T(`lightbox did not open by ${how}`));
    const before = await page.$eval(scroller, (s) => s.scrollTop);
    const st = await page.evaluate(async () => {
      const d = document.querySelector('.dlb'), im = d.querySelector('.dlb-img');
      if (!im.complete) await new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 5000); });
      const r = im.getBoundingClientRect();
      return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), focusIn: d.contains(document.activeElement), nat: [im.naturalWidth, im.naturalHeight], box: [r.width, r.height, r.left, r.top, r.right, r.bottom], vw: innerWidth, vh: innerHeight,
        det: d.querySelector('.dlb-det').textContent, cr: d.querySelector('.dlb-cr').textContent, htmlLocked: getComputedStyle(document.documentElement).overflow === 'hidden' };
    });
    ok(st.role === 'dialog' && st.modal === 'true', T('lightbox is not an aria-modal dialog'));
    ok(st.focusIn, T('focus did not move into the lightbox'));
    ok(st.nat[0] > 0, T('full image did not load in the lightbox'));
    ok(st.box[0] <= st.nat[0] + 1 && st.box[1] <= st.nat[1] + 1, T('lightbox image larger than its natural size'));
    ok(st.box[2] >= -1 && st.box[3] >= -1 && st.box[4] <= st.vw + 1 && st.box[5] <= st.vh + 1, T('lightbox image outside the viewport'));
    ok(st.det === ex.det && st.cr.length > 0, T('lightbox caption lacks det or credit'));
    ok(st.htmlLocked, T('page behind not locked'));
    ok(reqs.some((u) => u.endsWith(fullUrl)), T('full image not requested on open'));
    /* page behind does not scroll; arrow keys do not change page */
    await page.mouse.wheel(0, 600); await page.waitForTimeout(150);
    ok((await page.$eval(scroller, (s) => s.scrollTop)) === before, T('page behind scrolled while the lightbox was open'));
    const url0 = page.url();
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
    ok(page.url() === url0, T('ArrowRight navigated away while the lightbox was open'));
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    ok(await page.evaluate(() => document.querySelector('.dlb').contains(document.activeElement)), T('Tab left the lightbox'));
    await page.screenshot({ path: path.join(OUT, `fixture-lightbox-${dev.name}.png`) });
    /* Esc closes, focus returns */
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    ok(!(await isOpen()), T('Esc did not close'));
    ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('ex-th')), T('focus did not return to the thumbnail after Esc'));
    /* close button */
    await openBy(how); ok(await isOpen(), T('reopen failed'));
    if (dev.hasTouch) await page.tap('.dlb-x'); else await page.click('.dlb-x');
    await page.waitForTimeout(150); ok(!(await isOpen()), T('Close button did not close'));
    /* click / tap outside the image */
    await openBy(how);
    if (dev.hasTouch) await page.touchscreen.tap(8, dev.viewport.height - 8); else await page.mouse.click(8, dev.viewport.height - 8);
    await page.waitForTimeout(150); ok(!(await isOpen()), T(`${how} outside the image did not close`));
    /* click / tap on the image does not close */
    await openBy(how);
    if (dev.hasTouch) await page.tap('.dlb-img'); else await page.click('.dlb-img');
    await page.waitForTimeout(150); ok(await isOpen(), T(`${how} on the image closed the lightbox`));
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    /* keyboard: Enter and Space on the thumbnail */
    for (const k of ['Enter', ' ']) {
      await openBy(k); ok(await isOpen(), T(`${k === ' ' ? 'Space' : k} on the thumbnail did not open`));
      await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      ok(!(await isOpen()), T('Esc after keyboard open did not close'));
    }
    ok(!(await page.evaluate(() => document.documentElement.classList.contains('dlb-open'))), T('scroll lock left on after close'));
    await load(page, CONCEPT, T(CONCEPT), errs);

    const real = errs.filter((e) => !/net::ERR_|Failed to load resource/.test(e));
    real.forEach((e) => fail(T(`console error: ${e.slice(0, 160)}`)));
    notes.push(`${dev.name}: ${real.length} console errors (${errs.length - real.length} failed-request messages from the blocked analytics script ignored, as smoke.js does)`);
    if (process.argv.includes('--verbose')) errs.forEach((e) => notes.push('   ' + e.slice(0, 160)));
    await context.close();
  }
  await browser.close(); server.close();
  if (!KEEP) fs.rmSync(TMP, { recursive: true, force: true }); else notes.push('temp copy kept: ' + TMP);
  notes.forEach((n) => console.log('  ' + n));
  if (fails.length) { console.log(`\nFAIL (${fails.length})`); fails.forEach((f) => console.log('  ' + f)); process.exit(1); }
  console.log(`\ntechnique slides: PASS (${DEVICES.length} viewports; screenshots in tools/site/out/fixture-*.png)`);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
