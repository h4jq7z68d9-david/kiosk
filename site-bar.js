/* SITE BAR — the one place the top bar is defined.
   A page that uses it has  <nav data-chrome-nav></nav>  followed immediately by
   <script src="/site-bar.js?v=1"></script>  (loaded right there, not deferred, so the bar
   is drawn before the page paints), plus /site-tokens.css and /site-bar.css in <head>.
   The menu panel and footer links come from site-chrome.js. */
(function () {
  var nav = document.querySelector('nav[data-chrome-nav]');
  if (!nav) return;
  nav.innerHTML =
    '<button class="nav-menu" type="button" id="menu-btn" aria-label="menu" aria-expanded="false" aria-controls="menu-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h13M3 12h8M3 18h15" stroke-width="2" stroke-linecap="square"/><rect x="18" y="4" width="4" height="4" fill="#C8382F" stroke="none"/><rect x="13" y="10" width="4" height="4" fill="#E3B220" stroke="none"/><rect x="20" y="16" width="2" height="4" fill="#2F5FC8" stroke="none"/></svg></button>' +
    '<a class="nav-title" href="/index.html">david nicholson</a>' +
    '<div class="nav-links">' +
      '<a class="nav-btn" href="https://instagram.com/dave_nichol_son" target="_blank" rel="noopener"><span class="btn-text-long">follow on instagram</span><span class="btn-text-short">instagram</span></a>' +
      '<a class="nav-cart" href="/gallery.html?cart=1" aria-label="cart"><svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="nav-cart-count" id="cart-count">0</span></a>' +
    '</div>';
  /* cart badge — reads the same store the gallery writes to */
  var n = 0;
  try { n = (JSON.parse(localStorage.getItem('dna_cart')) || []).length; } catch (e) {}
  var cc = document.getElementById('cart-count');
  cc.textContent = n;
  cc.classList.toggle('on', n > 0);
})();
