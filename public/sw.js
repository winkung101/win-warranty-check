const CACHE_NAME = 'win-warranty-v2';
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

  // สิ่งที่แก้ไขเพื่อบังคับให้แจ้งเตือนแสดงและสั่นบน Android/iOS
  const options = {
    body: data.body,
    icon: '/icon-192.png', // เปลี่ยนเป็น png
    badge: '/icon-192.png', // เปลี่ยนเป็น png เพื่อให้ Android แสดงผลได้
    vibrate: [200, 100, 200, 100, 200, 100, 200], // สั่นเป็นจังหวะเพื่อให้รู้ตัว
    tag: data.type || 'default',
    renotify: true,
    requireInteraction: true, // บังคับให้ค้างบนหน้าจอจนกว่าผู้ใช้จะปัดทิ้ง
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
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: data.type || 'default',
    renotify: true,
    data: { url: '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
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
