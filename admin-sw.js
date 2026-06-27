// Admin PWA Service Worker — cache version: dna-admin-v30
const CACHE = 'dna-admin-v30';
const SHELL = [
  '/admin.html',
  '/admin.webmanifest',
  '/admin-icon.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - All /admin/* API calls → network only, never cache
//   - S3 receipt URLs → network only
//   - HTML files → network first, fall back to cache (always fresh when online)
//   - Everything else → cache first, then network
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always pass API and S3 calls through to network
  if (url.pathname.startsWith('/admin/') ||
      url.pathname.startsWith('/booth-layout') ||
      url.hostname === 's3.amazonaws.com' ||
      url.hostname.endsWith('.s3.us-east-2.amazonaws.com') ||
      url.hostname.endsWith('.execute-api.us-east-1.amazonaws.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // HTML: network first, cache fallback (so updates are always picked up when online)
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Shell assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
