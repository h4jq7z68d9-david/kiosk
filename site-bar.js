/* SITE BAR — the one place the top bar is defined.
   A page that uses it has  <nav data-chrome-nav></nav>  followed immediately by
   <script src="/site-bar.js?v=1"></script>  (loaded right there, not deferred, so the bar
   is drawn before the page paints), plus /site-tokens.css and /site-bar.css in <head>.
   The menu panel and footer links come from site-chrome.js. */
(function () {
  var nav = document.querySelector('nav[data-chrome-nav]');
  if (!nav) return;
  nav.innerHTML =
    '<button class="nav-menu" type="button" id="menu-btn" aria-label="menu" aria-expanded="false" aria-controls="menu-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h6M2 12h3M2 18h7" stroke-width="2" stroke-linecap="square"/><rect x="9" y="2.5" width="12" height="7" fill="#D62A1E" stroke="none"/><rect x="6" y="9.5" width="9" height="5" fill="#F2B705" stroke="none"/><rect x="10" y="14.5" width="12" height="7" fill="#1F57D6" stroke="none"/></svg></button>' +
    '<a class="nav-title" href="/index.html">david nicholson</a>' +
    '<div class="nav-links">' +
      '<a class="nav-ig" href="https://instagram.com/dave_nichol_son" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="igGrad" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#igGrad)"/><rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.6" cy="7.4" r="1.1" fill="#fff"/></svg></a>' +
      '<a class="nav-cart" href="/gallery.html?cart=1" aria-label="cart"><svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="nav-cart-count" id="cart-count">0</span></a>' +
    '</div>';
  /* cart badge — reads the same store the gallery writes to */
  var n = 0;
  try { n = (JSON.parse(localStorage.getItem('dna_cart')) || []).length; } catch (e) {}
  var cc = document.getElementById('cart-count');
  cc.textContent = n;
  cc.classList.toggle('on', n > 0);
})();
