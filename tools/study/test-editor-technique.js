#!/usr/bin/env node
/* tools/study/test-editor-technique.js — slide editor test for the technique slide model (topen, concept, ex).
   Usage: node tools/study/test-editor-technique.js [--keep]
   Copies the repo to a temp folder, installs and registers the fixture (tools/study/fixtures/technique-slides/) there,
   starts the real editor (edit-server.js --no-send) on it and, in headless Chromium:
     - edits every editable field of the topen and concept pages, saves, and checks the data file and rebuilt pages;
     - checks that saving is blocked (in the page and by the server) for an empty required field and for
       Look-at counts outside 2–4, and that nothing is written then;
     - loads the edited pages with the editor at phone, iPad and desktop sizes: 0 console errors.
   Nothing in the repo is changed. Needs Playwright on NODE_PATH or in ../pw. Exit 1 on any FAIL. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execSync, spawn, spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const FIX = path.join(__dirname, 'fixtures', 'technique-slides');
const SLUG = 'technique-slide-fixture', PORT = 8775, BASE = `http://localhost:${PORT}`;
const KEEP = process.argv.includes('--keep');
const fails = [];
const ok = (c, s) => { if (!c) fails.push(s); };

/* ---------- temp copy with the fixture installed and registered ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tedit-'));
execSync(`tar --exclude=.git --exclude=tools/site/out -cf - . | tar -xf - -C ${JSON.stringify(TMP)}`, { cwd: REPO, stdio: 'pipe', maxBuffer: 1 << 30 });
const CDIR = path.join(TMP, 'study', SLUG), DATA = path.join(CDIR, 'data.js');
fs.mkdirSync(path.join(CDIR, 'img'), { recursive: true });
fs.copyFileSync(path.join(FIX, 'data.js'), DATA);
fs.copyFileSync(path.join(FIX, 'sources.js'), path.join(CDIR, 'sources.js'));
fs.copyFileSync(path.join(FIX, 'settings.json'), path.join(TMP, 'tools/study/courses', SLUG + '.json'));
const loadData = () => { const c = {}; c.window = c; vm.createContext(c); vm.runInContext(fs.readFileSync(DATA, 'utf8'), c); return JSON.parse(JSON.stringify(c.SITE)); };
const site0 = loadData(), sl0 = site0.handouts[0].slides;
const keys = [sl0[0].img, sl0[1].img, sl0[1].ex.key];
const cc = {}; cc.window = cc; vm.createContext(cc); vm.runInContext(fs.readFileSync(path.join(FIX, 'credits.js'), 'utf8'), cc);
const cred = {}; for (const k of keys) { if (!fs.existsSync(path.join(FIX, 'img', k + '.jpg'))) { console.error(`fixture image missing: tools/study/fixtures/technique-slides/img/${k}.jpg`); process.exit(1); }
  cred[k] = cc.CREDITS[k]; fs.copyFileSync(path.join(FIX, 'img', k + '.jpg'), path.join(CDIR, 'img', k + '.jpg')); }
fs.writeFileSync(path.join(CDIR, 'credits.js'), 'window.CREDITS = ' + JSON.stringify(cred, null, 1) + ';\n');
const reg = JSON.parse(fs.readFileSync(path.join(TMP, 'tools/study/courses.json'), 'utf8'));
reg.courses.push({ slug: SLUG, lane: 'technique', name: 'Technique Slide Fixture', label: 'technique slide fixture', card: { img: keys[0], text: 'test fixture' } });
fs.writeFileSync(path.join(TMP, 'tools/study/courses.json'), JSON.stringify(reg, null, 1) + '\n');
const sh = (args) => { const r = spawnSync(process.execPath, args, { cwd: TMP, encoding: 'utf8' }); if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); } return r.stdout; };
sh(['tools/study/build-registry.js']);
for (const f of fs.readdirSync(path.join(TMP, 'tools/study/courses'))) sh(['tools/study/build-course.js', f.slice(0, -5)]);

/* ---------- editor server ---------- */
const srv = spawn(process.execPath, ['tools/study/edit-server.js', SLUG, '--port', String(PORT), '--no-send'], { cwd: TMP, stdio: ['ignore', 'pipe', 'pipe'] });
let srvOut = ''; srv.stdout.on('data', (d) => { srvOut += d; }); srv.stderr.on('data', (d) => { srvOut += d; });
const until = async (fn, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 200)); } return false; };

let pw;
try { pw = require('playwright'); } catch (e) { pw = require(path.join(REPO, '..', 'pw', 'node_modules', 'playwright')); }

const NEW = {
  topen: { title: 'Edited opening title', para: 'Edited history line for the opening slide.' },
  concept: {
    title: 'Edited concept', stmt: 'Edited one-sentence definition.',
    look: ['Edited bullet one.', 'Edited bullet two.', 'Edited bullet three.', 'Added bullet four.'],
    'ex.artist': 'Edited Artist', 'ex.title': 'Edited Example Title', 'ex.date': '1889', 'ex.line': 'Edited example line.',
    'ex.det': 'Oil on canvas · 10 × 12 in. · Edited Museum', 'ex.alt': 'Edited alt text for the example painting', bul: 'Edited closing line.',
  },
};

(async () => {
  ok(await until(() => /Slide editor for/.test(srvOut)), 'editor server did not start: ' + srvOut);
  let browser;
  try { browser = await pw.chromium.launch(); } catch (e) { browser = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome' }); }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = []; let step = 'start'; page.on('pageerror', (e) => errs.push(`[${step}] ${e.message}`)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(`[${step}] ${m.text()}`); });
  page.on('dialog', (d) => d.accept());
  const msgText = () => page.$eval('.ed-msg', (e) => e.textContent);
  const startEdit = async (url) => { await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForSelector('.ed-edit:not([disabled])'); await page.click('.ed-edit'); await page.waitForSelector('.ed-on'); };
  /* set a field's text the way typing does (textContent + input event); lists: one value per item */
  const setField = (label, value) => page.evaluate(([label, value]) => {
    const els = [...document.querySelectorAll(`.ed-field[data-ed-label="${label}"]`)];
    if (!els.length) return false;
    if (Array.isArray(value)) {
      const ul = els[0].closest('ul');
      while (ul.querySelectorAll('.ed-t').length < value.length) { ul.nextElementSibling.click(); }
      while (ul.querySelectorAll('.ed-t').length > value.length) ul.lastElementChild.remove();
      [...ul.querySelectorAll('.ed-t')].forEach((t, i) => { t.textContent = value[i]; t.dispatchEvent(new Event('input', { bubbles: true })); });
    } else { els[0].textContent = value; els[0].dispatchEvent(new Event('input', { bubbles: true })); }
    return true;
  }, [label, value]);
  const fields = async () => (await (await page.request.get(BASE + '/__edit/api/slide?id=' + await page.$eval('body', (b) => b.dataset.id))).json());
  const saveAndWait = async () => { await Promise.all([page.waitForEvent('load', { timeout: 60000 }), page.click('.ed-save')]); await page.waitForSelector('.ed-edit:not([disabled])'); return msgText(); };

  /* ---- topen ---- */
  step = 'topen';
  const HOME = `/study/${SLUG}.html`;
  await startEdit(HOME);
  let F = await fields();
  ok(F.kind === 'topen', `topen page kind is ${F.kind}`);
  ok(JSON.stringify(F.fields.map((f) => f.key)) === JSON.stringify(['section', 'title', 'para']), 'topen fields: ' + F.fields.map((f) => f.key));
  /* one real keyboard edit, then the rest */
  await page.click('.ed-field[data-ed-label="Title"]'); await page.keyboard.press('End'); await page.keyboard.type(' X');
  for (const [k, v] of Object.entries(NEW.topen)) ok(await setField(F.fields.find((f) => f.key === k).label, v), `topen: no field on page for ${k}`);
  let m = await saveAndWait();
  ok(/Build and check\.js passed/.test(m), 'topen save: ' + m);
  let d = loadData().handouts[0].slides[0];
  ok(d.title === NEW.topen.title && d.para === NEW.topen.para, 'topen data not written: ' + JSON.stringify(d));
  ok(d.img === sl0[0].img && d.alt === sl0[0].alt && d.credit === sl0[0].credit, 'topen image fields changed');
  ok((await page.content()).includes(NEW.topen.title), 'topen page not rebuilt with the new title');

  /* ---- concept: blocked saves first ---- */
  step = 'blocked';
  const CONCEPT = `/study/${SLUG}/fixture-section/fixture-concept.html`;
  const before = fs.readFileSync(DATA, 'utf8');
  await startEdit(CONCEPT);
  F = await fields();
  ok(F.kind === 'concept', `concept page kind is ${F.kind}`);
  const want = ['section', 'title', 'stmt', 'look', 'ex.artist', 'ex.title', 'ex.date', 'ex.line', 'ex.det', 'ex.alt', 'bul'];
  ok(JSON.stringify(F.fields.map((f) => f.key)) === JSON.stringify(want), 'concept fields: ' + F.fields.map((f) => f.key));
  const L = (k) => F.fields.find((f) => f.key === k).label;
  for (const [what, k, v] of [['empty title', 'title', ''], ['empty example artist', 'ex.artist', ''], ['empty details line', 'ex.det', ''], ['1 Look-at bullet', 'look', ['Only one.']], ['5 Look-at bullets', 'look', ['a', 'b', 'c', 'd', 'e']]]) {
    await page.goto(BASE + CONCEPT, { waitUntil: 'load' }); await page.waitForSelector('.ed-edit:not([disabled])'); await page.click('.ed-edit');
    await setField(L(k), v); await page.click('.ed-save'); await page.waitForTimeout(300);
    const t = await msgText();
    ok(/Not saved/.test(t), `${what}: save not blocked in the page (${t.slice(0, 120)})`);
    ok(fs.readFileSync(DATA, 'utf8') === before, `${what}: data file changed`);
    /* the server enforces it too */
    const r = await (await page.request.post(BASE + '/__edit/api/save', { headers: { 'X-Edit': '1', 'Content-Type': 'application/json' }, data: { id: F.id || (await page.$eval('body', (b) => b.dataset.id)), rev: F.rev, values: { [k]: v } } })).json();
    ok(r.ok === false && /Nothing was saved/.test(r.error || ''), `${what}: server accepted it (${JSON.stringify(r).slice(0, 160)})`);
    ok(fs.readFileSync(DATA, 'utf8') === before, `${what}: data file changed by the server`);
  }

  /* ---- concept: edit every field and save ---- */
  step = 'concept';
  await startEdit(CONCEPT);
  for (const [k, v] of Object.entries(NEW.concept)) ok(await setField(L(k), v), `concept: no field on page for ${k}`);
  m = await saveAndWait();
  ok(/Build and check\.js passed/.test(m), 'concept save: ' + m);
  ok(/edited-concept\.html$/.test(page.url()), 'editor did not follow the renamed page: ' + page.url());
  d = loadData().handouts[0].slides[1];
  const ex0 = sl0[1].ex;
  ok(d.title === NEW.concept.title && d.stmt === NEW.concept.stmt && JSON.stringify(d.look) === JSON.stringify(NEW.concept.look) && d.bul === NEW.concept.bul, 'concept data not written: ' + JSON.stringify(d));
  for (const k of ['artist', 'title', 'date', 'line', 'det', 'alt']) ok(d.ex[k] === NEW.concept['ex.' + k], `ex.${k} not written: ${d.ex[k]}`);
  ok(d.img === sl0[1].img && d.alt === sl0[1].alt && d.ex.key === ex0.key, 'concept image fields changed');
  const html = await page.content();
  for (const v of ['Edited concept', 'Edited one-sentence definition.', 'Added bullet four.', 'Edited Artist', 'Edited Example Title', 'Edited example line.', 'Edited closing line.']) ok(html.includes(v), `rebuilt page lacks "${v}"`);
  ok(html.includes('data-det="Oil on canvas · 10 × 12 in. · Edited Museum"') && html.includes('alt="Edited alt text for the example painting"'), 'rebuilt page lacks edited det/alt');
  /* the file keeps its layout: only the edited values changed (single quotes, comments kept) */
  const after = fs.readFileSync(DATA, 'utf8');
  ok(after.includes('TEST FIXTURE ONLY') && /title: 'Edited concept'/.test(after), 'data file layout or quote style changed');
  const tsv = fs.readFileSync(path.join(CDIR, 'retired-urls.tsv'), 'utf8');
  ok(!tsv.includes('fixture-concept'), 'unpublished renamed page should not get a redirect');
  /* a one-item bul list in the file stays a list */
  {
    const E = require(path.join(TMP, 'tools/study/editor/source-edit.js'));
    const src = fs.readFileSync(DATA, 'utf8').replace(`bul: 'Edited closing line.'`, `bul: ['One-line list.']`);
    const files = [{ name: 'data.js', role: 'data', src }, { name: 's.json', role: 'settings', src: '{}' }];
    const id = (await page.$eval('body', (b) => b.dataset.id));
    const pf = E.pageFields(files, id);
    ok(pf.fields.find((f) => f.key === 'bul').value === 'One-line list.', 'bul list not read as one line');
    const p = E.patch(files, id, { bul: 'Changed.' }); E.verify(files, p);
    ok(/bul: \['Changed\.'\]/.test(p.files[0].src), 'bul list not kept as a list');
  }

  /* ---- edited pages with the editor loaded: phone, iPad, desktop ---- */
  const concept2 = new URL(page.url()).pathname;
  for (const vp of [{ width: 390, height: 844, mobile: true }, { width: 820, height: 1180, mobile: true }, { width: 1440, height: 900, mobile: false }]) {
    const c2 = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
    await c2.route(/googletagmanager|google-analytics/, (r) => r.abort());
    const p2 = await c2.newPage(); const e2 = [];
    p2.on('pageerror', (e) => e2.push(e.message)); p2.on('console', (x) => { if (x.type() === 'error' && !/Failed to load resource/.test(x.text())) e2.push(x.text()); });
    for (const u of [HOME, concept2]) {
      await p2.goto(BASE + u, { waitUntil: 'load' }); await p2.waitForSelector('.ed-edit:not([disabled])');
      await p2.click('.ed-edit'); await p2.waitForTimeout(200);
      const sw = await p2.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      ok(sw[0] <= sw[1] + 1, `${vp.width}px ${u}: sideways scroll in edit mode`);
      if (u === concept2) await p2.screenshot({ path: path.join(REPO, 'tools/site/out', `editor-concept-${vp.width}.png`), fullPage: false });
      await p2.click('.ed-cancel'); await p2.waitForTimeout(300);
    }
    e2.forEach((e) => fails.push(`${vp.width}px: console error: ${e.slice(0, 160)}`));
    console.log(`  ${vp.width}px: ${e2.length} console errors`);
    await c2.close();
  }
  errs.forEach((e) => fails.push(`editing session: console error: ${e.slice(0, 160)}`));
  await browser.close();
  srv.kill('SIGTERM');
  if (!KEEP) fs.rmSync(TMP, { recursive: true, force: true }); else console.log('  temp copy kept: ' + TMP);
  if (fails.length) { console.log(`\nFAIL (${fails.length})`); fails.forEach((f) => console.log('  ' + f)); process.exit(1); }
  console.log('\neditor (technique slides): PASS');
})().catch((e) => { console.error(e); srv.kill('SIGTERM'); process.exit(2); });
