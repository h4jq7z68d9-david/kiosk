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
    { href: '/shipping.html', label: 'shipping & returns' },
    { action: 'guestbook', label: 'guest book' },
    { action: 'contact', label: 'contact' }
  ];
  /* Study courses, listed under "study" in the menu on study pages only.
     Technique in study.html card order; art history in date order (same as the timeline).
     Adding a course: add one line here. */
  var STUDY = [
    { group: 'technique', href: '/study.html' },
    { href: '/study/color-wheel.html', label: 'color wheel' },
    { href: '/study/color-theory.html', label: 'color theory', section: '/study/color-theory/' },
    { href: '/study/pigments-and-materials.html', label: 'pigments and materials', section: '/study/pigments-and-materials/' },
    { href: '/study/oil-vs-acrylic.html', label: 'oil vs acrylic', section: '/study/oil-vs-acrylic/' },
    { href: '/study/composition.html', label: 'composition', section: '/study/composition/' },
    { href: '/study/value-and-light.html', label: 'value and light', section: '/study/value-and-light/' },
    { group: 'art history', href: '/study.html#art-history' },
    { href: '/study/art-history/classical-myth.html', label: 'classical myth in art', section: '/study/art-history/classical-myth/' },
    { href: '/study/art-history/japanese-woodblock-prints.html', label: 'japanese woodblock prints', section: '/study/art-history/japanese-woodblock-prints/' },
    { href: '/study/art-history/romanticism.html', label: 'romanticism', section: '/study/art-history/romanticism/' },
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
  function mail() { window.location = 'mai' + 'lto:' + 'david@' + 'davidnicholsonart.com'; }
  function isCurrent(item) {
    return item.href === here || (item.section && here.indexOf(item.section) === 0);
  }

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
