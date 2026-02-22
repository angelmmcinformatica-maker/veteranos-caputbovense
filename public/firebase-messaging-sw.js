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

// Primary: native push event listener — handles ALL push messages reliably on Android
self.addEventListener('push', function(event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { notification: { title: 'Liga Veteranos', body: event.data.text() } };
  }

  // Buscar en data primero (Android background), luego en notification
  const title = payload.data?.title || payload.notification?.title || 'Nuevo evento en el partido';
  const body = payload.data?.body || payload.notification?.body || '';
  const icon = payload.data?.icon || '/icons/icon-192.png';

  const options = {
    body: body,
    icon: icon,
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    tag: payload.data?.matchId || 'liga-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
