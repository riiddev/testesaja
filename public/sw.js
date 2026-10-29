const CACHE_NAME = "sinauu-shell-v2";
const SHELL = [
  "/", "/index.html", "/belajar.html", "/login.html",
  "/manifest.webmanifest", "/assets/sinauu-app-icon.svg", "/assets/sinauu-mark.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(SHELL.map((path) =>
        fetch(path).then((response) => {
          if (response.ok) return cache.put(path, response);
          return undefined;
        }).catch(() => undefined)
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("sinauu-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Account, session, and learning API responses must always go to the live server.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match("/belajar.html")) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
