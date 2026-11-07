/* Shared behavior for every study-guide page (all courses).
   Reads window.GUIDE (per-course index.js). Pages work without this script: the slide,
   Prev/Next links and the part links are plain HTML. This adds the outline, search,
   Bookmarks, keyboard, swipe and the full-screen image. */
/* Phones and portrait iPads: move the Prev/Next bar out of the scrolling .app to sit under it (see guide.css). */
(function () {
  const bar = document.querySelector('.main > .bar'); if (!bar || !window.matchMedia) return;
  const home = bar.parentNode, mq = window.matchMedia('(max-width:900px)');
  const place = () => {
    if (mq.matches) { if (bar.parentNode !== document.body) document.body.insertBefore(bar, document.getElementById('app').nextSibling); }
    else if (bar.parentNode !== home) home.appendChild(bar);
  };
  place(); if (mq.addEventListener) mq.addEventListener('change', place); else if (mq.addListener) mq.addListener(place);
})();
(function () {
  const G = window.GUIDE; if (!G) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const KB = 'study:' + G.slug + ':saved', KR = 'study:' + G.slug + ':rail';
  const items = G.items, byId = {}; items.forEach((it, i) => { it.i = i; byId[it.id] = it; });
  const curId = document.body.dataset.id, cur = byId[curId] || items[0], curH = cur.h;
  const partTitle = (h) => { const p = G.parts.find((x) => x.h === h); return p ? p.title : (h === 99 ? 'Sources' : 'Start'); };

  /* outline */
  /* a course home that is its own page (several parts) heads the outline under the course name; a one-part course's home is its part overview */
  const out = $('outline'); let html = items[0].kind === 'intro' ? `<a class="ho" href="${items[0].url}"${cur.i === 0 ? ' aria-current="page"' : ''}>${esc(items[0].label)}</a>` : '', lastWk = null;
  G.parts.forEach((p) => {
    if (p.section !== lastWk) { html += `<p class="wk">${esc(p.section)}</p>`; lastWk = p.section; }
    const its = items.filter((x) => x.h === p.h);
    const li = (x) => `<li><a href="${x.url}" class="${x.kind === 'theme' ? 'th' : ''}"${x.id === curId ? ' aria-current="page"' : ''}>${x.kind === 'theme' ? esc(x.tlabel || G.themeLabel || 'Theme') + ': ' : ''}${esc(x.label)}</a></li>`;
    if (p.only) { html += `<div class="grp" data-h="${p.h}"><ul class="items open">${its.map(li).join('')}</ul></div>`; return; }   // one-part course: no part heading
    html += `<div class="grp" data-h="${p.h}"><a class="ho" href="${its[0].url}"${its[0].id === curId ? ' aria-current="page"' : ''}>${esc(p.title)}</a><ul class="items${p.h === curH ? ' open' : ''}">${its.map(li).join('')}</ul></div>`;
  });
  html += '<p class="wk">Sources</p>' + items.filter((x) => x.h === 99).map((x) => `<a class="ho" href="${x.url}"${x.id === curId ? ' aria-current="page"' : ''}>${esc(x.label)}</a>`).join('');
  out.innerHTML = html;
  const rail = $('rail');
  try { const y = sessionStorage.getItem(KR); if (y != null) rail.scrollTop = +y; } catch (e) {}
  const here = out.querySelector('.items a[aria-current="page"]');
  if (here) { const r = here.getBoundingClientRect(), rr = rail.getBoundingClientRect(); if (r.top < rr.top || r.bottom > rr.bottom) here.scrollIntoView({ block: 'center' }); }
  out.addEventListener('click', () => { try { sessionStorage.setItem(KR, String(rail.scrollTop)); } catch (e) {} });

  /* jump select (small screens) */
  const j = $('jump'); let o = '', g = null;
  items.forEach((it) => { const gt = partTitle(it.h); if (gt !== g) { if (g !== null) o += '</optgroup>'; o += `<optgroup label="${esc(gt)}">`; g = gt; } o += `<option value="${it.url}"${it.id === curId ? ' selected' : ''}>${esc(it.kind === 'overview' && it.label === 'Overview' ? gt : it.label)}</option>`; });
  j.innerHTML = o + '</optgroup>'; j.onchange = () => { location.href = j.value; };

  /* rail toggle */
  const app = $('app'), tog = $('tog');
  tog.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M7.5 3.5v13"/></svg>';
  function setRail(open) { app.classList.toggle('collapsed', !open); tog.setAttribute('aria-expanded', String(open)); tog.setAttribute('aria-label', open ? 'Hide outline' : 'Show outline'); tog.title = open ? 'Hide outline' : 'Show outline'; store.set(KR + ':open', open); }
  setRail(store.get(KR + ':open', true) !== false); tog.onclick = () => setRail(app.classList.contains('collapsed'));

  /* bookmarks: the Bookmarks button appears once a page is bookmarked */
  let saved = store.get(KB, []).filter((id) => byId[id]);
  const savedBtn = $('saved'), panel = $('savedp'), bm = $('bm');
  function paint() {
    savedBtn.textContent = 'Bookmarks (' + saved.length + ')';
    savedBtn.hidden = !saved.length;
    if (!saved.length) { panel.hidden = true; savedBtn.setAttribute('aria-expanded', 'false'); }
    const on = saved.includes(curId); bm.setAttribute('aria-pressed', String(on)); bm.querySelector('.bmt').textContent = on ? 'Bookmarked' : 'Bookmark';
    bm.querySelector('svg').setAttribute('fill', on ? 'currentColor' : 'none');
    panel.innerHTML = '<h2>Bookmarks</h2><ul>' + saved.map((id) => `<li><a href="${byId[id].url}">${esc(byId[id].title)}<small>${esc(partTitle(byId[id].h))}</small></a><button type="button" data-rm="${id}" aria-label="Remove ${esc(byId[id].title)} from bookmarks">✕</button></li>`).join('') + '</ul><p class="note">Kept in this browser only.</p>';
    panel.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { saved = saved.filter((x) => x !== b.dataset.rm); store.set(KB, saved); paint(); }; });
  }
  bm.onclick = () => { saved = saved.includes(curId) ? saved.filter((x) => x !== curId) : saved.concat(curId); store.set(KB, saved); paint(); };
  savedBtn.onclick = (e) => { e.stopPropagation(); const open = panel.hidden; panel.hidden = !open; savedBtn.setAttribute('aria-expanded', String(open)); };
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== savedBtn) { panel.hidden = true; savedBtn.setAttribute('aria-expanded', 'false'); } });
  paint();

  /* prefetch neighbors */
  ['prev', 'next'].forEach((r) => { const a = $(r); if (a && a.href) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l); } });
  const go = (d) => { const a = $(d > 0 ? 'next' : 'prev'); if (a && a.getAttribute('href')) location.href = a.href; };

  /* lightbox: steps through every image in the course, as the original guide did.
     Neighbouring pages are fetched for their image; closing goes to the page last shown. */
  const lb = $('lb'), lbi = $('lbimg'), lbc = $('lbcap');
  const pics = items.filter((x) => x.thumb || x.id === curId && document.querySelector('.pic img'));
  let lbAt = cur, lbSeq = 0; const lbCache = {};
  function picOf(it) {
    if (it.id === curId) { const im = document.querySelector('.pic img'); return Promise.resolve(im ? { src: im.src, alt: im.alt, cap: im.dataset.cap || '' } : null); }
    if (!lbCache[it.id]) lbCache[it.id] = fetch(it.url).then((r) => r.ok ? r.text() : Promise.reject()).then((t) => {
      const im = new DOMParser().parseFromString(t, 'text/html').querySelector('.pic img');
      return im ? { src: new URL(im.getAttribute('src'), location.href).href, alt: im.alt, cap: im.dataset.cap || '' } : null;
    }).catch(() => { delete lbCache[it.id]; return null; });
    return lbCache[it.id];
  }
  function showLb(it, p) { lbAt = it; lbi.src = p.src; lbi.alt = p.alt; lbc.innerHTML = p.cap; const k = pics.indexOf(it); $('lbp').disabled = k <= 0; $('lbn').disabled = k < 0 || k >= pics.length - 1; }
  function openLb() { picOf(cur).then((p) => { if (!p) return; showLb(cur, p); lb.hidden = false; $('lbx').focus(); stepLb(0); }); }
  function stepLb(d) {
    const k = pics.indexOf(lbAt); if (k < 0) return;
    if (d === 0) { [pics[k - 1], pics[k + 1]].forEach((x) => { if (x) picOf(x).then((p) => { if (p) new Image().src = p.src; }); }); return; }
    const it = pics[k + d]; if (!it) return; const seq = ++lbSeq;
    picOf(it).then((p) => { if (!p || seq !== lbSeq || lb.hidden) return; showLb(it, p); stepLb(0); });
  }
  function closeLb() { lb.hidden = true; lbSeq++; if (lbAt !== cur) { location.href = lbAt.url; return; } const im = document.querySelector('.pic img'); im && im.focus(); }
  document.querySelectorAll('.pic img').forEach((im) => { im.onclick = openLb; im.onkeydown = (e) => { if (e.key === 'Enter') openLb(); }; });
  lb.onclick = (e) => { if (e.target === lb || e.target === lbi) closeLb(); }; $('lbx').onclick = closeLb;
  if ($('lbp')) { $('lbp').onclick = (e) => { e.stopPropagation(); stepLb(-1); }; $('lbn').onclick = (e) => { e.stopPropagation(); stepLb(1); }; }

  /* keys */
  const qi = $('q'), rs = $('results');
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); qi.focus(); return; }
    if (/SELECT|INPUT|TEXTAREA/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!lb.hidden) { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') stepLb(1); if (e.key === 'ArrowLeft') stepLb(-1); return; }
    if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; }
  });

  /* search: across every study course (/study/search.js); this course's results come first */
  if (window.StudySearch) window.StudySearch.attach({ input: qi, results: rs, box: $('search'), current: G.slug, guide: G });

  /* swipe */
  (function () {
    let x0 = null, y0 = null, t0 = 0;
    const sl = $('slide');
    sl.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    const ts = (e) => { if (e.touches.length !== 1) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); };
    const te = (fn) => (e) => { if (x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Date.now() - t0 > 800) return; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) fn(dx < 0 ? 1 : -1); };
    sl.addEventListener('touchend', te(go), { passive: true });
    lb.addEventListener('touchstart', ts, { passive: true }); lb.addEventListener('touchend', te(stepLb), { passive: true });
  })();
})();
