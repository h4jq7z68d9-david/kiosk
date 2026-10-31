/* SITE CHROME — the one place the site menu and footer links are defined.
   Every public page has an empty <div id="menu-panel"> and an empty
   <div class="f-links" data-chrome-footer>; this file fills both and wires the menu.
   To add, rename or remove a link: edit MENU / FOOTER below. Nothing else to touch.
   Load at the end of <body>, after the page's own scripts (it checks for openGB). */
(function () {
  var MENU = [
    { href: '/', label: 'home' },
    { href: '/gallery.html', label: 'prints' },
    { href: '/originals.html', label: 'available originals' },
    { hr: true },
    { href: '/study.html', label: 'study', section: '/study' },
    { hr: true },
    { href: '/shipping.html', label: 'shipping & returns' },
    { action: 'guestbook', label: 'guest book' },
    { action: 'contact', label: 'contact' }
  ];
  /* Study courses, listed under "study" in the menu on study pages only.
     Technique in study.html card order; art history in date order (same as the timeline).
     Adding a course: add one line here. */
  var STUDY = [
    { group: 'technique', href: '/study.html#technique' },
    { href: '/study/color-theory.html', label: 'color theory', section: '/study/color-theory/' },
    { href: '/study/value-and-light.html', label: 'value and light', section: '/study/value-and-light/' },
    { href: '/study/composition.html', label: 'composition', section: '/study/composition/' },
    { href: '/study/pigments-and-materials.html', label: 'pigments and materials', section: '/study/pigments-and-materials/' },
    { href: '/study/oil-vs-acrylic.html', label: 'oil vs acrylic', section: '/study/oil-vs-acrylic/' },
    { group: 'art history', href: '/study.html' },
    { href: '/study/art-history/classical-myth.html', label: 'classical myth in art', section: '/study/art-history/classical-myth/' },
    { href: '/study/art-history/japanese-woodblock-prints.html', label: 'japanese woodblock prints', section: '/study/art-history/japanese-woodblock-prints/' },
    { href: '/study/art-history/romanticism.html', label: 'romanticism', section: '/study/art-history/romanticism/' },
    { href: '/study/art-history/realism.html', label: 'realism', section: '/study/art-history/realism/' },
    { href: '/study/art-history/impressionism.html', label: 'impressionism', section: '/study/art-history/impressionism/' },
    { href: '/study/art-history/post-impressionism.html', label: 'post-impressionism', section: '/study/art-history/post-impressionism/' },
    { href: '/study/art-history/fauvism-and-expressionism.html', label: 'fauvism and early expressionism', section: '/study/art-history/fauvism-and-expressionism/' }
  ];
  var FOOTER = [
    { href: '/gallery.html', label: 'gallery' },
    { href: '/originals.html', label: 'available originals' },
    { href: '/shipping.html', label: 'shipping & returns' },
    { href: '/study.html', label: 'study' }
  ];

  var here = location.pathname.replace(/\/index\.html$/, '/');

  /* ---- end of a study course: on its last page (image credits), Next goes to the
     next course in the same STUDY group; the last course in a group keeps Next disabled ---- */
  var nx = document.getElementById('next');
  if (nx && nx.getAttribute('aria-disabled') === 'true') {
    var k = -1;
    STUDY.forEach(function (c, i) { if (c.section && (here === c.href || here.indexOf(c.section) === 0)) k = i; });
    var nc = k >= 0 ? STUDY[k + 1] : null;
    if (nc && nc.section) {
      nx.href = nc.href;
      nx.rel = 'next';
      nx.removeAttribute('aria-disabled');
      nx.title = 'Next course: ' + nc.label;
      nx.textContent = 'Next course →';
    }
  }
  function mail() { window.location = 'mai' + 'lto:' + 'david@' + 'davidnicholsonart.com'; }
  function isCurrent(item) {
    if (item.href === here) return true;
    // a section match (study) gives way to an exact menu item for this page (color wheel)
    return !!(item.section && here.indexOf(item.section) === 0 && !MENU.some(function (m) { return m.href === here; }));
  }


  /* ---- color wheel pop-up (Oct 31 2026) ----
     Opened from the menu's color wheel bubble on every page. Loads /study/color-wheel.html?embed=1 (the quick
     tool: wheel and mixer) in a frame that drops down under the site bar: a card at the right on desktop, full
     width on phones with a grab handle (swipe up to close). Back, Escape, the scrim or the close button shut it.
     The frame is made on first open and never changes size — it slides in and out — because resizing an iframe
     on iOS eats the next tap inside it (Color-Wheel-App-Reference.md). The page behind is locked while it is
     open so iPhone Safari's toolbar (and with it the frame's height) can't change. */
  var wheel = (function () {
    var sheet = null, scrimW = null, open = false, opener = null;
    function make() {
      scrimW = document.createElement('div'); scrimW.className = 'wheel-scrim';
      sheet = document.createElement('div');
      sheet.className = 'wheel-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Color wheel');
      sheet.innerHTML = '<button type="button" class="wheel-x" aria-label="Close color wheel">\u2715</button><iframe title="Color wheel" src="/study/color-wheel.html?embed=1"></iframe><span class="wheel-grab" aria-hidden="true"></span>';
      document.body.appendChild(scrimW); document.body.appendChild(sheet);
      sheet.querySelector('.wheel-x').onclick = function () { hide(true); };
      scrimW.onclick = function () { hide(true); };
      var grab = sheet.querySelector('.wheel-grab'), y0 = null;
      grab.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
      grab.addEventListener('touchend', function (e) { if (y0 != null && y0 - e.changedTouches[0].clientY > 40) hide(true); y0 = null; }, { passive: true });
    }
    function show() {
      if (!sheet) make();
      if (open) return; open = true; opener = document.activeElement;
      document.documentElement.classList.add('wheel-open');
      try { history.pushState({ wheel: 1 }, ''); } catch (e) {}
      setTimeout(function () { sheet.querySelector('.wheel-x').focus(); }, 50);
    }
    function hide(fromUi) {
      if (!open) return; open = false;
      document.documentElement.classList.remove('wheel-open');
      if (opener && opener.focus) try { opener.focus(); } catch (e) {}
      if (fromUi && history.state && history.state.wheel) history.back();
    }
    window.addEventListener('popstate', function () { if (open) hide(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { e.stopPropagation(); hide(true); } }, true);
    return { show: show };
  })();

  /* ---- menu ---- */
  var btn = document.getElementById('menu-btn');
  var panel = document.getElementById('menu-panel');
  var scrim = document.getElementById('menu-scrim');
  if (btn && panel && scrim) {
    panel.innerHTML = '';
    MENU.forEach(function (item) {
      var el;
      if (item.hr) { el = document.createElement('hr'); }
      else if (item.href) {
        el = document.createElement('a');
        el.href = item.href;
        if (isCurrent(item)) el.className = 'current';
      } else {
        el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('data-menu', item.action);
      }
      if (item.label) el.textContent = item.label;
      panel.appendChild(el);
      if (item.section === '/study' && here.indexOf('/study/') === 0) addStudy();
    });

    /* course list under "study" — the current course is marked, so you can see where you are */
    function addStudy() {
      var box = document.createElement('div');
      box.className = 'menu-sub';
      STUDY.forEach(function (c) {
        var a;
        if (c.group) {
          a = document.createElement(c.href ? 'a' : 'div');
          if (c.href) a.href = c.href;
          a.className = 'menu-group';
          a.textContent = c.group;
        } else {
          a = document.createElement('a');
          a.href = c.href;
          a.textContent = c.label;
          if (here === c.href || (c.section && here.indexOf(c.section) === 0)) {
            a.className = 'current';
            a.setAttribute('aria-current', 'page');
          }
        }
        box.appendChild(a);
      });
      panel.appendChild(box);
    }

    var setMenu = function (open) {
      if (open && window.innerWidth > 600) panel.style.left = Math.max(0, btn.getBoundingClientRect().left) + 'px';
      panel.classList.toggle('on', open);
      scrim.classList.toggle('on', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function () { setMenu(!panel.classList.contains('on')); });
    scrim.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    panel.querySelector('[data-menu="guestbook"]').addEventListener('click', function () {
      setMenu(false);
      if (typeof openGB === 'function') { openGB(); return; }
      var gb = document.getElementById('guest-book');
      if (gb) gb.scrollIntoView(); else window.location = '/#guest-book';
    });
    panel.querySelector('[data-menu="contact"]').addEventListener('click', function () {
      setMenu(false);
      mail();
    });

    /* color wheel bubble at the very bottom of the menu (Oct 31 2026): opens the wheel pop-up on any page */
    if (here !== '/study/color-wheel.html') {
      var wb = document.createElement('div');
      wb.className = 'menu-wheel';
      wb.innerHTML = '<button type="button" class="wheel-bubble" aria-haspopup="dialog"><img src="/color-wheel-icon-512.png" alt="" width="22" height="22">color wheel</button>';
      panel.appendChild(wb);
      wb.querySelector('button').addEventListener('click', function () { setMenu(false); wheel.show(); });
    }
  }

  /* ---- footer links: every FOOTER page except this one, then contact,
     then guest book on pages that have the guest-book popup (openGB) ---- */
  var fl = document.querySelector('[data-chrome-footer]');
  if (fl) {
    fl.innerHTML = '';
    FOOTER.forEach(function (item) {
      if (item.href === here) return;
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      fl.appendChild(a);
    });
    var c = document.createElement('button');
    c.type = 'button';
    c.textContent = 'contact';
    c.addEventListener('click', mail);
    fl.appendChild(c);
    if (typeof openGB === 'function') {
      var g = document.createElement('button');
      g.type = 'button';
      g.textContent = 'guest book';
      g.addEventListener('click', function () { openGB(); });
      fl.appendChild(g);
    }
  }
})();
