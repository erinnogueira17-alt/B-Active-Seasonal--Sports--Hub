/*
 * Seasonal Sports Hub — service worker.
 * Conservative strategy so a deploy never leaves a stale white screen:
 *  - Navigations (HTML): network-first, fall back to cached shell when offline.
 *  - Hashed build assets (/assets/*) & images: cache-first (safe — names are content-hashed).
 *  - API calls (/api/*): always go to the network, never cached.
 */
const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.add("/")).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Blob, images) pass through
  if (url.pathname.startsWith("/api/")) return; // never cache API/tRPC

  // App navigations → network-first, cached shell as offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL).then((c) => c.put("/", res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(req))),
    );
    return;
  }

  // Hashed static assets → cache-first.
  if (url.pathname.startsWith("/assets/") || /\.(png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          }),
      ),
    );
  }
});
