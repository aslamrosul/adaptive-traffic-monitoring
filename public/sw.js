/* ASTRAEA service worker — STATIC APP SHELL ONLY.
 * Network-first untuk navigasi (offline -> /offline), cache-first/SWR untuk
 * aset statis, NETWORK-ONLY untuk semua API/realtime/auth/kamera/WS.
 * Tidak ada respons API/sesi/telemetri yang disimpan di Cache Storage.
 */
const STATIC_CACHE = "astraea-static-v1";

const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("astraea-static-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNetworkOnly(url) {
  const p = url.pathname;
  return (
    p.startsWith("/api/") ||
    p.startsWith("/_next/data/") ||
    p.includes("/snapshot") ||
    p.includes("/stream") ||
    p.includes("/detect") ||
    p.includes("/ws")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // API/realtime/kamera/vision: NETWORK ONLY, jangan simpan.
  if (isNetworkOnly(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigasi: network first, fallback offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return offline || Response.error();
      })
    );
    return;
  }

  // Aset statis same-origin: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
