/**
 * SINAUENGLISH V2 — Service Worker
 * 
 * Provides offline App Shell caching and manages mobile push/local mission notifications.
 */

const CACHE_NAME = "sinau-v2-cache-v1";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/favicon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Install: Cache essential app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Sebagian aset gagal dipra-cache:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy for offline capability
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass Google Apps Script API endpoints from service worker caching
  if (url.origin.includes("script.google.com") || url.origin.includes("googleusercontent.com")) {
    return;
  }

  // Navigation requests: Network-first with cache fallback to /index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // Static assets: Stale-while-revalidate
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default fetch
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// Notification Click: Navigate to target learning view
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/belajar/missions";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/belajar") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Push & Message Event Handlers
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "SHOW_TEST_NOTIFICATION") {
    const title = event.data.title || "SinauEnglish V2";
    const options = {
      body: event.data.body || "Pengingat misi harian aktif!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/favicon.svg",
      data: { url: event.data.url || "/belajar/missions" },
      tag: "sinau-mission-reminder"
    };
    self.registration.showNotification(title, options);
  }
});
