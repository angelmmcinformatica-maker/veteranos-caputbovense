// Firebase Cloud Messaging Service Worker (Web Push)
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

firebase.messaging();

// Push: show notification with the team shield as icon
self.addEventListener('push', function (event) {
  if (!event.data) return;
  var payload;
  try { payload = event.data.json(); } catch (e) { payload = {}; }

  // If the browser auto-displays a notification payload, don't duplicate it
  if (payload.notification) return;

  var data = payload.data || {};
  var title = data.title || 'Liga Veteranos';
  var options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    tag: data.tag || 'liga-notification',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Click: open the match view
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/';
  var url = new URL(target, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (new URL(c.url).origin === self.location.origin && 'navigate' in c) {
          return c.focus().then(function () { return c.navigate(url); });
        }
      }
      return clients.openWindow(url);
    })
  );
});
