#!/usr/bin/env node
/* Builds the static "Classical Myth in Art" pages from the course data files.

   Run from the repo root:   node tools/study/build-classical-myth.js
   Re-run after editing any of the data files; it rewrites every generated page.

   Reads   study/art-history/classical-myth/{data.js,data_w34.js,data_w58.js,credits.js}
           study/art-history/classical-myth/img/<key>.jpg   (for width/height)
           tools/study/classical-myth-viewer.html           the original one-page guide (layout and script kept)
   Writes  study/art-history/classical-myth.html            course home = the one-page guide (from the viewer below)
           study/art-history/classical-myth/<section>/<part>.html   16 part pages
           study/art-history/classical-myth/<section>/<work>.html   one page per work
           study/art-history/classical-myth/credits.html
           sitemap.xml                                      replaces this course's block (between its comment markers)

   Content is never rewritten here: every title, summary, bullet, term and quote comes
   straight from the data files. Only page structure, links and SEO tags are added.
   Look: site colors and fonts from /site-tokens.css, top bar from /site-bar.js, menu and
   footer links from /site-chrome.js, page styles from /study/study.css. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const ORIGIN = 'https://davidnicholsonart.com';
const COURSE = '/study/art-history/classical-myth';
const DIR = path.join(ROOT, COURSE);
const NAME = 'Classical Myth in Art';
const STUDY = '/study.html';

/* ---------- load data ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data.js', 'data_w34.js', 'data_w58.js', 'credits.js', 'sources.js']) {
  vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f });
}
const S = ctx.window.SITE;
const C = ctx.window.CREDITS || {};
const SOURCES = ctx.window.SOURCES || { intro: '', groups: [] };

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[’'`]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sec = (w) => (S.sections && S.sections[w]) || '';
const img = (k) => `${COURSE}/img/${k}.jpg`;
const abs = (u) => ORIGIN + u;

function jpegSize(file) {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error('no size in ' + file);
}
const DIMS = {};
const dims = (k) => (DIMS[k] = DIMS[k] || jpegSize(path.join(DIR, 'img', k + '.jpg')));

function describe(text) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  const first = (t.match(/^.+?[.!?](?=\s|$)/) || [t])[0];
  if (first.length >= 70 && first.length <= 160) return first;
  if (t.length <= 160) return t;
  const cut = t.slice(0, 156);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:–—-]$/, '') + '…';
}
const capOf = (s) => [s.artist && esc(s.artist), '<i>' + esc(s.title) + '</i>', s.date && esc(s.date)].filter(Boolean).join(', ');
const terms = (t) => (t && t.length ? '<dl class="terms">' + t.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('') + '</dl>' : '');
const bul = (b) => (b && b.length ? '<ul class="b">' + b.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>' : '');
const quote = (q) => (q ? `<blockquote><p>“${esc(q.q)}”</p><cite>${esc(q.by)}</cite></blockquote>` : '');
const RULE = '<hr class="rule">';
const crl = (k) => { const c = C[k]; return c ? `<p class="crl">Image: <a href="${esc(c.page)}" target="_blank" rel="noopener">Wikimedia Commons</a> · ${esc(c.license)}</p>` : ''; };
function pic(k, alt, capHtml, eager) {
  const d = dims(k);
  return `<div class="pic"><img src="${img(k)}" width="${d.w}" height="${d.h}" alt="${esc(alt)}" data-cap="${esc(capHtml)}" tabindex="0"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`;
}
const LICENSE_URL = { 'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/', 'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/' };

/* ---------- build the site map in memory ---------- */
const parts = [];
const works = [];
const viewerIds = {};             // viewer slide id -> static page URL
viewerIds.start = COURSE + '.html';  // ids follow the original slide numbering (h<part>-<n>); used by search
viewerIds.credits = COURSE + '/credits.html';
viewerIds.sources = COURSE + '/sources.html';
S.handouts.forEach((h) => {
  const secSlug = slug(sec(h.wk));
  const p = { h, secSlug, url: `${COURSE}/${secSlug}/${slug(h.title)}.html`, id: `h${h.n}-0`, items: [] };
  viewerIds[p.id] = p.url;
  h.slides.forEach((s, i) => {
    const id = `h${h.n}-${i + 1}`;
    const it = { s, id, part: p };
    if (s.type === 'work') {
      it.url = `${COURSE}/${secSlug}/${slug(s.title)}.html`;
      works.push(it);
    } else {
      it.anchor = (s.type === 'theme' ? 'theme-' : 'note-') + slug(s.title);
      it.url = p.url + '#' + it.anchor;
    }
    viewerIds[id] = it.url;
    p.items.push(it);
  });
  parts.push(p);
});
const workByKey = Object.fromEntries(works.map((w) => [w.s.key, w]));
const seen = new Set();
for (const u of [...parts.map((p) => p.url), ...works.map((w) => w.url)]) {
  if (seen.has(u)) throw new Error('duplicate URL ' + u);
  seen.add(u);
}

/* ---------- page shell ---------- */
const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-FL5BKJFVXF"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-FL5BKJFVXF');</script>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,700;1,400;1,500&display=swap">`;
const NAV = `<nav data-chrome-nav></nav>
<script src="/site-bar.js?v=1"></script>
<div id="menu-scrim"></div>
<div id="menu-panel" aria-label="site menu"></div>`;
const FOOTER = `<footer>
  <div class="f-inner">
    <div class="f-cols">
      <div>
        <p class="f-brand">david nicholson</p>
        <img class="f-logo" src="/logo-mark.png" alt="">
      </div>
      <div class="f-links" data-chrome-footer></div>
    </div>
    <p class="f-legal">&copy; 2026 david nicholson</p>
  </div>
</footer>`;
const LIGHTBOX = `<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Enlarged image"><button class="x" id="lbx" type="button">Close ✕</button><img id="lbimg" alt=""><p class="cap" id="lbcap"></p></div>`;

function page({ url, title, desc, image, imageAlt, type = 'article', body, ld, extraHead = '', extraScripts = '', guide = false }) {
  const og = image ? `<meta property="og:image" content="${abs(img(image))}">
<meta property="og:image:width" content="${dims(image).w}">
<meta property="og:image:height" content="${dims(image).h}">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${abs(img(image))}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">` : '<meta name="twitter:card" content="summary">';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(url)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="David Nicholson">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(url)}">
${og}
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="color-scheme" content="light dark">
${GA}
<link rel="icon" type="image/png" sizes="96x96" href="/favicon96.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon180.png">
${FONTS}
<link rel="stylesheet" href="/site-tokens.css?v=1">
<link rel="stylesheet" href="/site-chrome.css?v=1">
<link rel="stylesheet" href="/site-bar.css?v=1">
<link rel="stylesheet" href="/study/study.css?v=4">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${extraHead}</head>
<body${guide ? ' class="guide-page"' : ''}>
${NAV}
${guide ? body : `<main id="main">\n${body}\n</main>`}
${guide ? '' : FOOTER + '\n'}${guide ? '' : LIGHTBOX + '\n'}${extraScripts}${guide ? '' : '<script src="/study/study.js?v=3"></script>\n'}<script src="/site-chrome.js?v=1"></script>
</body>
</html>
`;
}

function crumbs(list) {
  return '<ol class="crumbs" aria-label="Breadcrumb">' + list.map(([label, href]) => `<li>${href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}</li>`).join('') + '</ol>';
}
function crumbLd(list) {
  return { '@type': 'BreadcrumbList', itemListElement: list.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(href) })) };
}
const COURSE_LD = { '@type': ['LearningResource', 'CollectionPage'], '@id': abs(COURSE + '.html') + '#course', name: NAME, url: abs(COURSE + '.html') };
const PUBLISHER = { '@type': 'Person', name: 'David Nicholson', url: ORIGIN + '/' };
const imageLd = (k) => {
  const c = C[k] || {}; const d = dims(k);
  return { '@type': 'ImageObject', contentUrl: abs(img(k)), width: d.w, height: d.h, license: LICENSE_URL[c.license] || undefined, acquireLicensePage: c.page, creditText: c.page ? 'Wikimedia Commons' : undefined };
};
const pager = (prev, next, posText, label) => `<nav class="pager" aria-label="${label}">
  <span class="pos">${posText}</span>
  ${prev ? `<a class="btn" href="${prev.url}" rel="prev" title="${esc(prev.title)}">← Prev</a>` : '<span class="btn" aria-disabled="true">← Prev</span>'}
  ${next ? `<a class="btn primary" href="${next.url}" rel="next" title="${esc(next.title)}">Next →</a>` : '<span class="btn primary" aria-disabled="true">Next →</span>'}
</nav>`;
const openGuide = (id) => `<p class="open-guide"><a class="btn primary" href="${COURSE}.html#${id}">Open in the guide</a></p>`;
const workRef = (w) => w && { url: w.url, title: w.s.title };
const partRef = (p) => p && { url: p.url, title: p.h.title };

const out = [];
function write(url, html) {
  const file = path.join(ROOT, url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  out.push(url);
}
// clear generated section folders so renamed works don't leave stale pages behind
for (const p of new Set(parts.map((x) => x.secSlug))) fs.rmSync(path.join(DIR, p), { recursive: true, force: true });

/* ---------- work pages ---------- */
works.forEach((w, i) => {
  const s = w.s, p = w.part, h = p.h;
  const who = s.artist ? `${s.artist}, ${s.title}` : s.title;
  const title = `${who} – ${NAME}`;
  const cr = [['Study', STUDY], [NAME, COURSE + '.html'], [h.title, p.url], [s.title, w.url]];
  const themes = parts.flatMap((pp) => pp.items).filter((t) => t.s.type === 'theme' && (t.s.works || []).includes(s.key));
  const body = `${crumbs(cr)}
${openGuide(w.id)}
<article class="card slide">
  ${pic(s.key, s.title, capOf(s), true)}
  <div class="notes">
    <p class="eyebrow"><a href="${p.url}">${esc(sec(h.wk))} · ${esc(h.title)}</a></p>
    ${s.artist ? `<p class="artist">${esc(s.artist)}</p>` : ''}<h1 class="title">${esc(s.title)}</h1><p class="date">${esc(s.date)}</p>${s.det ? `<p class="det">${esc(s.det)}</p>` : ''}
    <p class="fn"><b>Made for:</b> ${esc(s.fn)}</p><p class="sum">${esc(s.sum)}</p>${RULE}${bul(s.bul)}${s.terms && s.terms.length ? RULE + terms(s.terms) : ''}${quote(s.quote)}
    ${themes.length ? `<p class="lab">Themes</p><ul class="wl">${themes.map((t) => `<li><a class="wlink" href="${t.url}">${esc(t.s.title)}</a></li>`).join('')}</ul>` : ''}
    ${crl(s.key)}
  </div>
</article>
${pager(workRef(works[i - 1]), workRef(works[i + 1]), `${i + 1} / ${works.length}`, 'Works')}`;
  const medium = s.det ? s.det.split(' · ')[0] : undefined;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'VisualArtwork', '@id': abs(w.url) + '#work', name: s.title, url: abs(w.url), description: s.sum,
      creator: s.artist ? { '@type': 'Person', name: s.artist } : undefined, artMedium: medium, image: imageLd(s.key) },
    { '@type': 'WebPage', '@id': abs(w.url), url: abs(w.url), name: title, description: describe(s.sum), inLanguage: 'en',
      about: { '@id': abs(w.url) + '#work' }, isPartOf: COURSE_LD, publisher: PUBLISHER, primaryImageOfPage: imageLd(s.key) },
    crumbLd(cr)] };
  write(w.url, page({ url: w.url, title, desc: describe(s.sum), image: s.key, imageAlt: s.title, body, ld }));
});

/* ---------- part pages ---------- */
parts.forEach((p, i) => {
  const h = p.h, o = h.overview, c = o.cap;
  const ch = [c[0] && esc(c[0]), '<i>' + esc(c[1]) + '</i>', c[2] && esc(c[2])].filter(Boolean).join(', ');
  const title = `${h.title} – ${NAME}`;
  const cr = [['Study', STUDY], [NAME, COURSE + '.html'], [h.title, p.url]];
  const seq = p.items.map((it) => {
    const s = it.s;
    if (s.type === 'work') {
      const d = dims(s.key);
      return `<a class="card row" href="${it.url}"><span class="th"><img src="${img(s.key)}" width="${d.w}" height="${d.h}" alt="${esc(s.title)}" loading="lazy"></span><span><span class="rt">${esc(s.title)}</span><span class="ra">${esc([s.artist, s.date].filter(Boolean).join(' · '))}</span><span class="rs">${esc(s.sum)}</span></span></a>`;
    }
    if (s.type === 'theme') {
      const wk = workByKey[s.img];
      const tc = wk ? capOf(wk.s) : (C[s.img] ? esc(C[s.img].work) : '');
      return `<article class="card slide" id="${it.anchor}" style="scroll-margin-top:calc(var(--nav-h) + 12px)">
  ${pic(s.img, wk ? wk.s.title : s.title, tc)}
  <div class="notes"><p class="eyebrow">Theme</p><h2 class="title plain">${esc(s.title)}</h2><p class="stmt">${esc(s.stmt)}</p><p class="sum">${esc(s.para)}</p>${RULE}${bul(s.bul)}${s.terms && s.terms.length ? RULE + terms(s.terms) : ''}
  ${s.works && s.works.length ? `<p class="lab">See</p><ul class="wl">${s.works.filter((k) => workByKey[k]).map((k) => `<li><a class="wlink" href="${workByKey[k].url}">${esc(workByKey[k].s.title)}</a></li>`).join('')}</ul>` : ''}${quote(s.quote)}${crl(s.img)}</div>
</article>`;
    }
    return `<article class="card slide text" id="${it.anchor}" style="scroll-margin-top:calc(var(--nav-h) + 12px)"><div class="notes"><p class="eyebrow">${esc(h.title)}</p><h2 class="htitle">${esc(s.title)}</h2>${s.sub ? `<p class="hsub">${esc(s.sub)}</p>` : ''}<p class="sum">${esc(s.sum)}</p>${RULE}${bul(s.bul)}${RULE}${terms(s.terms)}</div></article>`;
  });
  const body = `${crumbs(cr)}
${openGuide(p.id)}
<article class="card slide">
  ${pic(o.img, c[1], ch, true)}
  <div class="notes"><p class="eyebrow">${esc(sec(h.wk))}</p><h1 class="htitle">${esc(h.title)}</h1><p class="hsub">${esc(h.sub)}</p>
  <p class="sum">${esc(o.sum)}</p>${quote(h.quote)}${RULE}${bul(o.bul)}${o.terms && o.terms.length ? RULE + terms(o.terms) : ''}${crl(o.img)}</div>
</article>
<h2 class="seq-h">In this part</h2>
<div class="seq">
${seq.join('\n')}
</div>
${pager(partRef(parts[i - 1]), partRef(parts[i + 1]), `Part ${i + 1} of ${parts.length}`, 'Parts')}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': ['LearningResource', 'CollectionPage'], '@id': abs(p.url), url: abs(p.url), name: h.title, headline: h.title, alternativeHeadline: h.sub,
      description: describe(o.sum), inLanguage: 'en', learningResourceType: 'Study guide', educationalLevel: 'Introductory',
      isPartOf: COURSE_LD, publisher: PUBLISHER, primaryImageOfPage: imageLd(o.img),
      about: (o.terms || []).map(([t]) => ({ '@type': 'Thing', name: t })),
      hasPart: p.items.filter((it) => it.s.type === 'work').map((it) => ({ '@type': 'VisualArtwork', name: it.s.title, url: abs(it.url) })) },
    crumbLd(cr)] };
  write(p.url, page({ url: p.url, title, desc: describe(o.sum), image: o.img, imageAlt: c[1], body, ld }));
});

/* ---------- credits ---------- */
{
  const url = COURSE + '/credits.html';
  const order = [];
  parts.forEach((p) => { order.push(p.h.overview.img); p.items.forEach((it) => { if (it.s.type === 'work') order.push(it.s.key); if (it.s.type === 'theme') order.push(it.s.img); }); });
  const keys = [...new Set(order)].filter((k) => C[k]);
  const cr = [['Study', STUDY], [NAME, COURSE + '.html'], ['Image credits', url]];
  const body = `${crumbs(cr)}
${openGuide('credits')}
<article class="card slide text"><div class="notes"><p class="eyebrow">Sources</p><h1 class="htitle">Image credits</h1><p class="det"><a href="${COURSE}/sources.html">Sources and further reading</a></p><p class="sum">All images come from Wikimedia Commons and are marked public domain or CC0 there. Many are museum open-access files (Metropolitan Museum of Art, National Gallery of Art, Rijksmuseum); the rest are photographs or reproductions their authors released into the public domain. Follow each link for the file’s full record.</p>
<div class="cred">${keys.map((k) => { const c = C[k]; const au = (c.author || '').replace(/\s+/g, ' ').slice(0, 80); const w = workByKey[k];
    return `<div><b>${w ? `<a href="${w.url}">${esc(c.work)}</a>` : esc(c.work)}</b><br>File: <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.file)}</a><br>${esc(c.license)}${au ? ' · Author/source field: ' + esc(au) : ''}</div>`; }).join('\n')}</div></div></article>`;
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': abs(url), url: abs(url), name: `Image credits – ${NAME}`, isPartOf: COURSE_LD }, crumbLd(cr)] };
  write(url, page({ url, title: `Image credits – ${NAME}`, desc: `Sources and licenses for the ${keys.length} public-domain and CC0 images in ${NAME}, all from Wikimedia Commons.`, image: parts[0].h.overview.img, imageAlt: parts[0].h.overview.cap[1], body, ld, type: 'website' }));
}

/* ---------- sources and further reading ---------- */
{
  const url = COURSE + '/sources.html';
  const cr = [['Study', STUDY], [NAME, COURSE + '.html'], ['Sources and further reading', url]];
  const groups = SOURCES.groups.map((g) => `${RULE}<p class="lab">${esc(g.title)}</p><div class="cred">${g.items.map((it) => `<div>${it.html}${it.url ? ` <a href="${esc(it.url)}" target="_blank" rel="noopener">Link</a>` : ''}</div>`).join('\n')}</div>`).join('\n');
  const body = `${crumbs(cr)}
${openGuide('sources')}
<article class="card slide text"><div class="notes"><p class="eyebrow">Sources</p><h1 class="htitle">Sources and further reading</h1><p class="sum">${esc(SOURCES.intro)}</p>
${groups}
<p class="crl"><a href="${COURSE}/credits.html">Image credits</a></p></div></article>`;
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': abs(url), url: abs(url), name: `Sources and further reading – ${NAME}`, isPartOf: COURSE_LD, publisher: PUBLISHER }, crumbLd(cr)] };
  write(url, page({ url, title: `Sources and further reading – ${NAME}`, desc: `The textbook, articles on myth in art, and public-domain translations behind ${NAME}.`, image: parts[0].h.overview.img, imageAlt: parts[0].h.overview.cap[1], body, ld, type: 'website' }));
}

/* ---------- course home = the one-page guide (search, outline, Prev/Next, swipe) ---------- */
{
  const url = COURSE + '.html';
  let v = fs.readFileSync(path.join(__dirname, 'classical-myth-viewer.html'), 'utf8');
  const must = (a, b) => { if (!v.includes(a)) throw new Error('viewer changed; cannot find: ' + a.slice(0, 70)); v = v.replace(a, b); };
  const style = v.slice(v.indexOf('<style>') + 7, v.indexOf('</style>'));
  // the viewer's own color/font tokens give way to the site's (site-tokens.css), keeping its layout
  const t0 = style.indexOf(':root{'), t1 = style.indexOf('*{box-sizing:border-box}');
  if (t0 < 0 || t1 < t0) throw new Error('viewer tokens not found');
  const css = style.slice(0, t0) + `:root{
  --paper:var(--panel); --line:var(--border); --muted:var(--ink2); --navy:var(--accent-ink); --navy-ink:var(--on-accent);
  --clay:var(--ink3); --tint:var(--surface); --mat:var(--surface); --matink:var(--ink2); --serif:var(--font); --sans:var(--font);
}
` + style.slice(t1) + `
/* site integration (generated): site bar above, site footer below, site type, Greek-key divider kept */
body.guide-page{display:block;padding-top:calc(var(--nav-h) + 16px);font-weight:400}
.guide-page .rail{top:calc(var(--nav-h) + 16px);max-height:calc(100vh - var(--nav-h) - 40px);max-height:calc(100dvh - var(--nav-h) - 40px)}
@media (min-width:901px){.guide-page .main{height:calc(100vh - var(--nav-h) - 40px);height:calc(100dvh - var(--nav-h) - 40px)}.guide-page .main:has(.slide.text){height:auto}}
.guide-page .lb{z-index:120}
.guide-page .brand a{color:inherit;text-decoration:none}
.guide-page .brand,.guide-page .title,.guide-page .htitle,.guide-page .res .rt{color:var(--ink);font-weight:500}
.guide-page .ho[aria-current="true"],.guide-page .items button[aria-current="true"]{color:var(--accent-ink)}
.guide-page .wk,.guide-page .eyebrow,.guide-page .res .rk{color:var(--ink3);font-weight:500}
.guide-page .date{color:var(--ink2)}
.guide-page .fn b,.guide-page .cred b{color:var(--ink);font-weight:500}
.guide-page .terms dt{font-weight:500;color:var(--accent-ink)}
.guide-page .btn,.guide-page .search input,.guide-page .jump{border-color:var(--border-mid)}
.guide-page .btn{border-radius:22px;font-weight:500}
.guide-page .btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.guide-page .search input{border-radius:22px}
.guide-page blockquote{border-left-color:var(--accent)}
.guide-page .res mark{background:color-mix(in srgb,var(--accent) 22%,transparent)}
.guide-page .pic img{box-shadow:none}
.guide-page .rule{background:var(--key);opacity:.8;-webkit-mask:var(--key-mask) repeat-x left center/16px 8px;mask:var(--key-mask) repeat-x left center/16px 8px}
.guide-page :focus-visible{outline-color:var(--accent)}
.guide-page .bar .spacer{flex:1}
/* phones and portrait iPads: Prev / Next pinned to the bottom of the screen, bottom right */
@media (max-width:900px){
  .guide-page .bar{position:fixed;left:0;right:0;bottom:0;z-index:70;margin:0;justify-content:flex-end;gap:8px;
    background:var(--navbg);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid var(--border);
    padding:8px max(16px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
  .guide-page .bar .crumb,.guide-page .bar .spacer{display:none}
  body.guide-page{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))}
}
`;
  must(style, '');
  must('<title>Classical Myth in Art</title>', '');
  must('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
  must('<link rel="preconnect" href="https://fonts.googleapis.com">\n', '');
  v = v.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n/, '');
  must('<style></style>\n', '');
  // Prev / Next bar moves below the slide (bottom right), as on the rest of the study pages
  const barStart = v.indexOf('    <div class="bar">'), barEnd = v.indexOf('</div>', barStart) + 7;
  const bar = v.slice(barStart, barEnd);
  v = v.slice(0, barStart) + v.slice(barEnd);
  must('    <article class="slide" id="slide" aria-live="polite" tabindex="-1"></article>\n', '    <article class="slide" id="slide" aria-live="polite" tabindex="-1"></article>\n' + bar);
  // brand links home; images and data load from the course folder
  must('<p class="brand">Classical Myth in Art</p>', `<p class="brand"><a href="${url}">Classical Myth in Art</a></p>`);
  must("const src=k=>'img/'+k+'.jpg';", `const src=k=>'${COURSE}/img/'+k+'.jpg';`);
  for (const f of ['data.js', 'data_w34.js', 'data_w58.js', 'credits.js']) must(`<script src="${f}"></script>`, `<script src="${COURSE}/${f}"></script>`);
  must(`<script src="${COURSE}/credits.js"></script>`, `<script src="${COURSE}/credits.js"></script>\n<script src="${COURSE}/sources.js"></script>`);
  // no "free study guide" label and no authorship line (David, Oct 26 2026)
  // "Sources and further reading" slide, just before Image credits (data in sources.js)
  must("flat.push({h:99,kind:'credits',id:'credits',label:'Image credits'});", "flat.push({h:99,kind:'sources',id:'sources',label:'Sources and further reading'});\nflat.push({h:99,kind:'credits',id:'credits',label:'Image credits'});");
  must("} else if(f.kind==='credits'){", "} else if(f.kind==='sources'){\n    el.className='slide text'; const SR=window.SOURCES||{groups:[]};\n    h=`<div class=\"notes\"><p class=\"eyebrow\">Sources</p><h2 class=\"htitle\">Sources and further reading</h2><p class=\"sum\">${esc(SR.intro)}</p>${SR.groups.map(g=>`${rule}<p class=\"lab\">${esc(g.title)}</p><div class=\"cred\">${g.items.map(it=>`<div>${it.html}${it.url?` <a href=\"${esc(it.url)}\" target=\"_blank\" rel=\"noopener\">Link</a>`:''}</div>`).join('')}</div>`).join('')}</div>`;\n  } else if(f.kind==='credits'){");
  must("(f.kind==='credits'?'Credits':'Start')", "(f.kind==='credits'?'Credits':f.kind==='sources'?'Sources':'Start')");
  must('<p class="wk">Sources</p><button class="ho" data-i="${flat.length-1}">Image credits</button>', '<p class="wk">Sources</p><button class="ho" data-i="${flat.length-2}">Sources and further reading</button><button class="ho" data-i="${flat.length-1}">Image credits</button>');
  must("(f.kind==='credits'?'Sources':'Start')", "((f.kind==='credits'||f.kind==='sources')?'Sources':'Start')");
  must("else if(f.kind==='intro'||f.kind==='credits'){parts.push(f.label)}", "else if(f.kind==='intro'||f.kind==='credits'){parts.push(f.label)}\n  else if(f.kind==='sources'){const SR=window.SOURCES||{groups:[]};parts.push(f.label,SR.intro,...SR.groups.flatMap(g=>g.items.map(i=>i.html.replace(/<[^>]+>/g,''))))}");
  must("const k={overview:'Overview',theme:'Theme',intro:'Start',credits:'Credits'}[f.kind]", "const k={overview:'Overview',theme:'Theme',intro:'Start',credits:'Credits',sources:'Sources'}[f.kind]");
  // every slide change (Prev/Next, swipe, arrow keys, outline, search) starts at the top of the new slide
  must('function go(i){if(i==null||i<0||i>=flat.length)return;cur=i;render()}', 'function go(i){if(i==null||i<0||i>=flat.length)return;const ch=i!==cur;cur=i;render();if(ch)window.scrollTo(0,0)}');
  must('<p class="eyebrow">Free study guide</p>', '');
  must('\n    <p class="det">Text by David Nicholson · davidnicholsonart.com</p></div>`;', '</div>`;');
  const scripts = v.slice(v.indexOf('<script src='));
  const markup = v.slice(0, v.indexOf('<script src=')).trim();
  // a plain list of every part for readers without JavaScript (and for crawlers)
  const nojs = `<noscript><div style="max-width:900px;margin:20px auto;padding:0 16px"><p>${esc(NAME)}: the parts of the guide.</p><ul>${parts.map((p) => `<li><a href="${p.url}">${esc(p.h.title)}</a></li>`).join('')}<li><a href="${COURSE}/credits.html">Image credits</a></li></ul></div></noscript>`;
  const keyMask = `:root{--key-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8' viewBox='0 0 16 8'%3E%3Cpath d='M0 7.5h6V1.5H2v3h2' fill='none' stroke='black' stroke-width='1'/%3E%3Cpath d='M8 7.5h6V1.5h-4v3h2' fill='none' stroke='black' stroke-width='1'/%3E%3C/svg%3E")}`;
  const cr = [['Study', STUDY], [NAME, url]];
  const ld = { '@context': 'https://schema.org', '@graph': [
    Object.assign({}, COURSE_LD, { description: 'The stories of the Greek and Roman gods and heroes, told through paintings, sculpture, and vases.', inLanguage: 'en',
      learningResourceType: 'Study guide', educationalLevel: 'Introductory', publisher: PUBLISHER, isAccessibleForFree: true,
      hasPart: parts.map((p) => ({ '@type': 'LearningResource', name: p.h.title, url: abs(p.url) })) }),
    crumbLd(cr)] };
  write(url, page({ url, title: `${NAME} – Study – David Nicholson`,
    desc: 'A study guide to Greek and Roman myth in art: the gods and heroes through 170 paintings, sculptures, and vases, each with the story it shows and key terms.',
    image: parts[0].h.overview.img, imageAlt: parts[0].h.overview.cap[1], type: 'website', ld, guide: true,
    extraHead: `<style>\n${keyMask}\n${css}</style>\n`, body: markup + '\n' + nojs, extraScripts: scripts.trim() + '\n' }));
}

/* ---------- sitemap: replace this course's block in /sitemap.xml ---------- */
{
  const listed = [COURSE + '.html', ...parts.map((p) => p.url), ...works.map((w) => w.url), COURSE + '/sources.html', COURSE + '/credits.html'];
  const START = '  <!-- study: classical-myth (generated by tools/study/build-classical-myth.js) -->';
  const END = '  <!-- /study: classical-myth -->';
  const block = [START, ...listed.map((u) => `  <url>\n    <loc>${abs(u)}</loc>\n    <changefreq>yearly</changefreq>\n    <priority>${u === COURSE + '.html' ? '0.6' : '0.4'}</priority>\n  </url>`), END].join('\n');
  const smFile = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smFile, 'utf8');
  const a = sm.indexOf(START), b = sm.indexOf(END);
  sm = a >= 0 && b > a ? sm.slice(0, a) + block + sm.slice(b + END.length) : sm.replace('</urlset>', block + '\n</urlset>');
  fs.writeFileSync(smFile, sm);
}
console.log(`wrote ${out.length} pages (${works.length} works, ${parts.length} parts, home, credits)`);
