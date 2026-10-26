/* STUDY — shared script for every page under /study/art-history/.
   Full-screen image view, arrow-key Prev/Next, and (on a course home page) search. */
(function () {
  /* full-screen image view: tap or Enter on any slide image */
  var lb = document.getElementById('lb'), lbi = document.getElementById('lbimg'), lbc = document.getElementById('lbcap');
  var last = null;
  function openLb(im) {
    last = im; lbi.src = im.currentSrc || im.src; lbi.alt = im.alt; lbc.innerHTML = im.getAttribute('data-cap') || '';
    lb.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('lbx').focus();
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
  if (lb) {
    document.querySelectorAll('.pic img').forEach(function (im) {
      im.addEventListener('click', function () { openLb(im); });
      im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(im); } });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbi) closeLb(); });
    document.getElementById('lbx').addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (!lb.hidden && e.key === 'Escape') closeLb(); });
  }

  /* arrow keys follow the page's Prev / Next links */
  document.addEventListener('keydown', function (e) {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || (lb && !lb.hidden) || e.altKey || e.ctrlKey || e.metaKey) return;
    var rel = e.key === 'ArrowRight' ? 'next' : e.key === 'ArrowLeft' ? 'prev' : null;
    var a = rel && document.querySelector('.bar a[rel="' + rel + '"]');
    if (a) location.href = a.href;
  });

  /* search (course home only): same matching as the slide viewer, results link to pages */
  var qi = document.getElementById('q'), rs = document.getElementById('results');
  if (!qi || !rs) return;
  function ready(fn) { if (window.SITE) fn(); else window.addEventListener('load', fn); }
  ready(function () {
    var S = window.SITE, M = window.STUDY_MAP || {};
    if (!S) return;
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var norm = function (t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    var IDX = [];
    S.handouts.forEach(function (h) {
      var o = h.overview;
      IDX.push({ id: 'h' + h.n + '-0', kind: 'Overview', part: h.title, title: h.title, thumb: o.img,
        text: [h.title, h.sub, o.sum].concat(o.bul || [], [].concat.apply([], o.terms || []), o.cap || []).filter(Boolean).join(' · ') });
      h.slides.forEach(function (d, i) {
        IDX.push({ id: 'h' + h.n + '-' + (i + 1), kind: d.type === 'theme' ? 'Theme' : d.type === 'text' ? '' : '', part: h.title, title: d.title, artist: d.artist,
          thumb: d.type === 'work' ? d.key : d.img || null,
          text: [d.title, d.artist, d.date, d.det, d.fn, d.stmt, d.para, d.sum, d.sub].concat(d.bul || [], [].concat.apply([], d.terms || []), [d.quote && d.quote.q]).filter(Boolean).join(' · ') });
      });
    });
    IDX.forEach(function (x) { x.n = norm(x.text); x.t = norm(x.title) + ' ' + norm(x.artist); x.body = x.text.indexOf(x.title + ' · ') === 0 ? x.text.slice(x.title.length + 3) : x.text; });
    var hits = [], sel = -1;
    function snippet(t, words) {
      var n = norm(t), p = -1;
      words.forEach(function (w) { var k = n.indexOf(w); if (k >= 0 && (p < 0 || k < p)) p = k; });
      var a = Math.max(0, p - 50), b = Math.min(t.length, a + 170), s = t.slice(a, b);
      if (a > 0) s = '…' + s; if (b < t.length) s += '…';
      var h = esc(s);
      words.forEach(function (w) { if (w) h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
      return h;
    }
    function search() {
      var raw = qi.value.trim();
      if (!raw) { rs.hidden = true; qi.setAttribute('aria-expanded', 'false'); return; }
      var words = norm(raw).split(/\s+/).filter(Boolean);
      hits = IDX.filter(function (x) { return words.every(function (w) { return x.n.indexOf(w) >= 0; }); })
        .map(function (x, i) { return { x: x, i: i, score: words.reduce(function (a, w) { return a + (x.t.indexOf(w) >= 0 ? 5 : 0); }, 0) }; })
        .sort(function (a, b) { return b.score - a.score || a.i - b.i; }).slice(0, 40);
      sel = hits.length ? 0 : -1;
      rs.innerHTML = hits.length
        ? '<p class="rcount">' + (hits.length === 40 ? '40+' : hits.length) + ' result' + (hits.length === 1 ? '' : 's') + '</p>' + hits.map(function (h, j) {
          var x = h.x, url = (M.ids || {})[x.id] || '#';
          return '<a class="res" role="option" href="' + url + '" aria-selected="' + (j === sel) + '">' +
            (x.thumb ? '<img src="' + M.img + x.thumb + '.jpg" alt="" loading="lazy">' : '<span></span>') +
            '<span><span class="rk">' + esc([x.part, x.kind].filter(Boolean).join(' · ')) + '</span><span class="rt">' + esc(x.title) + '</span><span class="rs">' + snippet(x.body, words) + '</span></span></a>';
        }).join('')
        : '<p class="rnone">Nothing matches “' + esc(raw) + '”. Try a single name, such as Zeus or Pandora.</p>';
      rs.hidden = false; qi.setAttribute('aria-expanded', 'true');
    }
    function mark() { rs.querySelectorAll('.res').forEach(function (b, j) { b.setAttribute('aria-selected', String(j === sel)); if (j === sel) b.scrollIntoView({ block: 'nearest' }); }); }
    qi.addEventListener('input', search);
    qi.addEventListener('focus', function () { if (qi.value.trim()) search(); });
    qi.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (hits.length) { sel = (sel + 1) % hits.length; mark(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hits.length) { sel = (sel - 1 + hits.length) % hits.length; mark(); } }
      else if (e.key === 'Enter') { e.preventDefault(); var a = rs.querySelectorAll('.res')[sel]; if (a) location.href = a.href; }
      else if (e.key === 'Escape') { if (qi.value) { qi.value = ''; search(); } else qi.blur(); }
    });
    document.addEventListener('click', function (e) { if (!document.getElementById('search').contains(e.target)) { rs.hidden = true; qi.setAttribute('aria-expanded', 'false'); } });
    if (qi.value.trim()) search();
  });
})();
