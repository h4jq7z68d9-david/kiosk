#!/usr/bin/env node
/* tools/site/check.js — static check of the public site and every study course.
   Usage: node tools/site/check.js            (whole site)
          node tools/site/check.js <slug>     (whole site, plus a detailed report for one course)
   Exit 1 on any ERROR; WARNs do not fail the run.
   Study-site-builder §9.6 is this file. Add a check here rather than doing it by hand. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const ORIGIN = 'https://davidnicholsonart.com';
const FOCUS = process.argv[2] || null;

/* Pages that are tools or legacy and are not held to the public-page rules. */
const SKIP_PAGES = new Set(['admin.html', 'kiosk.html', 'booth.html', 'expenses-jill-nicholson.html', 'shop.html']);
/* Shared assets whose ?v= must match the generator's V object. */
const VERSIONED = { 'site-tokens.css': 'tokens', 'site-chrome.js': 'chrome', 'site-chrome.css': 'chrome', 'site-bar.js': 'bar', 'site-bar.css': 'bar', 'guide.css': 'guideCss', 'guide.js': 'guideJs', 'search.js': 'search' };
const BANNED = [/\bweek \d+\b/i, /free study guide/i, /\bwritten by\b/i, /\bcomprised\b/i];
const BANNED_BODY = [/\bART ?\d{3}\b/];   // course codes: banned on pages, allowed in the sources bibliography
/* Files written by the deploy workflow (generate-prints.js), not in the repo. */
const BUILD_TIME = new Set(['/hero-pool.js']);
const MAX_EDGE = 1600;

const errors = [], warns = [];
const err = (s) => errors.push(s);
const warn = (s) => warns.push(s);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/* ---------- collect pages ---------- */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git', 'prints', 'receipts', 'tools', 'pigment-fit'].includes(e.name)) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const pages = walk(ROOT).filter((f) => !SKIP_PAGES.has(rel(f)));
const html = new Map(pages.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const isNoindex = (h) => /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(h);
const urlOf = (f) => { const r = rel(f); return ORIGIN + '/' + (r === 'index.html' ? '' : r); };

/* ---------- generator versions ---------- */
let V = null;
try {
  const src = fs.readFileSync(path.join(ROOT, 'tools/study/build-course.js'), 'utf8');
  const m = src.match(/const V = (\{[^}]*\})/);
  V = m && Function('return ' + m[1])();
} catch (e) { /* reported below */ }
if (!V) err('build-course.js: could not read the V version object');

/* ---------- per-page checks ---------- */
const titles = new Map(), canonicals = new Map();
const attr = (tag, name) => { const m = tag.match(new RegExp(name + '=["\']([^"\']*)["\']', 'i')); return m ? m[1] : null; };
for (const [f, h] of html) {
  const r = rel(f);
  const dir = path.dirname(f);
  /* local src/href resolve (markup only; script bodies hold template strings) */
  const markup = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const m of markup.matchAll(/<(?:img|script|link|a|source)\b[^>]*?\s(?:src|href)=["']([^"']+)["']/gi)) {
    let u = m[1].trim();
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(u) || u === '') continue;
    u = u.split(/[?#]/)[0];
    if (!u || BUILD_TIME.has(u)) continue;
    const target = u.startsWith('/') ? path.join(ROOT, u) : path.join(dir, u);
    if (!fs.existsSync(target)) err(`${r}: broken local reference ${m[1]}`);
  }
  /* versioned shared assets */
  if (V) for (const m of h.matchAll(/\/(site-tokens\.css|site-chrome\.js|site-chrome\.css|site-bar\.js|site-bar\.css|guide\.css|guide\.js|search\.js)\?v=(\d+)/g)) {
    const want = V[VERSIONED[m[1]]];
    if (want != null && Number(m[2]) !== want) err(`${r}: ${m[1]}?v=${m[2]} but build-course.js V says ${want}`);
  }
  /* JSON-LD parses */
  for (const m of h.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch (e) { err(`${r}: JSON-LD does not parse (${e.message})`); }
  }
  if (isNoindex(h)) continue;
  /* SEO fields on indexable pages */
  const title = (h.match(/<title>([^<]*)<\/title>/i) || [])[1];
  const canon = (h.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [])[0];
  const canonHref = canon && attr(canon, 'href');
  const desc = (h.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [])[0];
  const ogt = /<meta[^>]+property=["']og:title["']/i.test(h);
  const ogi = /<meta[^>]+property=["']og:image["']/i.test(h);
  if (!title) err(`${r}: no <title>`);
  if (!canonHref) err(`${r}: no canonical`);
  if (!desc || !attr(desc, 'content')) err(`${r}: no meta description`);
  if (!ogt) err(`${r}: no og:title`);
  if (!ogi) err(`${r}: no og:image`);
  if (title) { if (titles.has(title)) err(`${r}: <title> duplicates ${titles.get(title)}: "${title}"`); else titles.set(title, r); }
  if (canonHref) {
    if (canonicals.has(canonHref)) err(`${r}: canonical duplicates ${canonicals.get(canonHref)}`); else canonicals.set(canonHref, r);
    if (canonHref !== urlOf(f)) warn(`${r}: canonical ${canonHref} is not this page's URL ${urlOf(f)}`);
  }
  /* banned phrases, study pages only */
  if (r.startsWith('study/')) {
    const text = h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
    for (const re of BANNED) { const m = text.match(re); if (m) err(`${r}: banned phrase "${m[0]}"`); }
    if (!r.endsWith('/sources.html')) for (const re of BANNED_BODY) { const m = text.match(re); if (m) err(`${r}: course code "${m[0]}" on a page`); }
  }
}

/* ---------- sitemap ---------- */
{
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const seen = new Set();
  for (const u of locs) {
    if (seen.has(u)) err(`sitemap.xml: duplicate URL ${u}`); seen.add(u);
    if (!u.startsWith(ORIGIN + '/')) { err(`sitemap.xml: foreign URL ${u}`); continue; }
    let p = u.slice(ORIGIN.length + 1); if (p === '') p = 'index.html';
    if (!fs.existsSync(path.join(ROOT, p))) err(`sitemap.xml: ${u} has no file`);
    const f = path.join(ROOT, p);
    if (html.has(f) && isNoindex(html.get(f))) err(`sitemap.xml: ${u} is noindex`);
  }
  for (const [f, h] of html) {
    if (isNoindex(h)) continue;
    if (!seen.has(urlOf(f))) err(`${rel(f)}: indexable but not in sitemap.xml`);
  }
}

/* ---------- courses ---------- */
function jpegSize(file) {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1]; const len = b.readUInt16BE(i + 2);
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}
const chrome = fs.readFileSync(path.join(ROOT, 'site-chrome.js'), 'utf8');
const studyHtml = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
const courseDir = path.join(ROOT, 'tools/study/courses');
const courses = fs.readdirSync(courseDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const report = {};
for (const slug of courses) {
  const cfg = JSON.parse(fs.readFileSync(path.join(courseDir, slug + '.json'), 'utf8'));
  const base = (cfg.basePath || '/study/art-history').replace(/\/$/, '');
  const course = base + '/' + slug;
  const dir = path.join(ROOT, course);
  const imgDir = path.join(ROOT, base, cfg.imgFrom || slug, 'img');
  const tag = `course ${slug}`;
  if (!fs.existsSync(path.join(ROOT, course + '.html'))) { err(`${tag}: not built (${course}.html missing)`); continue; }
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  try {
    for (const f of [...cfg.dataFiles, 'credits.js', 'sources.js']) {
      const file = path.join(dir, f);
      if (f === 'sources.js' && !fs.existsSync(file)) { warn(`${tag}: no sources.js`); continue; }
      vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: f });
    }
  } catch (e) { err(`${tag}: data file failed to load: ${e.message}`); continue; }
  const S = ctx.SITE, C = ctx.CREDITS || {};
  if (!S || !S.handouts) { err(`${tag}: SITE.handouts missing`); continue; }
  const keys = new Set();
  let works = 0, looks = 0;
  for (const p of S.handouts) {
    if (p.overview && p.overview.img) keys.add(p.overview.img);
    for (const s of p.slides || []) {
      if (s.type === 'work') { works++; keys.add(s.key); if (s.look) { looks++; if (s.look.length !== 3) err(`${tag}: "${s.title}" has ${s.look.length} Look-at bullets, needs 3`); } if (!s.lead && !s.sum) warn(`${tag}: "${s.title}" has no lead`); }
      if (s.type === 'theme' && s.img) keys.add(s.img);
    }
  }
  if (cfg.introImg) keys.add(cfg.introImg);
  for (const k of keys) {
    if (!C[k]) err(`${tag}: image key "${k}" has no credits entry`);
    if (!fs.existsSync(path.join(imgDir, k + '.jpg'))) err(`${tag}: image key "${k}" has no img/${k}.jpg`);
  }
  for (const k of Object.keys(C)) if (!keys.has(k) && !cfg.imgFrom) warn(`${tag}: credits entry "${k}" is not used by any slide`);
  let big = 0, files = 0, bytes = 0;
  if (fs.existsSync(imgDir) && !cfg.imgFrom) for (const f of fs.readdirSync(imgDir)) {
    if (!f.endsWith('.jpg')) { warn(`${tag}: img/${f} is not a .jpg`); continue; }
    files++; bytes += fs.statSync(path.join(imgDir, f)).size;
    const k = f.slice(0, -4);
    if (!C[k]) warn(`${tag}: img/${f} has no credits entry (unused file)`);
    const d = jpegSize(path.join(imgDir, f));
    if (!d) { err(`${tag}: img/${f} is not a readable JPEG`); continue; }
    if (Math.max(d.w, d.h) > MAX_EDGE) { big++; (keys.has(k) ? err : warn)(`${tag}: img/${f} is ${d.w}×${d.h}, over ${MAX_EDGE} px${keys.has(k) ? '' : ' (unused)'}`); }
  }
  if (!chrome.includes(`'${course}.html'`)) err(`${tag}: not in the STUDY array of site-chrome.js`);
  if (!studyHtml.includes(course + '.html')) err(`${tag}: not linked from study.html`);
  for (const f of ['sources.html', 'credits.html']) if (!fs.existsSync(path.join(dir, f))) err(`${tag}: ${f} missing`);
  const built = fs.existsSync(dir) ? walk(dir).length + 1 : 0;
  report[slug] = { pages: built, works, looks, images: files, mb: +(bytes / 1048576).toFixed(1), parts: S.handouts.length };
}

/* ---------- admin service worker: deploy.yml stamps CACHE from a content hash; here just sanity ---------- */
{
  const { execSync } = require('child_process');
  const sw = fs.readFileSync(path.join(ROOT, 'admin-sw.js'), 'utf8');
  const cache = (sw.match(/const CACHE = '(dna-admin-[0-9a-z]+)'/) || [])[1];
  if (!cache) err("admin-sw.js: CACHE must be a 'dna-admin-…' string (deploy.yml rewrites it)");
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
  if (!/sed -i "s\/dna-admin-\[0-9a-z\]\*\/dna-admin-\$H\/g" admin-sw\.js/.test(wf)) err('deploy.yml: the admin-sw cache stamp step is missing or changed');
  for (const f of ['index.mjs', 'admin-sw.js']) { try { execSync(`node --check ${f}`, { cwd: ROOT, stdio: 'pipe' }); } catch (e) { err(`${f}: node --check failed`); } }
}

/* ---------- output ---------- */
const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ');
if (FOCUS) { if (report[FOCUS]) console.log(`${FOCUS}: ${fmt(report[FOCUS])}`); else err(`no course "${FOCUS}" in tools/study/courses/`); }
else for (const [s, o] of Object.entries(report)) console.log(`${s}: ${fmt(o)}`);
console.log(`\n${pages.length} pages checked, ${courses.length} courses`);
if (errors.length) { console.log(`\nERRORS (${errors.length})`); errors.forEach((e) => console.log('  ' + e)); }
if (warns.length) { console.log(`\nWARNINGS (${warns.length})`); warns.forEach((w) => console.log('  ' + w)); }
if (!errors.length) console.log('\ncheck: PASS' + (warns.length ? ` with ${warns.length} warnings` : ''));
process.exit(errors.length ? 1 : 0);
