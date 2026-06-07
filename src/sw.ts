/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ── Offline fallback ───────────────────────────────────
// Serve /offline.html when a navigation request fails (user is offline
// and the page isn't cached yet)
const OFFLINE_URL = "/offline.html";

// Pre-cache the offline page on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("offline-fallback").then((cache) => cache.add(OFFLINE_URL))
  );
});

setCatchHandler(async ({ event }) => {
  if ((event as FetchEvent).request?.destination === "document") {
    const cache = await caches.open("offline-fallback");
    const cached = await cache.match(OFFLINE_URL);
    return cached || Response.error();
  }
  return Response.error();
});

// ── API cache — network first, fall back to cached data ──
registerRoute(
  ({ url }) => url.origin === "https://betsightly-api.onrender.com" && url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 8,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// ── Font cache — cache first (fonts rarely change) ───────
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({
    cacheName: "fonts-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ── CSS/JS — stale while revalidate for fast loads ───────
registerRoute(
  ({ request }) => request.destination === "style" || request.destination === "script",
  new StaleWhileRevalidate({
    cacheName: "static-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// ── Image cache — cache first ────────────────────────────
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
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
