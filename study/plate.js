/* Plate viewer behavior (loaded after guide.js on courses with "viewer": "plate").
   Outline: guide.js builds the list and toggles the .collapsed class; here the list starts closed, floats above the bar, and closes on outside click or Esc.
   Search: a bar button opens the existing search field as a floating card. Scale: the figure box opens and closes the scale card. */
(function () {
  var app = document.getElementById('app'), tog = document.getElementById('tog'), bar = document.querySelector('.bar');
  if (!app || !tog || !bar) return;
  var name = ((window.GUIDE && window.GUIDE.name) || '').toLowerCase();
  tog.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span>' + name + '</span>';
  tog.setAttribute('aria-label', 'Outline'); tog.title = 'Outline'; tog.setAttribute('aria-expanded', 'false');
  app.classList.add('collapsed');
  /* the outline pop-up starts with a way back to the study home (David, Nov 25 2026): the plate viewer hides the breadcrumb */
  var rail0 = document.getElementById('rail'), ol = document.getElementById('outline');
  if (rail0 && ol && !rail0.querySelector('.shome')) {
    var sh = document.createElement('p'); sh.className = 'shome';
    var art = location.pathname.indexOf('/study/art-history/') === 0;
    sh.innerHTML = '<a class="ho" href="/study.html' + (art ? '' : '#technique') + '">Study home</a>';
    rail0.insertBefore(sh, ol);
  }
  function sync() { tog.setAttribute('aria-expanded', String(!app.classList.contains('collapsed'))); }
  tog.addEventListener('click', function () { setTimeout(function () { sync(); if (!app.classList.contains('collapsed')) closeSearch(); }, 0); });

  /* guide.js may reword Next on the last page ("Next course →"): keep the square icon button, keep the words for screen readers */
  var nx = document.getElementById('next'), busy = false;
  function fixNext() {
    if (!nx || busy || nx.querySelector('svg')) return;
    busy = true;
    var words = nx.textContent.replace(/[←→]/g, '').trim() || 'Next';
    nx.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg><span class="vh">' + words + '</span>';
    nx.setAttribute('aria-label', words);
    busy = false;
  }
  if (nx) { fixNext(); new MutationObserver(fixNext).observe(nx, { childList: true, characterData: true, subtree: true }); }

  var sb = document.createElement('button');
  sb.type = 'button'; sb.className = 'btn sbtn'; sb.setAttribute('aria-label', 'Search'); sb.setAttribute('aria-expanded', 'false');
  sb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var bm = document.getElementById('bm'); bar.insertBefore(sb, bm || null);
  function closeSearch() { document.body.classList.remove('searchopen'); sb.setAttribute('aria-expanded', 'false'); }
  sb.addEventListener('click', function () {
    var open = !document.body.classList.contains('searchopen');
    document.body.classList.toggle('searchopen', open); sb.setAttribute('aria-expanded', String(open));
    if (open) { app.classList.add('collapsed'); sync(); var q = document.getElementById('q'); if (q) q.focus(); }
  });

  document.addEventListener('click', function (e) {
    var rail = document.getElementById('rail'), tb = document.querySelector('.topbar');
    if (!app.classList.contains('collapsed') && !rail.contains(e.target) && !tog.contains(e.target)) { app.classList.add('collapsed'); sync(); }
    if (document.body.classList.contains('searchopen') && !tb.contains(e.target) && !sb.contains(e.target)) closeSearch();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!app.classList.contains('collapsed')) { app.classList.add('collapsed'); sync(); tog.focus(); }
    closeSearch(); closeScale();
  });

  var sbtn = document.querySelector('[data-scale]'), card = document.getElementById('scalecard');
  function closeScale() { if (card && !card.hidden) { card.hidden = true; sbtn.setAttribute('aria-expanded', 'false'); } }
  if (sbtn && card) {
    sbtn.addEventListener('click', function () { var open = card.hidden; card.hidden = !open; sbtn.setAttribute('aria-expanded', String(open)); if (open) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    var x = card.querySelector('[data-scale-close]'); if (x) x.addEventListener('click', function () { closeScale(); sbtn.focus(); });
  }
})();
