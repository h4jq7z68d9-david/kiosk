/* Shared behavior for every study-guide page (all courses).
   Reads window.GUIDE (per-course index.js). Pages work without this script: the slide,
   Prev/Next links and the part links are plain HTML. This adds the outline, search,
   Saved pages, Continue, keyboard, swipe and the full-screen image. */
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
  const KB = 'study:' + G.slug + ':saved', KL = 'study:' + G.slug + ':last', KR = 'study:' + G.slug + ':rail';
  const items = G.items, byId = {}; items.forEach((it, i) => { it.i = i; byId[it.id] = it; });
  const curId = document.body.dataset.id, cur = byId[curId] || items[0], curH = cur.h;
  const partTitle = (h) => { const p = G.parts.find((x) => x.h === h); return p ? p.title : (h === 99 ? 'Sources' : 'Start'); };

  /* outline */
  const out = $('outline'); let html = `<a class="ho" href="${items[0].url}"${cur.i === 0 ? ' aria-current="page"' : ''}>About this site</a>`, lastWk = null;
  G.parts.forEach((p) => {
    if (p.section !== lastWk) { html += `<p class="wk">${esc(p.section)}</p>`; lastWk = p.section; }
    const its = items.filter((x) => x.h === p.h);
    html += `<div class="grp" data-h="${p.h}"><a class="ho" href="${its[0].url}"${its[0].id === curId ? ' aria-current="page"' : ''}>${esc(p.title)}</a><ul class="items${p.h === curH ? ' open' : ''}">${its.map((x) => `<li><a href="${x.url}" class="${x.kind === 'theme' ? 'th' : ''}"${x.id === curId ? ' aria-current="page"' : ''}>${x.kind === 'theme' ? esc(x.tlabel || G.themeLabel || 'Theme') + ': ' : ''}${esc(x.label)}</a></li>`).join('')}</ul></div>`;
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
  items.forEach((it) => { const gt = partTitle(it.h); if (gt !== g) { if (g !== null) o += '</optgroup>'; o += `<optgroup label="${esc(gt)}">`; g = gt; } o += `<option value="${it.url}"${it.id === curId ? ' selected' : ''}>${esc(it.kind === 'overview' ? gt : it.label)}</option>`; });
  j.innerHTML = o + '</optgroup>'; j.onchange = () => { location.href = j.value; };

  /* rail toggle */
  const app = $('app'), tog = $('tog');
  tog.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M7.5 3.5v13"/></svg>';
  function setRail(open) { app.classList.toggle('collapsed', !open); tog.setAttribute('aria-expanded', String(open)); tog.setAttribute('aria-label', open ? 'Hide outline' : 'Show outline'); tog.title = open ? 'Hide outline' : 'Show outline'; store.set(KR + ':open', open); }
  setRail(store.get(KR + ':open', true) !== false); tog.onclick = () => setRail(app.classList.contains('collapsed'));

  /* saved pages, bookmark, continue */
  let saved = store.get(KB, []).filter((id) => byId[id]);
  const savedBtn = $('saved'), panel = $('savedp'), bm = $('bm');
  function paint() {
    savedBtn.textContent = 'Saved (' + saved.length + ')';
    const on = saved.includes(curId); bm.setAttribute('aria-pressed', String(on)); bm.querySelector('.bmt').textContent = on ? 'Bookmarked' : 'Bookmark';
    bm.querySelector('svg').setAttribute('fill', on ? 'currentColor' : 'none');
    const lastId = store.get(KL, null), lastIt = lastId && byId[lastId];
    const cont = lastIt && lastIt.id !== curId ? `<a class="cont" href="${lastIt.url}">Continue: ${esc(lastIt.title)}</a>` : '';
    panel.innerHTML = cont + '<h2>Saved pages</h2>' + (saved.length ? '<ul>' + saved.map((id) => `<li><a href="${byId[id].url}">${esc(byId[id].title)}<small>${esc(partTitle(byId[id].h))}</small></a><button type="button" data-rm="${id}" aria-label="Remove ${esc(byId[id].title)} from saved">✕</button></li>`).join('') + '</ul>' : '<p class="none">Nothing saved yet. Use Bookmark on any page.</p>') + '<p class="note">Saved in this browser only.</p>';
    panel.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { saved = saved.filter((x) => x !== b.dataset.rm); store.set(KB, saved); paint(); }; });
    const cl = $('contlink'); if (cl) { if (lastIt && lastIt.id !== curId) { cl.innerHTML = `<a href="${lastIt.url}">Continue where you left off: ${esc(lastIt.title)}</a>`; cl.hidden = false; } else cl.hidden = true; }
  }
  bm.onclick = () => { saved = saved.includes(curId) ? saved.filter((x) => x !== curId) : saved.concat(curId); store.set(KB, saved); paint(); };
  savedBtn.onclick = (e) => { e.stopPropagation(); const open = panel.hidden; panel.hidden = !open; savedBtn.setAttribute('aria-expanded', String(open)); };
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== savedBtn) { panel.hidden = true; savedBtn.setAttribute('aria-expanded', 'false'); } });
  if (cur.id !== 'start') store.set(KL, curId);
  paint();

  /* prefetch neighbors */
  ['prev', 'next'].forEach((r) => { const a = $(r); if (a && a.href) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l); } });
  const go = (d) => { const a = $(d > 0 ? 'next' : 'prev'); if (a && a.getAttribute('href')) location.href = a.href; };

  /* lightbox (current page's image) */
  const lb = $('lb'), lbi = $('lbimg'), lbc = $('lbcap');
  function openLb(im) { lbi.src = im.src; lbi.alt = im.alt; lbc.innerHTML = im.dataset.cap || ''; lb.hidden = false; $('lbx').focus(); }
  function closeLb() { lb.hidden = true; const im = document.querySelector('.pic img'); im && im.focus(); }
  document.querySelectorAll('.pic img').forEach((im) => { im.onclick = () => openLb(im); im.onkeydown = (e) => { if (e.key === 'Enter') openLb(im); }; });
  lb.onclick = (e) => { if (e.target === lb || e.target === lbi) closeLb(); }; $('lbx').onclick = closeLb;

  /* keys */
  const qi = $('q'), rs = $('results');
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); qi.focus(); return; }
    if (/SELECT|INPUT|TEXTAREA/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!lb.hidden) { if (e.key === 'Escape') closeLb(); return; }
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
    sl.addEventListener('touchend', (e) => { if (x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Date.now() - t0 > 800) return; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1); }, { passive: true });
  })();
})();

/* Color wheel pop-up (Oct 31 2026): the top-bar wheel button opens /study/color-wheel.html?embed=1 in a
   panel (desktop: slides in from the right over the notes; phones and portrait iPads: full screen),
   so the reader keeps their place. Back, Escape or Close shuts it. The frame never changes size once
   made (it slides in and out), because resizing an iframe on iOS eats the next tap inside it
   (see Color-Wheel-App-Reference.md). Ctrl/Cmd-click still opens the full page. */
(function () {
  const btn = document.querySelector('.wheelbtn'); if (!btn) return;
  let sheet = null, open = false;
  function make() {
    sheet = document.createElement('div');
    sheet.className = 'wheelsheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Color wheel');
    sheet.innerHTML = '<div class="wsbar"><span class="wsgrab" aria-hidden="true"></span><a class="wsfull" href="/study/color-wheel.html">Open full page</a><button type="button" class="btn wsx" aria-label="Close"><span class="wsxt">Close </span>✕</button></div><iframe title="Color wheel" src="/study/color-wheel.html?embed=1"></iframe>';
    const scrim = document.createElement('div'); scrim.className = 'wheelscrim';
    document.body.appendChild(scrim); document.body.appendChild(sheet);
    sheet.querySelector('.wsx').onclick = () => close(true);
    /* phones: swipe down on the sheet's top bar closes it */
    const bar = sheet.querySelector('.wsbar'); let y0 = null;
    bar.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    bar.addEventListener('touchend', (e) => { if (y0 != null && e.changedTouches[0].clientY - y0 > 50) close(true); y0 = null; }, { passive: true });
    scrim.onclick = () => close(true);
  }
  function show() {
    if (!sheet) make();
    if (open) return; open = true;
    document.body.classList.add('wheel-open'); btn.setAttribute('aria-expanded', 'true');
    try { history.pushState({ wheel: 1 }, ''); } catch (e) {}
    setTimeout(() => sheet.querySelector('.wsx').focus(), 50);
  }
  function close(fromUi) {
    if (!open) return; open = false;
    document.body.classList.remove('wheel-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus();
    if (fromUi && history.state && history.state.wheel) history.back();
  }
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); show(); });
  window.addEventListener('popstate', () => { if (open) close(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); close(true); } }, true);
})();
