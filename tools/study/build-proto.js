#!/usr/bin/env node
/* PROTOTYPE: one real page per slide, all styling in /study/guide.css, behavior in /study/guide.js.
   Usage: node tools/study/build-proto.js <course-slug>
   Reads   study/art-history/<slug>/<data files, credits.js>, tools/study/courses/<slug>.json
   Writes  study/art-history/<slug>-proto/*.html and index.js   (noindex; not in the sitemap)
   Images are read from the live course folder. Generated pages carry no <style> block. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const SLUG = process.argv[2] || 'classical-myth';
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'courses', SLUG + '.json'), 'utf8'));
const SRC = path.join(ROOT, 'study', 'art-history', SLUG);
const OUT = path.join(ROOT, 'study', 'art-history', SLUG + '-proto');
const BASE = '/study/art-history/' + SLUG + '-proto';
const IMG = '/study/art-history/' + SLUG + '/img/';
const NAME = CFG.name;

const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
for (const f of [...CFG.dataFiles, 'credits.js']) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f });
const S = ctx.SITE, C = ctx.CREDITS || {};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sec = (w) => (S.sections && S.sections[w]) || '';

/* ---- flatten to one list (same order as the one-page guide) ---- */
const flat = [];
flat.push({ h: 0, kind: 'intro', id: 'start', label: 'About this site', url: BASE + '/start.html' });
for (const h of S.handouts) {
  flat.push({ h: h.n, kind: 'overview', d: h, hd: h, id: 'h' + h.n + '-0', label: 'Overview', url: `${BASE}/part-${h.n}.html` });
  h.slides.forEach((s, i) => {
    const id = 'h' + h.n + '-' + (i + 1);
    flat.push({ h: h.n, kind: s.type, d: s, hd: h, id: s.type === 'work' ? s.key : id, label: s.title, url: `${BASE}/${s.type === 'work' ? s.key : id}.html` });
  });
}
flat.push({ h: 99, kind: 'credits', id: 'credits', label: 'Image credits', url: BASE + '/credits.html' });
const byKey = {}; flat.forEach((f, i) => { if (f.kind === 'work') byKey[f.d.key] = i; });

/* ---- slide markup (same templates as the one-page guide, links instead of buttons) ---- */
const cap = (s) => [s.artist && esc(s.artist), '<i>' + esc(s.title) + '</i>', s.date && esc(s.date)].filter(Boolean).join(', ');
const terms = (t) => t && t.length ? '<dl class="terms">' + t.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('') + '</dl>' : '';
const bul = (b) => b && b.length ? '<ul class="b">' + b.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>' : '';
const quote = (q) => q ? `<blockquote><p>“${esc(q.q)}”</p><cite>${esc(q.by)}</cite></blockquote>` : '';
const rule = '<hr class="rule">';
const credLine = (k) => { const c = C[k]; return c ? `Image: <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.source || 'Wikimedia Commons')}</a> · ${esc(c.license)}` : ''; };
const crl = (k) => `<p class="crl">${credLine(k)}</p>`;
const pic = (k, alt, capHtml) => `<div class="pic"><img src="${IMG}${k}.jpg" alt="${esc(alt)}" data-cap="${esc(capHtml)}" tabindex="0"></div>`;
const wl = (keys) => `<ul class="wl">${keys.filter((k) => byKey[k] != null).map((k) => `<li><a class="wlink" href="${flat[byKey[k]].url}">${esc(flat[byKey[k]].d.title)}</a></li>`).join('')}</ul>`;

function slideHtml(f) {
  const d = f.d;
  if (f.kind === 'intro') {
    return ['slide text', `<div class="notes intro"><p class="eyebrow">Study guide</p><h1 class="htitle">${esc(NAME)}</h1><p class="hsub">${esc(CFG.ldDescription || '')}</p>${rule}
<p class="sum">Each page pairs one work of art with a short account of what it shows, what it was made for, and the key names and terms. Theme pages step back to the bigger ideas that connect the works.</p>
<ul class="b"><li>Use the outline, the arrow keys, or Prev/Next to move between pages.</li><li>Click any image to see it full screen.</li><li>Use Bookmark to save a page, and Saved (top right) to find your saved pages again.</li><li>Every image is public domain or CC0; sources and licenses are listed under Image credits.</li></ul>
<p class="contlink" id="contlink" hidden></p>
<p class="lab">Contents</p><ul class="wl">${S.handouts.map((x) => `<li><a class="wlink" href="${BASE}/part-${x.n}.html">${esc(x.title)}</a></li>`).join('')}</ul></div>`];
  }
  if (f.kind === 'overview') {
    const o = d.overview, c = o.cap, ch = [c[0] && esc(c[0]), '<i>' + esc(c[1]) + '</i>', c[2] && esc(c[2])].filter(Boolean).join(', ');
    return ['slide', pic(o.img, c[1], ch) + `<div class="notes"><p class="eyebrow">${esc(sec(d.wk))}</p><h1 class="htitle">${esc(d.title)}</h1><p class="hsub">${esc(d.sub)}</p>
<p class="sum">${esc(o.sum)}</p>${quote(d.quote)}${rule}${bul(o.bul)}${o.terms && o.terms.length ? rule + terms(o.terms) : ''}
<p class="lab">Works in this part</p>${wl(d.slides.filter((s) => s.type === 'work').map((s) => s.key))}${crl(o.img)}</div>`];
  }
  if (f.kind === 'work') {
    return ['slide', pic(d.key, d.title, cap(d)) + `<div class="notes">${d.artist ? `<p class="artist">${esc(d.artist)}</p>` : ''}<h1 class="title">${esc(d.title)}</h1><p class="date">${esc(d.date)}</p>${d.det ? `<p class="det">${esc(d.det)}</p>` : ''}
<p class="fn"><b>Made for:</b> ${esc(d.fn)}</p><p class="sum">${esc(d.sum)}</p>${rule}${bul(d.bul)}${d.terms && d.terms.length ? rule + terms(d.terms) : ''}${quote(d.quote)}${crl(d.key)}</div>`];
  }
  if (f.kind === 'theme') {
    const w = byKey[d.img] != null ? cap(flat[byKey[d.img]].d) : (C[d.img] ? esc(C[d.img].work) : '');
    return ['slide', pic(d.img, d.title, w) + `<div class="notes"><p class="eyebrow">Theme</p><h1 class="title plain">${esc(d.title)}</h1><p class="stmt">${esc(d.stmt)}</p><p class="sum">${esc(d.para)}</p>${rule}${bul(d.bul)}${d.terms && d.terms.length ? rule + terms(d.terms) : ''}
${d.works && d.works.length ? `<p class="lab">See</p>${wl(d.works)}` : ''}${quote(d.quote)}${crl(d.img)}</div>`];
  }
  if (f.kind === 'text') {
    return ['slide text', `<div class="notes"><p class="eyebrow">${esc(f.hd.title)}</p><h1 class="htitle">${esc(d.title)}</h1>${d.sub ? `<p class="hsub">${esc(d.sub)}</p>` : ''}<p class="sum">${esc(d.sum)}</p>${rule}${bul(d.bul)}${rule}${terms(d.terms)}</div>`];
  }
  // credits
  const order = [];
  flat.forEach((x) => { if (x.kind === 'overview') order.push(x.d.overview.img); if (x.kind === 'work') order.push(x.d.key); if (x.kind === 'theme') order.push(x.d.img); });
  const u = [...new Set(order)].filter((k) => C[k]);
  return ['slide text', `<div class="notes"><p class="eyebrow">Sources</p><h1 class="htitle">Image credits</h1><p class="sum">${esc(CFG.creditsIntro || 'Image sources and licenses.')}</p>
<div class="cred">${u.map((k) => { const c = C[k]; const au = (c.author || '').replace(/\s+/g, ' ').slice(0, 80); return `<div><b>${esc(c.work)}</b><br>File: <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.file)}</a><br>${esc(c.license)}${au ? ' · Author/s: ' + esc(au) : ''}</div>`; }).join('')}</div></div>`];
}

/* ---- search/outline index ---- */
function textOf(f) {
  const d = f.d || {}, p = [];
  if (f.kind === 'overview') { const o = d.overview; p.push(d.title, d.sub, o.sum, ...(o.bul || []), ...(o.terms || []).flat(), ...(o.cap || [])); }
  else if (f.kind === 'intro' || f.kind === 'credits') p.push(f.label);
  else p.push(d.title, d.artist, d.date, d.det, d.fn, d.stmt, d.para, d.sum, d.sub, ...(d.bul || []), ...(d.terms || []).flat(), d.quote && d.quote.q);
  return p.filter(Boolean).join(' · ');
}
const thumb = (f) => f.kind === 'work' ? f.d.key : f.kind === 'theme' ? f.d.img : f.kind === 'overview' ? f.d.overview.img : null;
const GUIDE = {
  slug: SLUG, name: NAME, base: BASE, img: IMG,
  parts: S.handouts.map((h) => ({ h: h.n, title: h.title, wk: h.wk, section: sec(h.wk) })),
  items: flat.map((f) => ({ id: f.id, url: f.url, h: f.h, kind: f.kind, label: f.label, title: (f.d && f.d.title) || f.label, artist: (f.d && f.d.artist) || '', thumb: thumb(f), text: textOf(f) })),
};
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.js'), 'window.GUIDE=' + JSON.stringify(GUIDE) + ';\n');

/* ---- page shell ---- */
const NAV = `<nav data-chrome-nav></nav>
<script src="/site-bar.js?v=1"></script>
<div id="menu-scrim"></div>
<div id="menu-panel" aria-label="site menu"></div>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,700;1,400;1,500&display=swap">`;
const BM_ICON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5.5 3h9v14L10 13.5 5.5 17z"/></svg>';
const SEARCH_ICON = '<svg class="sico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.6 12.6l4.4 4.4"/></svg>';

flat.forEach((f, i) => {
  const [cls, inner] = slideHtml(f), prev = flat[i - 1], next = flat[i + 1];
  const title = f.kind === 'intro' ? `${NAME}: study guide` : f.kind === 'credits' ? `Image credits | ${NAME}` : `${f.d.title} | ${NAME}`;
  const desc = (f.kind === 'work' ? f.d.sum : f.kind === 'overview' ? f.d.overview.sum : f.kind === 'theme' ? f.d.para : f.kind === 'text' ? f.d.sum : CFG.ldDescription || NAME).replace(/\s+/g, ' ').slice(0, 155);
  const hd = f.hd, crumb = hd ? `${sec(hd.wk)} · ${hd.title}` : (f.kind === 'credits' ? 'Credits' : 'Start');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light dark">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon96.png">
${FONTS}
<link rel="stylesheet" href="/site-tokens.css?v=1">
<link rel="stylesheet" href="/site-chrome.css?v=1">
<link rel="stylesheet" href="/site-bar.css?v=1">
<link rel="stylesheet" href="/study/guide.css?v=1">
${prev ? `<link rel="prev" href="${prev.url}">` : ''}${next ? `<link rel="next" href="${next.url}">` : ''}
</head>
<body class="guide-page" data-id="${f.id}" data-h="${f.h}">
${NAV}
<div class="app" id="app">
  <nav class="rail" aria-label="Outline" id="rail">
    <p class="brand"><a href="${BASE}/start.html">${esc(NAME)}</a></p>
    <p class="brandsub">${esc(CFG.ldDescription || '')}</p>
    <div id="outline">${S.handouts.map((h) => `<p><a href="${BASE}/part-${h.n}.html">${esc(h.title)}</a></p>`).join('')}</div>
  </nav>
  <div class="main">
    <div class="topbar">
      <div class="search" id="search" role="search">${SEARCH_ICON}
        <input id="q" type="search" placeholder="Search works, artists, terms…" aria-label="Search this guide" autocomplete="off" aria-controls="results" aria-expanded="false">
        <div class="results" id="results" role="listbox" hidden></div>
      </div>
      <button class="btn savedbtn" id="saved" type="button" aria-expanded="false" aria-controls="savedp">Saved (0)</button>
      <div class="savedp" id="savedp" hidden></div>
    </div>
    <select id="jump" class="jump" aria-label="Jump to page"></select>
    <div class="bar">
      <button class="btn tog" id="tog" type="button" aria-controls="rail" aria-expanded="true" aria-label="Hide outline" title="Hide outline"></button>
      <span class="crumb">${esc(crumb)}</span>
      <span class="spacer"></span>
      <span class="pos">${i + 1} / ${flat.length}</span>
      <button class="btn bm" id="bm" type="button" aria-pressed="false">${BM_ICON}<span class="bmt">Bookmark</span></button>
      ${prev ? `<a class="btn" id="prev" rel="prev" href="${prev.url}">← Prev</a>` : '<a class="btn" id="prev" aria-disabled="true">← Prev</a>'}
      ${next ? `<a class="btn primary" id="next" rel="next" href="${next.url}">Next →</a>` : '<a class="btn primary" id="next" aria-disabled="true">Next →</a>'}
    </div>
    <article class="${cls}" id="slide" tabindex="-1">${inner}</article>
  </div>
</div>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Enlarged image"><button class="x" id="lbx" type="button">Close ✕</button><img id="lbimg" alt=""><p class="cap" id="lbcap"></p></div>
<script src="${BASE}/index.js"></script>
<script src="/study/guide.js?v=1"></script>
<script src="/site-chrome.js?v=1"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, path.basename(f.url)), html);
});
const bad = fs.readdirSync(OUT).filter((n) => n.endsWith('.html') && /<style|style="[^"]*(#[0-9a-f]{3,6}|rgb)/i.test(fs.readFileSync(path.join(OUT, n), 'utf8')));
console.log(`wrote ${flat.length} pages to ${path.relative(ROOT, OUT)}; pages with <style> or color literals: ${bad.length}`);
