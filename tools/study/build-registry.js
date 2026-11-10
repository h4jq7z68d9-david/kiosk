#!/usr/bin/env node
/* COURSE REGISTRY → site-chrome.js STUDY array + study.html cards and JSON-LD.
   Source: tools/study/courses.json (lane, order, name, label, dates, card). Parts are counted from the course data.
     node tools/study/build-registry.js          write; if site-chrome.js changed, bump V.chrome everywhere and say so
     node tools/study/build-registry.js --check  write nothing; exit 1 if any output is stale (check.js runs this)
   Rules it enforces: every settings file in tools/study/courses/ is in the registry and vice versa; every card
   image exists; every course is built. After a write that touched site-chrome.js, rebuild every course. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://davidnicholsonart.com';
/* every .html in the repo except generated print pages: the hand-maintained pages are what matter, and the
   generated course pages are rebuilt right after anyway (listing pages by name missed study/color-wheel.html) */
function allHtml(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (f === '.git' || f === 'node_modules' || f === 'prints' || f === 'tools') continue;
    if (fs.statSync(p).isDirectory()) allHtml(p, out); else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const fail = (m) => { console.error('build-registry: ' + m); process.exit(1); };

const reg = JSON.parse(R('tools/study/courses.json'));
const courseDir = path.join(ROOT, 'tools/study/courses');
const onDisk = fs.readdirSync(courseDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const inReg = reg.courses.map((c) => c.slug);
for (const s of onDisk) if (!inReg.includes(s)) fail(`course "${s}" has a settings file but is not in tools/study/courses.json`);
for (const s of inReg) if (!onDisk.includes(s)) fail(`registry lists "${s}" but tools/study/courses/${s}.json does not exist`);
if (new Set(inReg).size !== inReg.length) fail('duplicate slug in the registry');

/* resolve each course: paths, parts count */
const courses = reg.courses.map((c) => {
  const cfg = JSON.parse(fs.readFileSync(path.join(courseDir, c.slug + '.json'), 'utf8'));
  const base = (cfg.basePath || '/study/art-history').replace(/\/$/, '');
  const lane = reg.lanes.find((l) => l.id === c.lane);
  if (!lane) fail(`${c.slug}: unknown lane "${c.lane}"`);
  for (const k of ['name', 'label', 'card']) if (!c[k]) fail(`${c.slug}: "${k}" missing`);
  if (c.lane === 'art-history' && !c.dates) fail(`${c.slug}: art-history courses need "dates"`);
  const href = `${base}/${c.slug}.html`, section = `${base}/${c.slug}/`;
  const img = `${base}/${cfg.imgFrom || c.slug}/img/${c.card.img}.jpg`;
  if (!fs.existsSync(path.join(ROOT, img))) fail(`${c.slug}: card image ${img} does not exist`);
  const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
  try { for (const f of cfg.dataFiles) vm.runInContext(fs.readFileSync(path.join(ROOT, section, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { fail(`${c.slug}: data failed to load: ${e.message}`); }
  const parts = (ctx.SITE && ctx.SITE.handouts || []).length;
  if (!parts) fail(`${c.slug}: no parts found in the data`);
  const date = c.lane === 'art-history' ? c.dates : `${parts} parts`;
  return { ...c, lane, href, section, img, parts, date };
});

/* ---- STUDY array for site-chrome.js ---- */
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
let study = '';
for (const lane of reg.lanes) {
  study += `    { group: ${q(lane.group)}, href: ${q(lane.href)} },\n`;
  for (const c of courses.filter((x) => x.lane === lane)) study += `    { href: ${q(c.href)}, label: ${q(c.label)}, section: ${q(c.section)} },\n`;
}
study = study.replace(/,\n$/, '\n');
const chromeNew = replaceBetween(R('site-chrome.js'), '  /* STUDY:START */\n', '  /* STUDY:END */', study, 'site-chrome.js');

/* ---- study.html cards + JSON-LD ---- */
/* Nov 10 2026: image + title cards. Art history: square cards alternating sides of a centre line, date beside the dot.
   Technique: the same card in a grid, the date line reading "N parts" under the card. */
const sqCard = (c) => `    <a class="tl-item" href="${c.href}">
      <span class="tl-date">${esc(c.date)}</span>
      <span class="card tl-card"><span class="tl-th"><img src="${c.img}" alt="" loading="lazy"></span><span class="tl-tb"><span class="tt">${esc(c.label)}</span></span></span>
    </a>\n`;
let panels = '';
for (const lane of reg.lanes) {
  panels += `  <section id="p-${lane.id}" class="stab-panel" role="tabpanel" aria-labelledby="t-${lane.id}">\n  <div class="tl${lane.id === 'technique' ? ' tl-grid' : ' tl-alt'}">\n`;
  panels += courses.filter((x) => x.lane === lane).map(sqCard).join('');
  panels += '  </div>\n  </section>\n';
}
let studyHtml = replaceBetween(R('study.html'), '<!-- COURSES:START -->\n', '<!-- COURSES:END -->', panels, 'study.html');
const ld = {
  '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': ORIGIN + '/study.html', url: ORIGIN + '/study.html', name: 'Study',
  publisher: { '@type': 'Person', name: 'David Nicholson', url: ORIGIN + '/' },
  hasPart: [{ '@type': 'WebApplication', name: 'Paint Mixing Color Wheel', url: ORIGIN + '/study/color-wheel.html' },
    ...['technique', 'art-history'].flatMap((l) => courses.filter((c) => c.lane.id === l).map((c) => ({ '@type': 'LearningResource', name: c.name, url: ORIGIN + c.href })))],
};
const ldTag = `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
if (!/<script type="application\/ld\+json">.*?<\/script>/s.test(studyHtml)) fail('study.html: JSON-LD block not found');
studyHtml = studyHtml.replace(/<script type="application\/ld\+json">.*?<\/script>/s, () => ldTag);

/* ---- write / check ---- */
const chromeChanged = chromeNew !== R('site-chrome.js');
const htmlChanged = studyHtml !== R('study.html');
if (CHECK) {
  const stale = [chromeChanged && 'site-chrome.js STUDY array', htmlChanged && 'study.html cards/JSON-LD'].filter(Boolean);
  if (stale.length) { console.error('build-registry --check: stale — run node tools/study/build-registry.js: ' + stale.join(', ')); process.exit(1); }
  console.log(`build-registry: ${courses.length} courses, outputs current`);
  process.exit(0);
}
if (htmlChanged) fs.writeFileSync(path.join(ROOT, 'study.html'), studyHtml);
if (chromeChanged) {
  fs.writeFileSync(path.join(ROOT, 'site-chrome.js'), chromeNew);
  /* the menu changed for every page: bump V.chrome in build-course.js and the ?v= on the hand-maintained pages */
  const bc = path.join(ROOT, 'tools/study/build-course.js');
  const src = fs.readFileSync(bc, 'utf8');
  const m = src.match(/chrome: (\d+)/); if (!m) fail('build-course.js: V.chrome not found');
  const v = Number(m[1]) + 1;
  fs.writeFileSync(bc, src.replace(/chrome: \d+/, 'chrome: ' + v));
  let n = 0;
  for (const f of allHtml(ROOT)) {
    const h = fs.readFileSync(f, 'utf8');
    const h2 = h.replace(/\/site-chrome\.(js|css)\?v=\d+/g, '/site-chrome.$1?v=' + v);
    if (h2 !== h) { fs.writeFileSync(f, h2); n++; }
  }
  console.log(`build-registry: site-chrome.js STUDY updated; V.chrome → ${v} in build-course.js and ${n} pages. Now rebuild every course.`);
}
console.log(`build-registry: ${courses.length} courses — ${htmlChanged ? 'study.html written' : 'study.html unchanged'}, ${chromeChanged ? 'site-chrome.js written' : 'site-chrome.js unchanged'}`);

function replaceBetween(src, start, end, body, name) {
  const a = src.indexOf(start), b = src.indexOf(end);
  if (a < 0 || b < 0 || b < a) fail(`${name}: markers ${start.trim()} … ${end.trim()} not found`);
  return src.slice(0, a + start.length) + body + src.slice(b);
}
