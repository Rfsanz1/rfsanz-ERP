const CACHE_NAME = 'gm-erp-v7';
const API_CACHE_NAME = 'gm-erp-api-v7';

const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Next.js JS/CSS chunks — ALWAYS network only, never cache
  // Chunks are content-hash addressed and stale chunks cause ChunkLoadError
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // API calls — network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // Icons / manifest — cache first (rarely change)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation — network first, fallback to offline shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }
});

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response('', { status: 504, statusText: 'Network Error' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName || CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Offline', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirstNav(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match('/login');
    if (fallback) return fallback;
    return new Response(
      `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gentong Mas ERP</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F5F5F9;padding:1rem}.card{text-align:center;background:#fff;border-radius:16px;padding:2.5rem;max-width:360px;box-shadow:0 4px 16px rgba(47,43,61,.12)}.logo{width:72px;height:72px;border-radius:16px;background:linear-gradient(135deg,#7367F0,#CE9FFC);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;font-size:1.75rem;font-weight:700;color:#fff}h2{color:#433C50;margin-bottom:.5rem;font-size:1.25rem}p{color:#6D6777;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}button{background:#7367F0;color:#fff;border:none;border-radius:8px;padding:.75rem 1.5rem;font-size:.9375rem;font-weight:600;cursor:pointer;width:100%}</style></head><body><div class="card"><div class="logo">GM</div><h2>Tidak Ada Koneksi</h2><p>Gentong Mas ERP memerlukan koneksi internet. Periksa koneksi Anda dan coba lagi.</p><button onclick="location.reload()">Coba Lagi</button></div></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 404 });
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Gentong Mas ERP', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gentong Mas ERP', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: { url: data.url || '/dashboard' },
      actions: [
        { action: 'open', title: 'Buka' },
        { action: 'close', title: 'Tutup' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
