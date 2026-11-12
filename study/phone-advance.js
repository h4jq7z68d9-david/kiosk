/* Phone swipe past the end (Nov 11 2026; on for every study course; a settings file can set "phoneAdvance": false).
   Phones only (≤600 px, touch). Each slide scrolls up and down as usual. Once the slide is at the bottom, a swipe
   up goes straight to the next slide (as soon as it passes 50 px, with no bounce); at the top, a swipe down goes to
   the previous one. No hold, no animation. Only a swipe that STARTS at the end counts, so the swipe that
   scrolls you to the bottom never skips a slide. The Prev/Next bar is unchanged. */
(function () {
  if (!window.matchMedia || !matchMedia('(max-width:600px)').matches || !matchMedia('(pointer:coarse)').matches) return;
  var sc = document.querySelector('body.guide-page > .app');
  var link = function (a) { return a && a.getAttribute('href') ? a : null; };
  var next = link(document.getElementById('next')), prev = link(document.getElementById('prev'));
  if (!sc || (!next && !prev)) return;

  /* a quiet cue at the end of the slide */
  if (next) {
    var hint = document.createElement('p');
    hint.className = 'pa-hint';
    hint.textContent = 'Swipe up for next: ' + (next.getAttribute('title') || 'next slide');
    sc.appendChild(hint);
  }

  var MIN = 50, MAX_MS = 800;   // same feel as the sideways swipe: a clear, quick swipe
  var y0 = null, x0 = 0, t0 = 0, end = false, top = false;
  var busy = function (t) {
    return (t && t.closest && t.closest('.results, .dlb, #lb, .ed-panel, input, select, textarea, [contenteditable="true"]'))
      || document.documentElement.classList.contains('dlb-open') || document.body.classList.contains('ed-on');
  };

  sc.addEventListener('touchstart', function (e) {
    y0 = null;
    if (e.touches.length !== 1 || busy(e.target)) return;
    end = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
    top = sc.scrollTop <= 1;
    if (!end && !top) return;
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; t0 = Date.now();
  }, { passive: true });

  /* Nov 11 2026: a swipe into the end is held still (no iPhone rubber-band bounce) and goes as soon as it passes
     MIN px, without waiting for the finger to lift. Scrolling back the other way is never touched. */
  var gone = false;
  sc.addEventListener('touchmove', function (e) {
    if (y0 == null || gone) return;
    var t = e.touches[0], dy = t.clientY - y0, dx = t.clientX - x0;
    var into = (dy < 0 && end && next) ? 1 : (dy > 0 && top && prev) ? -1 : 0;
    if (!into) return;                                     // moving away from the end: ordinary scroll
    if (Math.abs(dx) > Math.abs(dy)) return;               // sideways: guide.js swipe
    if (e.cancelable) e.preventDefault();                  // no bounce
    if (Math.abs(dy) >= MIN && Math.abs(dy) >= Math.abs(dx) * 1.5 && Date.now() - t0 <= MAX_MS) {
      gone = true; y0 = null;
      location.href = (into > 0 ? next : prev).href;
    }
  }, { passive: false });

  sc.addEventListener('touchend', function () { y0 = null; }, { passive: true });
  window.addEventListener('pageshow', function () { gone = false; });   // back button from the next slide

  sc.addEventListener('touchcancel', function () { y0 = null; }, { passive: true });
})();
