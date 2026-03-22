const CACHE_NAME = 'win-warranty-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Don't cache API or edge function calls
  if (e.request.url.includes('supabase.co') || e.request.url.includes('/functions/')) {
    return;
  }
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});

// Push Notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'WIN TECHNOLOGY', body: 'คุณมีการแจ้งเตือนใหม่' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: data.type || 'default',
    renotify: true,
    requireInteraction: true,
    data: { url: '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'WIN TECHNOLOGY', options)
  );
});

// Click notification → open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});
