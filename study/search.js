/* Study search: one search across every study course (the study section only — never the shop or gallery).
   Used by every course page (wired by /study/guide.js) and by /study.html.
   The full index (/study/search-index.js, built by tools/study/build-search.js) loads the first time
   someone focuses a search box, so it never slows a page load. On a course page, that course's own
   index (window.GUIDE) answers at once while the full index loads. Results from the current course
   come first; every result is labeled with its course. */
(function () {
  var SRC = '/study/search-index.js';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var MAX = 40;

  var full = null, loading = null;
  function loadFull(done) {
    if (full) return done();
    if (window.STUDY_SEARCH) { full = prep(window.STUDY_SEARCH); return done(); }
    if (!loading) {
      loading = [];
      var s = document.createElement('script');
      var d = new Date();   // refreshes at most once a day; the deploy invalidates the server copy
      s.src = SRC + '?d=' + d.getFullYear() + (d.getMonth() + 1) + d.getDate();
      s.async = true;
      s.onload = function () { if (window.STUDY_SEARCH) full = prep(window.STUDY_SEARCH); var l = loading; loading = null; l.forEach(function (f) { f(); }); };
      s.onerror = function () { var l = loading; loading = null; l.forEach(function (f) { f(); }); };
      document.head.appendChild(s);
    }
    loading.push(done);
  }
  function prep(S) {
    return S.items.map(function (r, i) {
      var c = S.courses[r[0]];
      return { i: i, slug: c.slug, course: c.name, url: r[1], label: r[2], title: r[3], thumb: r[5] ? c.img + r[5] + '.jpg' : '',
        text: r[6], n: norm(r[3] + ' ' + r[4] + ' ' + r[6] + ' ' + c.name), t: norm(r[3] + ' ' + r[4]) };
    });
  }
  /* a course page's own index, used until the full index arrives */
  function fromGuide(G) {
    var parts = {}; G.parts.forEach(function (p) { parts[p.h] = p.title; });
    var kind = { overview: 'Overview', intro: 'Start' };
    return G.items.filter(function (it) { return it.kind !== 'credits' && it.kind !== 'sources'; }).map(function (it, i) {
      var body = it.text.indexOf(it.title + ' · ') === 0 ? it.text.slice(it.title.length + 3) : it.text;
      var label = [it.h && it.h < 99 ? parts[it.h] : '', it.kind === 'theme' ? (it.tlabel || G.themeLabel || 'Theme') : kind[it.kind]].filter(Boolean).join(' · ');
      return { i: i, slug: G.slug, course: G.name, url: it.url, label: label, title: it.title, thumb: it.thumb ? G.img + it.thumb + '.jpg' : '',
        text: body, n: norm(it.title + ' ' + (it.artist || '') + ' ' + body + ' ' + G.name), t: norm(it.title + ' ' + (it.artist || '')) };
    });
  }
  function snippet(t, words) {
    var n = norm(t), p = -1;
    words.forEach(function (w) { var k = n.indexOf(w); if (k >= 0 && (p < 0 || k < p)) p = k; });
    var a = Math.max(0, p - 50), b = Math.min(t.length, a + 170), s = t.slice(a, b);
    if (a > 0) s = '…' + s; if (b < t.length) s += '…';
    var h = esc(s);
    words.forEach(function (w) { if (w) h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
    return h;
  }

  /* opts: { input, results, current: course slug or '', guide: window.GUIDE or null } */
  function attach(o) {
    var qi = o.input, rs = o.results, box = o.box || qi.parentNode, cur = o.current || '';
    var local = o.guide ? fromGuide(o.guide) : null, hits = [], sel = -1;
    var pool = function () { return full || local || []; };
    function search() {
      var raw = qi.value.trim();
      if (!raw) { rs.hidden = true; qi.setAttribute('aria-expanded', 'false'); return; }
      var words = norm(raw).split(/\s+/).filter(Boolean);
      if (!full && !local) { rs.innerHTML = '<p class="rnone">Loading…</p>'; rs.hidden = false; return; }
      var all = pool().filter(function (x) { return words.every(function (w) { return x.n.indexOf(w) >= 0; }); })
        .map(function (x) { return { x: x, score: (x.slug === cur ? 100 : 0) + words.reduce(function (a, w) { return a + (x.t.indexOf(w) >= 0 ? 5 : 0); }, 0) }; })
        .sort(function (a, b) { return b.score - a.score || a.x.i - b.x.i; });
      var nCourses = {}; all.forEach(function (h) { nCourses[h.x.slug] = 1; });
      hits = all.slice(0, MAX).map(function (h) { return h.x; });
      sel = hits.length ? 0 : -1;
      var nc = Object.keys(nCourses).length;
      rs.innerHTML = hits.length
        ? '<p class="rcount">' + (all.length > MAX ? MAX + '+' : all.length) + ' page' + (all.length === 1 ? '' : 's') + (full ? (nc > 1 ? ' in ' + nc + ' courses' : '') : ' in this course · searching all courses…') + '</p>' +
          hits.map(function (x, k) {
            return '<a class="res" role="option" href="' + x.url + '" data-j="' + k + '" aria-selected="' + (k === sel) + '">' +
              (x.thumb ? '<img class="th" src="' + x.thumb + '" alt="" loading="lazy">' : '<span class="ph">§</span>') +
              '<span><span class="rk"><span class="rc">' + esc(x.course) + '</span>' + (x.label ? ' · ' + esc(x.label) : '') + '</span>' +
              '<span class="rt">' + esc(x.title) + '</span><span class="rs">' + snippet(x.text, words) + '</span></span></a>';
          }).join('')
        : (full ? '<p class="rnone">No pages match “' + esc(raw) + '”. Try a single name.</p>' : '<p class="rnone">Searching all courses…</p>');
      rs.hidden = false; qi.setAttribute('aria-expanded', 'true');
    }
    function mark() { [].forEach.call(rs.querySelectorAll('.res'), function (b, k) { b.setAttribute('aria-selected', String(k === sel)); if (k === sel) b.scrollIntoView({ block: 'nearest' }); }); }
    var warm = function () { loadFull(function () { if (qi.value.trim()) search(); }); };
    qi.addEventListener('focus', function () { warm(); if (qi.value.trim()) search(); });
    qi.addEventListener('input', function () { warm(); search(); });
    qi.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (hits.length) { sel = (sel + 1) % hits.length; mark(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hits.length) { sel = (sel - 1 + hits.length) % hits.length; mark(); } }
      else if (e.key === 'Enter') { e.preventDefault(); if (hits[sel]) location.href = hits[sel].url; }
      else if (e.key === 'Escape') { if (qi.value) { qi.value = ''; search(); } else qi.blur(); }
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) { rs.hidden = true; qi.setAttribute('aria-expanded', 'false'); } });
    /* Back button (Oct 31 2026): the browser restores this page exactly as it was left, results open over
       the page. Close them when leaving and again on return; the search text stays, and tapping the box
       shows the results again. */
    var closeResults = function () { rs.hidden = true; qi.setAttribute('aria-expanded', 'false'); if (document.activeElement === qi) qi.blur(); };
    window.addEventListener('pagehide', closeResults);
    window.addEventListener('pageshow', closeResults);
  }
  window.StudySearch = { attach: attach };
})();
