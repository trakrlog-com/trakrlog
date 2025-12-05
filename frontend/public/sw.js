// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let data;
  try {
    data = event.data ? event.data.json() : {
      title: 'New Notification',
      body: 'You have a new notification'
    };
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    data = {
      title: 'New Notification',
      body: 'You have a new notification'
    };
  }
  
  console.log('[Service Worker] Notification data:', data);
  
  const options = {
    body: data.body,
    icon: data.icon || '/vite.svg',
    badge: '/vite.svg',
    data: data.data || {},
    tag: data.tag || 'trakrlog-notification',
    requireInteraction: false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
