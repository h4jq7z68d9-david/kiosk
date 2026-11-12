/* Phone "push past the end" navigation (Nov 11 2026; on for courses whose settings have "phoneAdvance": true).
   Phones only (≤600 px, touch). Each slide still scrolls up and down as usual. Once the slide is scrolled to the
   bottom, one more push up goes to the next slide; at the top, one more push down goes to the previous one.
   A pill shows where you are going while you pull; let go before it fills and nothing happens.
   Left/right swipes stay as they are (guide.js). The Prev/Next bar is unchanged. */
(function () {
  if (!window.matchMedia || !matchMedia('(max-width:600px)').matches || !matchMedia('(pointer:coarse)').matches) return;
  var sc = document.querySelector('body.guide-page > .app');
  var next = document.getElementById('next'), prev = document.getElementById('prev');
  if (!sc) return;
  var link = function (a) { return a && a.getAttribute('href') ? a : null; };
  next = link(next); prev = link(prev);
  if (!next && !prev) return;

  var PULL = 90;   // px of extra push needed
  var pill = document.createElement('div');
  pill.className = 'pa-pill'; pill.setAttribute('aria-hidden', 'true'); pill.hidden = true;
  pill.innerHTML = '<span class="pa-arrow"></span><span class="pa-text"></span><span class="pa-fill"></span>';
  document.body.appendChild(pill);
  var arrow = pill.querySelector('.pa-arrow'), text = pill.querySelector('.pa-text'), fill = pill.querySelector('.pa-fill');

  /* a quiet cue at the end of the slide */
  if (next) {
    var hint = document.createElement('p');
    hint.className = 'pa-hint';
    hint.textContent = 'Push up for next: ' + (next.getAttribute('title') || 'next slide');
    sc.appendChild(hint);
  }

  var y0 = null, x0 = 0, dir = 0, ready = false;
  var busy = function (t) {
    return (t && t.closest && t.closest('.results, .dlb, #lb, .ed-panel, input, select, textarea, [contenteditable="true"]'))
      || document.documentElement.classList.contains('dlb-open') || document.body.classList.contains('ed-on');
  };
  var atEnd = function () { return sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2; };
  var atTop = function () { return sc.scrollTop <= 1; };

  sc.addEventListener('touchstart', function (e) {
    y0 = null; dir = 0; ready = false;
    if (e.touches.length !== 1 || busy(e.target)) return;
    /* only a push that STARTS at the end counts; the push that scrolls you to the end does not */
    var end = atEnd(), top = atTop();
    if (!end && !top) return;
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX;
    dir = end && next ? 1 : 0;
    if (top && prev) dir = dir ? 2 : -1;   // 2: a short slide that fits the screen, either way
  }, { passive: true });

  sc.addEventListener('touchmove', function (e) {
    if (y0 == null) return;
    var dy = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0;
    if (Math.abs(dx) > Math.abs(dy)) { show(0); return; }   // a sideways swipe: guide.js handles it
    var d = dy < 0 && (dir === 1 || dir === 2) ? 1 : dy > 0 && (dir === -1 || dir === 2) ? -1 : 0;
    if (!d) { show(0); return; }
    show(d, Math.min(1, Math.abs(dy) / PULL));
  }, { passive: true });

  var end = function () {
    if (y0 == null) return;
    y0 = null;
    var go = ready && pill.dataset.d;
    show(0);
    if (go) location.href = (go === '1' ? next : prev).href;
  };
  sc.addEventListener('touchend', end, { passive: true });
  sc.addEventListener('touchcancel', function () { y0 = null; show(0); }, { passive: true });

  function show(d, p) {
    if (!d) { pill.hidden = true; ready = false; delete pill.dataset.d; return; }
    var a = d > 0 ? next : prev;
    pill.dataset.d = String(d);
    pill.classList.toggle('pa-up', d > 0); pill.classList.toggle('pa-down', d < 0);
    arrow.textContent = d > 0 ? '↑' : '↓';
    ready = p >= 1;
    text.textContent = (ready ? 'Release for ' : (d > 0 ? 'Next: ' : 'Previous: ')) + (a.getAttribute('title') || '');
    fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    pill.classList.toggle('pa-ready', ready);
    pill.hidden = false;
  }
})();
