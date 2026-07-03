// Service Worker for Guardian Pulse Emergency Wake and Sound Alerts
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for push notifications or local message notifications from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_ALERT_NOTIFICATION') {
    const { title, body, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'guardian-pulse-emergency',
        requireInteraction: true,
        silent: false,
        vibrate: [500, 200, 500, 200, 500, 200, 500],
        data: options.data,
        ...options
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find and focus the open app tab
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let c of clientList) {
          if (c.focused) {
            client = c;
            break;
          }
        }
        return client.focus().then((focusedClient) => {
          if (focusedClient) {
            focusedClient.postMessage({ action: 'dismiss-alarm' });
          }
        });
      }
      // If no open tab is found, open a new instance of the app
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
