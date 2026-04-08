// Admin PWA Service Worker
// Caches the admin shell for fast load. API calls always go to network.

const CACHE = 'dna-admin-v1';
const SHELL = [
  '/admin.html',
  '/admin.webmanifest',
  '/admin-icon.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
];

// On install, cache the shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// On activate, drop old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - API calls (davidnicholsonart.com/admin/*) → network only, never cache
//   - Everything else → cache first, then network
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always pass API calls through to network
  if (url.pathname.startsWith('/admin/') || url.hostname === 's3.amazonaws.com') {
    e.respondWith(fetch(e.request));
    return;
  }

  // Shell: cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful GET responses for shell assets
        if (e.request.method === 'GET' && res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
