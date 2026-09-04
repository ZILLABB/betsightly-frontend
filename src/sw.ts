/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, NetworkOnly, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

// Immediately activate new service workers — don't wait for all tabs to close.
// This ensures deploy updates are picked up on the next navigation/reload.
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open("offline-fallback").then((cache) => cache.add("/offline.html")),
      self.skipWaiting(),
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ── Offline fallback ───────────────────────────────────
const OFFLINE_URL = "/offline.html";

setCatchHandler(async ({ event }) => {
  if ((event as FetchEvent).request?.destination === "document") {
    const cache = await caches.open("offline-fallback");
    const cached = await cache.match(OFFLINE_URL);
    return cached || Response.error();
  }
  return Response.error();
});

// Current betting state must never fall back to yesterday's response.
registerRoute(
  ({ url }) => url.origin === "https://betsightly-api.onrender.com" && [
    "/api/leagues/daily-accumulators", "/api/leagues/bookable-now",
    "/api/leagues/bookings", "/api/leagues/live-scores",
  ].includes(url.pathname),
  new NetworkOnly(),
);

// ── Other API data may use bounded offline fallback ──
registerRoute(
  ({ url }) => url.origin === "https://betsightly-api.onrender.com" &&
    url.pathname.startsWith("/api/") && ![
      "/api/leagues/daily-accumulators", "/api/leagues/bookable-now",
      "/api/leagues/bookings", "/api/leagues/live-scores",
    ].includes(url.pathname),
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

// ── CSS/JS — network first so deploys are picked up fast ──
registerRoute(
  ({ request }) => request.destination === "style" || request.destination === "script",
  new NetworkFirst({
    cacheName: "static-cache",
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }),
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

// Notification click handler
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
