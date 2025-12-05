// Service Worker for Push Notifications
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  let data;
  try {
    data =  event.data.json();
  } catch (e) {
    console.error("[Service Worker] Error parsing push data:", e);
    data = {
      title: "New Notification",
      body: "You have a new notification",
    };
  }

  console.log("[Service Worker] Notification data:", data);

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.icon,
    data: data.data || {},
    tag: data.tag || "trakrlog",
    requireInteraction: false,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);
  event.notification.close();

  // Get URL from notification data, or use action-specific URL
  let urlToOpen = event.notification.data?.url || "/";

  // Handle action button clicks
  if (event.action === "view") {
    // Use the URL from notification data
    urlToOpen = event.notification.data?.url || "/";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with the same URL
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Check for any open window to navigate
      if (clientList.length > 0) {
        const client = clientList[0];
        return client.focus().then(() => client.navigate(urlToOpen));
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
