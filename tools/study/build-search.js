#!/usr/bin/env node
/* Builds the one search index shared by every study course: /study/search-index.js.
   Covers the study section only (every course in tools/study/courses/), never the shop or gallery.

   Run from the repo root:   node tools/study/build-search.js
   build-course.js runs this itself after every course build, so it stays current.

   Reads   tools/study/courses/*.json and each course's generated index.js
   Writes  study/search-index.js   window.STUDY_SEARCH = { courses: [...], items: [[...], ...] }
   Loaded by /study/search.js only when someone uses a search box, so it never slows a page load.
   Image credits and sources pages are left out: they match almost any name and crowd out real pages. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function buildSearch() {
  const ROOT = path.resolve(__dirname, '..', '..');
  const CDIR = path.join(__dirname, 'courses');
  const courses = [], items = [];
  for (const file of fs.readdirSync(CDIR).filter((f) => f.endsWith('.json')).sort()) {
    const slug = file.slice(0, -5);
    const cfg = JSON.parse(fs.readFileSync(path.join(CDIR, file), 'utf8'));
    const base = (cfg.basePath || '/study/art-history').replace(/\/$/, '');
    const idx = path.join(ROOT, base, slug, 'index.js');
    if (!fs.existsSync(idx)) continue;   // course not built yet
    const ctx = { window: {} }; vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(idx, 'utf8'), ctx, { filename: idx });
    const G = ctx.window.GUIDE;
    const c = courses.length;
    courses.push({ slug, name: G.name, home: `${base}/${slug}.html`, img: G.img, lane: base === '/study' ? 'Technique' : 'Art history' });
    const partTitle = (h) => { const p = G.parts.find((x) => x.h === h); return p ? p.title : ''; };
    const kind = { overview: 'Overview', intro: 'Start' };
    for (const it of G.items) {
      if (it.kind === 'credits' || it.kind === 'sources') continue;
      const label = [it.h && it.h < 99 ? partTitle(it.h) : '', it.kind === 'theme' ? (it.tlabel || G.themeLabel || 'Theme') : kind[it.kind]].filter(Boolean).join(' · ');
      const body = it.text.startsWith(it.title + ' · ') ? it.text.slice(it.title.length + 3) : it.text;
      items.push([c, it.url, label, it.title, it.artist || '', it.thumb || '', body]);
    }
  }
  const js = 'window.STUDY_SEARCH=' + JSON.stringify({ courses, items }).replace(/</g, '\\u003c') + ';\n';
  fs.writeFileSync(path.join(ROOT, 'study', 'search-index.js'), js);
  return { courses: courses.length, items: items.length, bytes: Buffer.byteLength(js),
    v: require('crypto').createHash('sha1').update(js).digest('hex').slice(0, 8) };
}

module.exports = buildSearch;
if (require.main === module) {
  const r = buildSearch();
  console.log(`search index: ${r.items} pages from ${r.courses} courses, ${Math.round(r.bytes / 1024)} KB (v ${r.v})`);
}
