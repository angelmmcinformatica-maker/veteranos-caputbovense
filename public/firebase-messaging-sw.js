// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC_b21wRYQNFmDYvOcAlcMmbqvRU1kAjVo",
  authDomain: "liga-afas-a554c.firebaseapp.com",
  projectId: "liga-afas-a554c",
  storageBucket: "liga-afas-a554c.firebasestorage.app",
  messagingSenderId: "264727553284",
  appId: "1:264727553284:web:35dbcfe9a67e7db6c01c51"
});

const messaging = firebase.messaging();

// Intercept background messages and show custom notification
messaging.onBackgroundMessage((payload) => {
  // Prevent default notification - we handle it manually
  const title = payload.notification?.title || payload.data?.title || 'Liga Veteranos';
  const body = payload.notification?.body || payload.data?.body || '';

  const options = {
    body,
    icon: payload.notification?.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    tag: payload.data?.matchId || 'liga-notification',
    renotify: true
  };

  return self.registration.showNotification(title, options);
});

// Fallback: raw push event for cases where FCM doesn't trigger onBackgroundMessage
self.addEventListener('push', (event) => {
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { notification: { title: 'Liga Veteranos', body: event.data.text() } };
    }

    // Only show if FCM didn't already handle it (check if notification key exists in data)
    const title = payload.notification?.title || payload.data?.title || 'Liga Veteranos';
    const body = payload.notification?.body || payload.data?.body || '';

    if (title && title !== 'Liga Veteranos' || body) {
      const options = {
        body,
        icon: payload.notification?.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: payload.data?.matchId || 'liga-push',
        renotify: true
      };

      event.waitUntil(self.registration.showNotification(title, options));
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
