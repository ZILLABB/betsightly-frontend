/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// API cache — network first, fall back to cache
registerRoute(
  ({ url }) => url.origin === "https://betsightly-api.onrender.com" && url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 })],
  })
);

// Image cache
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
);

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, url, icon, badge } = payload;

    event.waitUntil(
      self.registration.showNotification(title || "BetSightly", {
        body: body || "New update available",
        icon: icon || "/pwa-192x192.png",
        badge: badge || "/pwa-192x192.png",
        data: { url: url || "/predictions" },
        vibrate: [200, 100, 200],
        tag: "betsightly-update",
        renotify: true,
      })
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification("BetSightly", {
        body: event.data.text(),
        icon: "/pwa-192x192.png",
      })
    );
  }
});

// Notification click handler — open the app to the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/predictions";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
