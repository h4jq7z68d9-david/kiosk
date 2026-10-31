#!/usr/bin/env node
/* Builds one art history study course: one real, indexable page per slide, all in the guide's layout.

   Run from the repo root:   node tools/study/build-course.js <course-slug>
   (node tools/study/build-classical-myth.js still works; it runs this with classical-myth.)
   Re-run after editing any data file; it rewrites every generated page.

   Settings: tools/study/courses/<course-slug>.json
     name            course name (required)
     dataFiles       data files in study/art-history/<slug>/, in order (required)
     greekKey        true = Greek-key divider (Classical Myth); otherwise a plain rule
     intro           optional: the start page's first paragraph
     introImg        required: image key (usually a work key) shown on the start page — every course starts with an image
     ldDescription, homeDescription, creditsIntro, creditsDescription, sourcesDescription
     imgFrom         optional: read images from another course's img/ folder
     basePath        optional: folder the course lives in (default /study/art-history; a technique course can use /study)
     themeLabel      optional: name for theme-layout pages (default Theme; a technique course uses Concept)
     subjLabel       optional: heading over a work page's subj text (default none; set a label to show one)
     imagesNote      optional: the start page's line about image rights (default: every image is public domain or CC0; "" leaves the line out)
   Theme slides may carry "alt" (alt text for a diagram; otherwise the title is used) and "label"
   (this page's own label in place of themeLabel, e.g. History).

   Paths below use the default basePath.
   Reads   study/art-history/<slug>/{<dataFiles>,credits.js,sources.js (optional)}
           study/art-history/<slug>/img/<key>.jpg                      (for width/height)
   Writes  study/art-history/<slug>.html                                course home = the start page
           study/art-history/<slug>/<section>/<part>.html               part overview
           study/art-history/<slug>/<section>/<work>.html               one page per work
           study/art-history/<slug>/<section>/{theme,note}-<title>.html one page per theme / text slide
           study/art-history/<slug>/{sources,credits}.html
           study/art-history/<slug>/index.js                            outline + search index (read by /study/guide.js)
           sitemap.xml                                                  replaces this course's block

   Content is never rewritten here: every title, paragraph, bullet, term and quote comes straight
   from the data files. Pages carry no <style> block and no color or font literals: layout is
   /study/guide.css, behavior /study/guide.js, colors and fonts /site-tokens.css, top bar
   /site-bar.js, menu /site-chrome.js. One edit to those files restyles every course. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const ORIGIN = 'https://davidnicholsonart.com';
const SLUG = process.argv[2];
if (!SLUG || !/^[a-z0-9-]+$/.test(SLUG)) { console.error('usage: node tools/study/build-course.js <course-slug>   (settings in tools/study/courses/<course-slug>.json)'); process.exit(1); }
const CFG_FILE = path.join(__dirname, 'courses', SLUG + '.json');
if (!fs.existsSync(CFG_FILE)) { console.error('no settings file: ' + CFG_FILE); process.exit(1); }
const CFG = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
for (const k of ['name', 'dataFiles', 'introImg']) if (!CFG[k]) throw new Error(`${CFG_FILE}: missing "${k}"`);
const BASE = (CFG.basePath || '/study/art-history').replace(/\/$/, '');
if (!/^\/study(\/[a-z0-9-]+)*$/.test(BASE)) throw new Error(`${CFG_FILE}: basePath must be /study or a folder under it`);
const COURSE = BASE + '/' + SLUG;
const DIR = path.join(ROOT, COURSE);
const IMG_COURSE = BASE + '/' + (CFG.imgFrom || SLUG);
const THEME = CFG.themeLabel || 'Theme';
const SUBJ = CFG.subjLabel == null ? '' : CFG.subjLabel;
const IMG_DIR = path.join(ROOT, IMG_COURSE, 'img');
const NAME = CFG.name;
const STUDY = '/study.html';
const HOME = COURSE + '.html';
const fill = (t) => String(t).replace(/\{name\}/g, NAME);
const srcOf = (c) => (c && c.source) || 'Wikimedia Commons';   // a credits entry may name its own source
const V = { tokens: 2, chrome: 11, bar: 3, guideCss: 13, guideJs: 10, search: 1 };   // bump to refresh browser caches

/* ---------- load data ---------- */
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);   // data files use both window.SITE and bare SITE
for (const f of [...CFG.dataFiles, 'credits.js', 'sources.js']) {
  const file = path.join(DIR, f);
  if (f === 'sources.js' && !fs.existsSync(file)) continue;
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: f });
}
const S = ctx.SITE;
const C = ctx.CREDITS || {};
const SRCS = ctx.SOURCES && ctx.SOURCES.groups && ctx.SOURCES.groups.length ? ctx.SOURCES : null;

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[’'`]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sec = (w) => (S.sections && S.sections[w]) || '';
const img = (k) => `${IMG_COURSE}/img/${k}.jpg`;
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
const dims = (k) => (DIMS[k] = DIMS[k] || jpegSize(path.join(IMG_DIR, k + '.jpg')));

function describe(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const first = (t.match(/^.+?[.!?](?=\s|$)/) || [t])[0];
  if (first.length >= 70 && first.length <= 160) return first;
  if (t.length <= 160) return t;
  const cut = t.slice(0, 156);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:–—-]$/, '') + '…';
}
const LICENSE_URL = { 'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/', 'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/' };

/* ---------- flatten the course into one ordered list of pages ---------- */
const flat = [];
flat.push({ h: 0, kind: 'intro', id: 'start', label: 'About this site', url: HOME });
const used = new Set([HOME]);
const claim = (u) => { if (used.has(u)) throw new Error('duplicate URL ' + u); used.add(u); return u; };
S.handouts.forEach((h) => {
  const secSlug = slug(sec(h.wk)) || 'part-' + h.n;
  const part = { h: h.n, kind: 'overview', d: h, hd: h, id: `h${h.n}-0`, label: 'Overview', url: claim(`${COURSE}/${secSlug}/${slug(h.title)}.html`) };
  flat.push(part);
  h.slides.forEach((s, i) => {
    const name = s.type === 'work' ? slug(s.title) : (s.type === 'theme' ? 'theme-' : 'note-') + slug(s.title);
    flat.push({ h: h.n, kind: s.type, d: s, hd: h, part, id: s.type === 'work' ? s.key : `h${h.n}-${i + 1}`, label: s.title, url: claim(`${COURSE}/${secSlug}/${name}.html`) });
  });
});
if (SRCS) flat.push({ h: 99, kind: 'sources', id: 'sources', label: 'Sources and further reading', url: claim(COURSE + '/sources.html') });
flat.push({ h: 99, kind: 'credits', id: 'credits', label: 'Image credits', url: claim(COURSE + '/credits.html') });
const byKey = {}; flat.forEach((f, i) => { if (f.kind === 'work') byKey[f.d.key] = i; });
const ids = new Set(); flat.forEach((f) => { if (ids.has(f.id)) throw new Error('duplicate slide id ' + f.id); ids.add(f.id); });
const HAS_THEMES = flat.some((f) => f.kind === 'theme');

/* ---------- slide markup ---------- */
const cap = (s) => [s.artist && esc(s.artist), '<i>' + esc(s.title) + '</i>', s.date && esc(s.date)].filter(Boolean).join(', ');
const terms = (t) => (t && t.length ? '<dl class="terms">' + t.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('') + '</dl>' : '');
const bul = (b) => (b && b.length ? '<ul class="b">' + b.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>' : '');
const quote = (q) => (q ? `<blockquote><p>“${esc(q.q)}”</p><cite>${esc(q.by)}</cite></blockquote>` : '');
const RULE = '<hr class="rule">';
const crl = (k) => { const c = C[k]; return c ? `<p class="crl">Image: <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(srcOf(c))}</a> · ${esc(c.license)}</p>` : ''; };
const pic = (k, alt, capHtml) => { const d = dims(k); return `<div class="pic"><img src="${img(k)}" width="${d.w}" height="${d.h}" alt="${esc(alt)}" data-cap="${esc(capHtml)}" tabindex="0" fetchpriority="high"></div>`; };
const wl = (keys) => `<ul class="wl">${keys.filter((k) => byKey[k] != null).map((k) => `<li><a class="wlink" href="${flat[byKey[k]].url}">${esc(flat[byKey[k]].d.title)}</a></li>`).join('')}</ul>`;
const partLink = (f) => `<a href="${f.part.url}">${esc(f.hd.title)}</a>`;
const themesOf = (key) => flat.filter((t) => t.kind === 'theme' && (t.d.works || []).includes(key));

function slideHtml(f) {
  const d = f.d;
  if (f.kind === 'intro') {
    const p1 = CFG.intro || 'Each page pairs one work of art with a short account of what it shows, how and why it was made, and the key names and terms.' + (HAS_THEMES ? ` ${THEME} pages step back to the bigger ideas that connect the works.` : '');
    const ik = CFG.introImg, iw = ik && byKey[ik] != null ? flat[byKey[ik]].d : null;   // optional start-page image: a work key
    if (ik && !C[ik]) throw new Error(`introImg "${ik}" has no credits entry`);
    return [ik ? 'slide' : 'slide text', (ik ? pic(ik, iw ? iw.title : ik, iw ? cap(iw) : esc(C[ik].work)) : '') + `<div class="notes intro"><p class="eyebrow">Study guide</p><h1 class="htitle">${esc(NAME)}</h1><p class="hsub">${esc(CFG.ldDescription || '')}</p>${RULE}
<p class="sum">${esc(p1)}</p>
<ul class="b"><li>Use the outline, the arrow keys, or Prev/Next to move between pages.</li><li>Click any image to see it full screen.</li><li>Use Bookmark to save a page, and Saved (top right) to find your saved pages again.</li>${CFG.imagesNote === '' ? '' : `<li>${esc(CFG.imagesNote || 'Every image is public domain or CC0; sources and licenses are listed under Image credits.')}</li>`}</ul>
<p class="contlink" id="contlink" hidden></p>
<p class="lab">Contents</p><ul class="wl">${flat.filter((x) => x.kind === 'overview').map((x) => `<li><a class="wlink" href="${x.url}">${esc(x.d.title)}</a></li>`).join('')}</ul>${ik ? crl(ik) : ''}</div>`];
  }
  if (f.kind === 'overview') {
    const o = d.overview, c = o.cap, ch = [c[0] && esc(c[0]), '<i>' + esc(c[1]) + '</i>', c[2] && esc(c[2])].filter(Boolean).join(', ');
    return ['slide', pic(o.img, c[1], ch) + `<div class="notes"><p class="eyebrow">${esc(sec(d.wk))}</p><h1 class="htitle">${esc(d.title)}</h1><p class="hsub">${esc(d.sub)}</p>
<p class="sum">${esc(o.sum)}</p>${quote(d.quote)}${RULE}${bul(o.bul)}${o.terms && o.terms.length ? RULE + terms(o.terms) : ''}
<p class="lab">Works in this part</p>${wl(d.slides.filter((s) => s.type === 'work').map((s) => s.key))}${crl(o.img)}</div>`];
  }
  if (f.kind === 'work') {
    const th = themesOf(d.key);
    const tail = (th.length ? `<p class="lab">${esc(THEME)}s</p><ul class="wl">${th.map((t) => `<li><a class="wlink" href="${t.url}">${esc(t.d.title)}</a></li>`).join('')}</ul>` : '') + crl(d.key);
    const head = `<p class="eyebrow">${esc(sec(f.hd.wk))}</p>${d.artist ? `<p class="artist">${esc(d.artist)}</p>` : ''}<h1 class="title">${esc(d.title)}</h1><p class="date">${esc(d.date)}</p>${d.det ? `<p class="det">${esc(d.det)}</p>` : ''}`;
    if (d.lead) {   // artwork-first format: lead paragraph, bullets, then the subject
      return ['slide', pic(d.key, d.title, cap(d)) + `<div class="notes">${head}
<p class="sum">${esc(d.lead)}</p>${bul(d.bul)}${d.subj ? RULE + (SUBJ ? `<p class="lab">${esc(SUBJ)}</p>` : '') + `<p class="sum">${esc(d.subj)}</p>` : ''}${terms(d.terms)}${quote(d.quote)}${tail}</div>`];
    }
    return ['slide', pic(d.key, d.title, cap(d)) + `<div class="notes">${head}
<p class="fn"><b>Made for:</b> ${esc(d.fn)}</p><p class="sum">${esc(d.sum)}</p>${RULE}${bul(d.bul)}${d.terms && d.terms.length ? RULE + terms(d.terms) : ''}${quote(d.quote)}${tail}</div>`];
  }
  if (f.kind === 'theme') {
    const w = byKey[d.img] != null ? cap(flat[byKey[d.img]].d) : (C[d.img] ? esc(C[d.img].work) : '');
    return ['slide', pic(d.img, d.alt || d.title, w) + `<div class="notes"><p class="eyebrow">${esc(d.label || THEME)} · ${esc(sec(f.hd.wk))}</p><h1 class="title plain">${esc(d.title)}</h1><p class="stmt">${esc(d.stmt)}</p><p class="sum">${esc(d.para)}</p>${RULE}${bul(d.bul)}${d.terms && d.terms.length ? RULE + terms(d.terms) : ''}
${d.works && d.works.length ? `<p class="lab">See</p>${wl(d.works)}` : ''}${quote(d.quote)}${crl(d.img)}</div>`];
  }
  if (f.kind === 'text') {
    return ['slide text', `<div class="notes"><p class="eyebrow">${esc(sec(f.hd.wk))}</p><h1 class="htitle">${esc(d.title)}</h1>${d.sub ? `<p class="hsub">${esc(d.sub)}</p>` : ''}<p class="sum">${esc(d.sum)}</p>${RULE}${bul(d.bul)}${RULE}${terms(d.terms)}</div>`];
  }
  if (f.kind === 'sources') {
    return ['slide text', `<div class="notes"><p class="eyebrow">Sources</p><h1 class="htitle">Sources and further reading</h1><p class="sum">${esc(SRCS.intro)}</p>
${SRCS.groups.map((g) => `${RULE}<p class="lab">${esc(g.title)}</p><div class="cred">${g.items.map((it) => `<div>${it.html}${it.url ? ` <a href="${esc(it.url)}" target="_blank" rel="noopener">Link</a>` : ''}</div>`).join('\n')}</div>`).join('\n')}
<p class="crl"><a href="${COURSE}/credits.html">Image credits</a></p></div>`];
  }
  // credits
  const keys = creditKeys();
  return ['slide text', `<div class="notes"><p class="eyebrow">Sources</p><h1 class="htitle">Image credits</h1>${SRCS ? `<p class="det"><a href="${COURSE}/sources.html">Sources and further reading</a></p>` : ''}<p class="sum">${esc(CFG.creditsIntro || 'Every image is public domain or CC0. Each entry below links to the file’s record with its source and license.')}</p>
<div class="cred">${keys.map((k) => { const c = C[k]; const au = (c.author || '').replace(/\s+/g, ' ').slice(0, 80); const w = byKey[k] != null ? flat[byKey[k]] : null;
    return `<div><b>${w ? `<a href="${w.url}">${esc(c.work)}</a>` : esc(c.work)}</b><br>File: <a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.file)}</a><br>${esc(c.license)}${au ? ' · Author/source field: ' + esc(au) : ''}</div>`; }).join('\n')}</div></div>`];
}
function creditKeys() {
  const order = [];
  flat.forEach((x) => { if (x.kind === 'overview') order.push(x.d.overview.img); if (x.kind === 'work') order.push(x.d.key); if (x.kind === 'theme') order.push(x.d.img); });
  return [...new Set(order)].filter((k) => C[k]);
}

/* ---------- per-course index: outline + search (read by /study/guide.js) ---------- */
function textOf(f) {
  const d = f.d || {}, p = [];
  if (f.kind === 'overview') { const o = d.overview; p.push(d.title, d.sub, o.sum, ...(o.bul || []), ...(o.terms || []).flat(), ...(o.cap || [])); }
  else if (f.kind === 'intro' || f.kind === 'credits') p.push(f.label);
  else if (f.kind === 'sources') p.push(f.label, SRCS.intro, ...SRCS.groups.flatMap((g) => g.items.map((i) => i.html.replace(/<[^>]+>/g, ''))));
  else p.push(d.title, d.artist, d.date, d.det, d.lead, d.fn, d.stmt, d.para, d.sum, d.sub, ...(d.bul || []), ...(d.terms || []).flat(), d.subj, d.quote && d.quote.q);
  return p.filter(Boolean).join(' · ');
}
const thumb = (f) => (f.kind === 'work' ? f.d.key : f.kind === 'theme' ? f.d.img : f.kind === 'overview' ? f.d.overview.img : null);
const GUIDE = {
  slug: SLUG, name: NAME, img: IMG_COURSE + '/img/', themeLabel: THEME,
  parts: S.handouts.map((h) => ({ h: h.n, title: h.title, section: sec(h.wk) })),
  items: flat.map((f) => ({ id: f.id, url: f.url, h: f.h, kind: f.kind, label: f.label, tlabel: (f.kind === 'theme' && f.d.label) || undefined, title: (f.d && f.d.title) || f.label, artist: (f.d && f.d.artist) || '', thumb: thumb(f), text: textOf(f) })),
};

/* ---------- SEO: title, description, image and JSON-LD per page ---------- */
const COURSE_LD = { '@type': ['LearningResource', 'CollectionPage'], '@id': abs(HOME) + '#course', name: NAME, url: abs(HOME) };
const PUBLISHER = { '@type': 'Person', name: 'David Nicholson', url: ORIGIN + '/' };
const imageLd = (k) => {
  const c = C[k] || {}; const d = dims(k);
  return { '@type': 'ImageObject', contentUrl: abs(img(k)), width: d.w, height: d.h, license: LICENSE_URL[c.license] || undefined, acquireLicensePage: c.page, creditText: c.page ? srcOf(c) : undefined };
};
const crumbLd = (list) => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(href) })) });
const FIRST_IMG = S.handouts[0].overview.img, FIRST_ALT = S.handouts[0].overview.cap[1];

function meta(f) {
  const d = f.d || {};
  const base = [['Study', STUDY], [NAME, HOME]];
  if (f.kind === 'intro') {
    return { title: `${NAME} – Study – David Nicholson`, desc: fill(CFG.homeDescription || '{name}: a study guide to the works, with the story and key terms for each.'), image: FIRST_IMG, alt: FIRST_ALT, type: 'website',
      ld: [Object.assign({}, COURSE_LD, { description: fill(CFG.ldDescription || '{name}: an illustrated study guide to the works and the stories they tell.'), inLanguage: 'en',
        learningResourceType: 'Study guide', educationalLevel: 'Introductory', publisher: PUBLISHER, isAccessibleForFree: true,
        hasPart: flat.filter((x) => x.kind === 'overview').map((x) => ({ '@type': 'LearningResource', name: x.d.title, url: abs(x.url) })) }), crumbLd(base)] };
  }
  if (f.kind === 'overview') {
    const o = d.overview, cr = [...base, [d.title, f.url]];
    return { title: `${d.title} – ${NAME}`, desc: describe(o.sum), image: o.img, alt: o.cap[1], type: 'article',
      ld: [{ '@type': ['LearningResource', 'CollectionPage'], '@id': abs(f.url), url: abs(f.url), name: d.title, headline: d.title, alternativeHeadline: d.sub,
        description: describe(o.sum), inLanguage: 'en', learningResourceType: 'Study guide', educationalLevel: 'Introductory',
        isPartOf: COURSE_LD, publisher: PUBLISHER, primaryImageOfPage: imageLd(o.img),
        about: (o.terms || []).map(([t]) => ({ '@type': 'Thing', name: t })),
        hasPart: d.slides.filter((s) => s.type === 'work').map((s) => ({ '@type': 'VisualArtwork', name: s.title, url: abs(flat[byKey[s.key]].url) })) }, crumbLd(cr)] };
  }
  if (f.kind === 'work') {
    const cr = [...base, [f.hd.title, f.part.url], [d.title, f.url]];
    const text = d.lead || d.sum, title = `${d.artist ? `${d.artist}, ${d.title}` : d.title} – ${NAME}`;
    return { title, desc: describe(text), image: d.key, alt: d.title, type: 'article',
      ld: [{ '@type': 'VisualArtwork', '@id': abs(f.url) + '#work', name: d.title, url: abs(f.url), description: text,
        creator: d.artist ? { '@type': 'Person', name: d.artist } : undefined, artMedium: d.det ? d.det.split(' · ')[0] : undefined, image: imageLd(d.key) },
      { '@type': 'WebPage', '@id': abs(f.url), url: abs(f.url), name: title, description: describe(text), inLanguage: 'en',
        about: { '@id': abs(f.url) + '#work' }, isPartOf: COURSE_LD, publisher: PUBLISHER, primaryImageOfPage: imageLd(d.key) }, crumbLd(cr)] };
  }
  if (f.kind === 'theme' || f.kind === 'text') {
    const cr = [...base, [f.hd.title, f.part.url], [d.title, f.url]];
    const text = f.kind === 'theme' ? d.para : d.sum, im = f.kind === 'theme' ? d.img : f.hd.overview.img;
    return { title: `${d.title} – ${NAME}`, desc: describe(text), image: im, alt: f.kind === 'theme' ? (d.alt || d.title) : f.hd.overview.cap[1], type: 'article',
      ld: [{ '@type': 'LearningResource', '@id': abs(f.url), url: abs(f.url), name: d.title, description: describe(text), inLanguage: 'en',
        learningResourceType: 'Study guide', isPartOf: COURSE_LD, publisher: PUBLISHER, primaryImageOfPage: imageLd(im) }, crumbLd(cr)] };
  }
  if (f.kind === 'sources') {
    const cr = [...base, ['Sources and further reading', f.url]];
    return { title: `Sources and further reading – ${NAME}`, desc: fill(CFG.sourcesDescription || 'The sources and further reading behind {name}.'), image: FIRST_IMG, alt: FIRST_ALT, type: 'website',
      ld: [{ '@type': 'WebPage', '@id': abs(f.url), url: abs(f.url), name: `Sources and further reading – ${NAME}`, isPartOf: COURSE_LD, publisher: PUBLISHER }, crumbLd(cr)] };
  }
  const cr = [...base, ['Image credits', f.url]];
  return { title: `Image credits – ${NAME}`, desc: fill((CFG.creditsDescription || 'Sources and licenses for the {count} public-domain and CC0 images in {name}.').replace('{count}', creditKeys().length)), image: FIRST_IMG, alt: FIRST_ALT, type: 'website',
    ld: [{ '@type': 'WebPage', '@id': abs(f.url), url: abs(f.url), name: `Image credits – ${NAME}`, isPartOf: COURSE_LD, publisher: PUBLISHER }, crumbLd(cr)] };
}

/* ---------- page shell ---------- */
const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-FL5BKJFVXF"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-FL5BKJFVXF');</script>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,700;1,400;1,500&display=swap">`;
const NAV = `<nav data-chrome-nav></nav>
<script src="/site-bar.js?v=${V.bar}"></script>
<div id="menu-scrim"></div>
<div id="menu-panel" aria-label="site menu"></div>`;
const BM_ICON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 2.5h9v15l-4.5-3.6-4.5 3.6z"/></svg>';
const SEARCH_ICON = '<svg class="sico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.6 12.6l4.4 4.4"/></svg>';
const OUTLINE = `<p><a class="ho" href="${HOME}">About this site</a></p>` + flat.filter((x) => x.kind === 'overview').map((x) => `<p><a class="ho" href="${x.url}">${esc(x.d.title)}</a></p>`).join('')
  + flat.filter((x) => x.h === 99).map((x) => `<p><a class="ho" href="${x.url}">${esc(x.label)}</a></p>`).join('');

function crumbHtml(f) {
  // desktop only (hidden on phones): Study › lane › course › part; the last item is the current page, not a link
  const lane = BASE === '/study' ? ['Technique', STUDY + '#technique'] : ['Art history', STUDY];   // study.html opens on art history
  const a = ([t, h]) => `<a href="${h}">${esc(t)}</a>`, here = (t) => `<span aria-current="page">${esc(t)}</span>`, sep = ' <span class="sep" aria-hidden="true">›</span> ';
  const head = [a(['Study', STUDY]), a(lane)];
  // narrow desktops show only Study › lane (the rail already names the course and part), so links are never cut off
  const tail = (items) => `<span class="tail">${sep}${items.join(sep)}</span>`;
  if (f.kind === 'intro') return head.join(sep) + tail([here(NAME)]);
  const course = a([NAME, HOME]);
  if (f.h === 99) return head.join(sep) + tail([course, here(f.label)]);
  const p = f.part || f;
  return head.join(sep) + tail([course, f.kind === 'overview' ? here(f.hd.title) : a([f.hd.title, p.url])]);
}

function pageHtml(f, i) {
  const [cls, inner] = slideHtml(f), prev = flat[i - 1], next = flat[i + 1], m = meta(f), u = abs(f.url), im = dims(m.image);
  const ld = { '@context': 'https://schema.org', '@graph': m.ld };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.desc)}">
<link rel="canonical" href="${u}">
<meta property="og:type" content="${m.type}">
<meta property="og:site_name" content="David Nicholson">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.desc)}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${abs(img(m.image))}">
<meta property="og:image:width" content="${im.w}">
<meta property="og:image:height" content="${im.h}">
<meta property="og:image:alt" content="${esc(m.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(m.title)}">
<meta name="twitter:description" content="${esc(m.desc)}">
<meta name="twitter:image" content="${abs(img(m.image))}">
<meta name="twitter:image:alt" content="${esc(m.alt)}">
<meta name="color-scheme" content="light">
${GA}
<link rel="icon" type="image/png" sizes="96x96" href="/favicon96.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon180.png">
${FONTS}
<link rel="stylesheet" href="/site-tokens.css?v=${V.tokens}">
<link rel="stylesheet" href="/site-chrome.css?v=${V.chrome}">
<link rel="stylesheet" href="/site-bar.css?v=${V.bar}">
<link rel="stylesheet" href="/study/guide.css?v=${V.guideCss}">
${prev ? `<link rel="prev" href="${prev.url}">\n` : ''}${next ? `<link rel="next" href="${next.url}">\n` : ''}<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body class="guide-page${CFG.greekKey === true ? ' greek-key' : ''}" data-id="${esc(f.id)}">
${NAV}
<div class="app" id="app">
  <nav class="rail" aria-label="Outline" id="rail">
    <p class="brand"><a href="${HOME}">${esc(NAME)}</a></p>
    <p class="brandsub">${esc(CFG.ldDescription || '')}</p>
    <div id="outline">${OUTLINE}</div>
  </nav>
  <main class="main" id="main">
    <div class="topbar">
      <div class="search" id="search" role="search">${SEARCH_ICON}
        <input id="q" type="search" placeholder="Search all courses…" aria-label="Search all study courses" autocomplete="off" aria-controls="results" aria-expanded="false">
        <div class="results" id="results" role="listbox" hidden></div>
      </div>
      <button class="btn savedbtn" id="saved" type="button" aria-expanded="false" aria-controls="savedp">Saved (0)</button>
      <div class="savedp" id="savedp" hidden></div>
    </div>
    <select id="jump" class="jump" aria-label="Jump to page"></select>
    <article class="${cls}" id="slide" tabindex="-1">${inner}</article>
    <div class="bar">
      <button class="btn tog" id="tog" type="button" aria-controls="rail" aria-expanded="true" aria-label="Hide outline" title="Hide outline"></button>
      <nav class="crumb" aria-label="Breadcrumb">${crumbHtml(f)}</nav>
      <span class="spacer"></span>
      <span class="pos">${i + 1} / ${flat.length}</span>
      <button class="btn bm" id="bm" type="button" aria-pressed="false">${BM_ICON}<span class="bmt">Bookmark</span></button>
      ${prev ? `<a class="btn" id="prev" rel="prev" href="${prev.url}" title="${esc((prev.d && prev.d.title) || prev.label)}">← Prev</a>` : '<a class="btn" id="prev" aria-disabled="true">← Prev</a>'}
      ${next ? `<a class="btn primary" id="next" rel="next" href="${next.url}" title="${esc((next.d && next.d.title) || next.label)}">Next →</a>` : '<a class="btn primary" id="next" aria-disabled="true">Next →</a>'}
    </div>
  </main>
</div>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Enlarged image"><button class="x" id="lbx" type="button">Close ✕</button><img id="lbimg" alt=""><p class="cap" id="lbcap"></p></div>
<script src="${COURSE}/index.js?v=${INDEX_V}"></script>
<script src="/study/search.js?v=${V.search}"></script>
<script src="/study/guide.js?v=${V.guideJs}"></script>
<script src="/site-chrome.js?v=${V.chrome}"></script>
</body>
</html>
`;
}

/* ---------- write ---------- */
// clear earlier generated pages: every sub-folder of the course that holds only .html files (img/ is kept)
for (const n of fs.existsSync(DIR) ? fs.readdirSync(DIR) : []) {
  const p = path.join(DIR, n);
  if (n !== 'img' && fs.statSync(p).isDirectory() && fs.readdirSync(p).every((x) => x.endsWith('.html'))) fs.rmSync(p, { recursive: true, force: true });
}
const indexJs = 'window.GUIDE=' + JSON.stringify(GUIDE).replace(/</g, '\\u003c') + ';\n';
const INDEX_V = require('crypto').createHash('sha1').update(indexJs).digest('hex').slice(0, 8);   // changes whenever the index does
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, 'index.js'), indexJs);
const out = [];
flat.forEach((f, i) => {
  const file = path.join(ROOT, f.url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pageHtml(f, i));
  out.push(f.url);
});

/* ---------- sitemap: replace this course's block in /sitemap.xml ---------- */
{
  const START_PREFIX = `  <!-- study: ${SLUG} (`;
  const START = `${START_PREFIX}generated by tools/study/build-course.js) -->`;
  const END = `  <!-- /study: ${SLUG} -->`;
  const block = [START, ...out.map((u) => `  <url>\n    <loc>${abs(u)}</loc>\n    <changefreq>yearly</changefreq>\n    <priority>${u === HOME ? '0.6' : '0.4'}</priority>\n  </url>`), END].join('\n');
  const smFile = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smFile, 'utf8');
  const a = sm.indexOf(START_PREFIX), b = sm.indexOf(END);
  sm = a >= 0 && b > a ? sm.slice(0, a) + block + sm.slice(b + END.length) : sm.replace('</urlset>', block + '\n</urlset>');
  fs.writeFileSync(smFile, sm);
}

/* ---------- checks: public-site wording, and no page-by-page styling ---------- */
const BAD = /Free study guide|Text by David Nicholson|\bWeek \d/;
const STYLED = /<style|\sstyle="|#[0-9a-f]{3,8}\b(?![^<]*<\/script)|rgba?\(/i;
for (const u of out) {
  const html = fs.readFileSync(path.join(ROOT, u), 'utf8');
  const m = html.match(BAD);
  if (m) throw new Error(`${u}: public-site rule broken (found "${m[0]}")`);
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/href="[^"]*"/g, '');   // ignore scripts and #fragments in links
  const s = body.match(STYLED);
  if (s) throw new Error(`${u}: styling in the page (found "${s[0]}") — put it in /study/guide.css`);
}
const nWorks = flat.filter((f) => f.kind === 'work').length, nParts = flat.filter((f) => f.kind === 'overview').length;
{ const r = require('./build-search')(); console.log(`search index (all courses): ${r.items} pages, ${Math.round(r.bytes / 1024)} KB`); }
console.log(`wrote ${out.length} pages (${nWorks} works, ${nParts} parts, ${out.length - nWorks - nParts} other) + index.js; sitemap block ${out.length} URLs`);
