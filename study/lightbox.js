/* Shared example-painting lightbox (technique slide model, Nov 10 2026). One component for every course.
   Any <button data-lightbox data-full data-w data-h data-alt data-det data-credit data-title> opens it.
   The full image is requested only when the lightbox opens. Close: the Close button, Esc, or a click outside
   the image. Focus moves into the dialog and back to the thumbnail; the page behind does not scroll; while it
   is open, keys go to the dialog only (so guide.js arrows and "/" do nothing). */
(function () {
  var btns = document.querySelectorAll('[data-lightbox]');
  if (!btns.length) return;
  var root = document.documentElement, dlg, img, det, cr, x, opener = null;

  function build() {
    dlg = document.createElement('div');
    dlg.className = 'dlb'; dlg.hidden = true;
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = '<button type="button" class="dlb-x">Close <span aria-hidden="true">✕</span></button>'
      + '<figure class="dlb-fig"><img class="dlb-img" alt=""><figcaption class="dlb-cap"><p class="dlb-det"></p><p class="dlb-cr"></p></figcaption></figure>';
    document.body.appendChild(dlg);
    img = dlg.querySelector('.dlb-img'); det = dlg.querySelector('.dlb-det'); cr = dlg.querySelector('.dlb-cr'); x = dlg.querySelector('.dlb-x');
    x.addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target !== img && !x.contains(e.target)) close(); });   // anywhere but the image
  }

  function open(b) {
    if (!dlg) build();
    opener = b;
    var d = b.dataset;
    img.removeAttribute('src');
    if (d.w && d.h) { img.width = +d.w; img.height = +d.h; }
    img.alt = d.alt || '';
    img.src = d.full;
    det.textContent = d.det || '';
    cr.textContent = d.credit || '';
    dlg.setAttribute('aria-label', d.title || d.alt || 'Enlarged image');
    dlg.hidden = false;
    root.classList.add('dlb-open');
    x.focus();
  }

  function close() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    root.classList.remove('dlb-open');
    if (opener) opener.focus();
    opener = null;
  }

  for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function (e) { e.preventDefault(); open(e.currentTarget); });

  /* capture phase on window: runs before guide.js's document listener and stops it while the dialog is open */
  window.addEventListener('keydown', function (e) {
    if (!dlg || dlg.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { e.preventDefault(); x.focus(); }   // the Close button is the dialog's only control
  }, true);
  /* keep focus inside: anything focused behind the dialog is sent back to Close */
  document.addEventListener('focusin', function (e) { if (dlg && !dlg.hidden && !dlg.contains(e.target)) x.focus(); });
})();
