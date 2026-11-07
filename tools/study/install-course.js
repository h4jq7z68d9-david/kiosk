#!/usr/bin/env node
/* tools/study/install-course.js — study-site-builder §9.1–9.8 as one command. Stops at the first failed step.
   Usage:
     node tools/study/install-course.js <slug> --bundle <folder> --lane art-history|technique \
          --name "Course Name" --label "course name" --card-img <imgKey> --card-text "lowercase card text" \
          [--dates "1830s–1890s"] [--after <slug> | --first] [--force] [--trailer "Co-Authored-By: …"]...
   Placement in its lane: after the last course of the lane by default; --after <slug> puts it right after that
   course (art history is in date order, so name the course that comes before it); --first puts it at the top.
   The bundle folder holds data.js (+ extra data files), credits.js, sources.js, img/ and <slug>.json.
   Registry flags are needed only the first time (they write the tools/study/courses.json entry); a re-run with
   --force updates the existing entry from whatever registry flags are passed (and moves it only with --after/--first),
   and clears the previous install folder and course home page first so dropped works, pages and images do not survive. Held works, retired pages and handoff-approved generator changes (§9.3)
   are not automated: do them first, then run this. Steps: 9.0 branch · 9.1 copy · 9.2 resize · 9.4 build ·
   9.5 registry (+ rebuild all) · 9.6 check.js · 9.7 smoke.js · 9.8 commit on the branch. Never pushes. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const slug = args[0];
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const flag = (k) => args.includes('--' + k);
const trailers = []; args.forEach((a, i) => { if (a === '--trailer') trailers.push(args[i + 1]); });
const die = (m) => { console.error('\nSTOP: ' + m); process.exit(1); };
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', ...opts });
const run = (cmd, argv) => spawnSync(cmd, argv, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, NODE_PATH: process.env.NODE_PATH || path.join(ROOT, '..', 'pw', 'node_modules') } });
const step = (n, t) => console.log(`\n== ${n} ${t}`);
const report = {};

if (!slug || !/^[a-z0-9-]+$/.test(slug)) die('usage: node tools/study/install-course.js <slug> --bundle <folder> --lane art-history|technique …');
const bundle = opt('bundle'); const lane = opt('lane');
if (!bundle || !fs.existsSync(bundle)) die('--bundle <folder> is required and must exist');
if (!['art-history', 'technique'].includes(lane)) die('--lane must be art-history or technique');
const dest = lane === 'technique' ? `study/${slug}` : `study/art-history/${slug}`;
const settingsSrc = path.join(bundle, slug + '.json');
const settingsDst = path.join(ROOT, 'tools/study/courses', slug + '.json');

/* 9.0 branch */
step('9.0', 'branch');
if (sh('git status --porcelain').trim() && !flag('force')) die('working tree is not clean — commit or stash first (or --force to continue a previous attempt)');
const branch = sh('git branch --show-current').trim();
const want = 'install-' + slug;
if (branch !== want) { if (sh(`git branch --list ${want}`).trim()) sh(`git checkout -q ${want}`); else sh(`git checkout -q -b ${want}`); }
console.log('on branch ' + want);
for (const f of ['data.js', 'credits.js', 'sources.js', 'img', slug + '.json']) if (!fs.existsSync(path.join(bundle, f))) die(`bundle is missing ${f}`);

/* 9.1 copy */
step('9.1', 'copy the bundle');
if (fs.existsSync(path.join(ROOT, dest)) && !flag('force')) die(`${dest} already exists — pass --force to re-install over it`);
let cfg;
try { cfg = JSON.parse(fs.readFileSync(settingsSrc, 'utf8')); } catch (e) { die(`${slug}.json is not valid JSON: ${e.message}`); }
const base = (cfg.basePath || '/study/art-history').replace(/\/$/, '');
if (base !== '/' + path.dirname(dest)) die(`settings basePath "${cfg.basePath || '(default /study/art-history)'}" does not match lane ${lane} (${'/' + path.dirname(dest)})`);
/* re-install: clear the old install first, so works, pages and images the new bundle drops do not survive.
   The folder holds only bundle files and generated pages; the course home page sits beside it. */
if (fs.existsSync(path.join(ROOT, dest))) {
  fs.rmSync(path.join(ROOT, dest), { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, dest + '.html'), { force: true });
  console.log(`cleared the previous install of ${dest}/ and ${dest}.html`);
}
fs.mkdirSync(path.join(ROOT, dest), { recursive: true });
fs.cpSync(bundle, path.join(ROOT, dest), { recursive: true });
fs.rmSync(path.join(ROOT, dest, slug + '.json'));
fs.copyFileSync(settingsSrc, settingsDst);
for (const f of cfg.dataFiles || []) if (!fs.existsSync(path.join(ROOT, dest, f))) die(`dataFiles lists ${f} but it is not in the bundle`);
console.log(`copied to ${dest}/ and tools/study/courses/${slug}.json`);

/* 9.2 resize */
step('9.2', 'resize images (≤1600 px long edge, JPEG q85, sRGB; never upscale)');
const py = `
import sys, os
from PIL import Image, ImageOps
d = sys.argv[1]; over = 0; n = 0; total = 0
for f in sorted(os.listdir(d)):
    if not f.lower().endswith('.jpg'): print('not a .jpg:', f); over += 1; continue
    p = os.path.join(d, f); im = Image.open(p); im = ImageOps.exif_transpose(im)
    if max(im.size) > 1600 or im.mode != 'RGB':
        if max(im.size) > 1600: im.thumbnail((1600, 1600))
        im = im.convert('RGB'); im.save(p, 'JPEG', quality=85, optimize=True)
    w, h = Image.open(p).size
    if max(w, h) > 1600: print('still over:', f, w, h); over += 1
    n += 1; total += os.path.getsize(p)
print(f'{n} images, {total/1048576:.1f} MB'); sys.exit(1 if over else 0)`;
const rz = spawnSync('python3', ['-I', '-c', py, path.join(ROOT, dest, 'img')], { encoding: 'utf8' });
if (rz.status !== 0) die('image resize failed (needs python3 + Pillow): ' + (rz.stdout + rz.stderr).trim());
console.log(rz.stdout.trim()); report.images = rz.stdout.trim();

/* 9.4 build the new course */
step('9.4', 'build the course');
const b = run('node', ['tools/study/build-course.js', slug]);
if (b.status !== 0 || /Error:/.test(b.stdout + b.stderr)) die('build failed:\n' + (b.stdout + b.stderr).trim());
const wrote = (b.stdout.match(/wrote \d+ pages \([^)]*\)/) || [])[0];
console.log(wrote || b.stdout.trim()); report.built = wrote;

/* 9.5 registry */
step('9.5', 'register the course');
const regFile = path.join(ROOT, 'tools/study/courses.json');
const reg = JSON.parse(fs.readFileSync(regFile, 'utf8'));
if (!reg.courses.some((c) => c.slug === slug)) {
  const need = ['name', 'label', 'card-img', 'card-text'].concat(lane === 'art-history' ? ['dates'] : []).filter((k) => !opt(k));
  if (need.length) die(`${slug} is not in tools/study/courses.json yet; pass --${need.join(' --')} (or add the entry by hand and re-run with --force)`);
  const entry = { slug, lane, name: opt('name'), label: opt('label') };
  if (lane === 'art-history') entry.dates = opt('dates');
  entry.card = { img: opt('card-img'), text: opt('card-text') };
  const laneIdx = reg.courses.map((c, i) => c.lane === lane ? i : -1).filter((i) => i >= 0);
  let at, where;
  if (opt('after')) {
    const i = reg.courses.findIndex((c) => c.slug === opt('after'));
    if (i < 0 || reg.courses[i].lane !== lane) die(`--after ${opt('after')}: no ${lane} course with that slug in the registry`);
    at = i + 1; where = `after ${opt('after')}`;
  } else if (flag('first')) { at = laneIdx.length ? laneIdx[0] : reg.courses.length; where = `first in ${lane}`; }
  else { at = laneIdx.length ? laneIdx[laneIdx.length - 1] + 1 : reg.courses.length; where = `after the last ${lane} course`; }
  reg.courses.splice(at, 0, entry);
  fs.writeFileSync(regFile, JSON.stringify(reg, null, 1) + '\n');
  console.log(`added to the registry ${where}${lane === 'art-history' && !opt('after') && !flag('first') ? ' — art history is in date order; use --after <slug> if this is not its place' : ''}`);
} else {
  /* re-install: update the existing entry from any registry flags passed (card text, label, dates…); move it only if --after/--first is given */
  const i = reg.courses.findIndex((c) => c.slug === slug); const e = reg.courses[i]; const changed = [];
  const set = (obj, k, v, name) => { if (v !== undefined && obj[k] !== v) { obj[k] = v; changed.push(name); } };
  set(e, 'name', opt('name'), 'name'); set(e, 'label', opt('label'), 'label');
  if (lane === 'art-history') set(e, 'dates', opt('dates'), 'dates');
  e.card = e.card || {}; set(e.card, 'img', opt('card-img'), 'card image'); set(e.card, 'text', opt('card-text'), 'card text');
  if (e.lane !== lane) die(`${slug} is in the ${e.lane} lane in the registry; --lane ${lane} does not match`);
  if (opt('after') || flag('first')) {
    reg.courses.splice(i, 1);
    let at;
    if (opt('after')) { const j = reg.courses.findIndex((c) => c.slug === opt('after')); if (j < 0 || reg.courses[j].lane !== lane) die(`--after ${opt('after')}: no ${lane} course with that slug in the registry`); at = j + 1; }
    else { const first = reg.courses.findIndex((c) => c.lane === lane); at = first < 0 ? reg.courses.length : first; }
    reg.courses.splice(at, 0, e);
    changed.push(opt('after') ? `position (after ${opt('after')})` : 'position (first)');
  }
  fs.writeFileSync(regFile, JSON.stringify(reg, null, 1) + '\n');
  console.log(changed.length ? `already in the registry — updated: ${changed.join(', ')}` : 'already in the registry — no changes');
}
const r = run('node', ['tools/study/build-registry.js']);
if (r.status !== 0) die('build-registry failed:\n' + (r.stdout + r.stderr).trim());
console.log(r.stdout.trim());
step('9.5', 'rebuild every course (menu/cache strings)');
for (const f of fs.readdirSync(path.join(ROOT, 'tools/study/courses')).filter((x) => x.endsWith('.json'))) {
  const s = f.slice(0, -5); const o = run('node', ['tools/study/build-course.js', s]);
  if (o.status !== 0 || /Error:/.test(o.stdout + o.stderr)) die(`rebuild of ${s} failed:\n` + (o.stdout + o.stderr).trim());
}
console.log('all courses rebuilt');

/* 9.6 static check */
step('9.6', 'tools/site/check.js');
const c = run('node', ['tools/site/check.js', slug]);
process.stdout.write(c.stdout.split('\n').filter((l) => /ERRORS|WARNINGS|^  |check:|lambda tests|^[a-z0-9-]+: pages/.test(l)).join('\n') + '\n');
if (c.status !== 0) die('check.js failed — fix the errors above and re-run with --force');

/* 9.7 headless */
step('9.7', 'tools/site/smoke.js ' + slug);
const s = run('node', ['tools/site/smoke.js', slug]);
process.stdout.write(s.stdout.split('\n').filter((l) => /FAIL|smoke:|NOTES|^  /.test(l)).join('\n') + '\n');
if (s.status === 2) die('smoke.js could not run (Playwright/Chromium missing?):\n' + (s.stderr || s.stdout).trim());
if (s.status !== 0) die('smoke.js failed — fix the failures above and re-run with --force');
report.shots = [`tools/site/out/${slug}-home-1440.png`, `tools/site/out/${slug}-work-390.png`].filter((f) => fs.existsSync(path.join(ROOT, f)));

/* 9.8 commit */
step('9.8', 'commit on the branch');
sh('git add -A');
const name = reg.courses.find((x) => x.slug === slug).name;
const msg = [`Install ${name} study course`, '', ...trailers].join('\n');
fs.writeFileSync(path.join(ROOT, '.git', 'INSTALL_MSG'), msg);
sh('git commit -q -F .git/INSTALL_MSG'); fs.rmSync(path.join(ROOT, '.git', 'INSTALL_MSG'));
console.log(sh('git log --oneline -1').trim());

console.log(`\n== done: ${slug} installed on branch ${want} (not pushed)
  ${report.built}
  ${report.images}
  screenshots: ${report.shots.join(', ') || '(none written)'}
  next: show David the screenshots, bad news first; §9.9 report; push to main only on his word.`);
