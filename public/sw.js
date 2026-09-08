/* ASTRAEA service worker — STATIC APP SHELL ONLY (v2).
 * HANYA aset statis eksplisit (whitelist) yang boleh masuk Cache Storage.
 * Navigasi: network-first -> fallback /offline (HTML navigasi tak pernah disimpan).
 * API/realtime/auth/kamera/RSC/prefetch/WS: NETWORK ONLY.
 */
const STATIC_CACHE = "astraea-static-v2";

const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          "/icons/icon-192.png",
          "/icons/icon-512.png",
          "/icons/icon-maskable-512.png",
        ])
      )
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

// Whitelist eksplisit: HANYA path ini yang boleh di-cache.
function isSafeStaticAsset(url) {
  const p = url.pathname;
  return (
    p.startsWith("/_next/static/") ||
    p.startsWith("/icons/") ||
    p === "/logo.png" ||
    p === "/file.svg" ||
    p === "/globe.svg" ||
    p === "/window.svg" ||
    p === "/next.svg" ||
    p === "/vercel.svg"
  );
}

// Semua yang dinamis/autentikasi/realtime: NETWORK ONLY.
function isNetworkOnly(url, request) {
  const p = url.pathname;
  if (
    p.startsWith("/api/") ||
    p.startsWith("/_next/data/") ||
    p.includes("/snapshot") ||
    p.includes("/stream") ||
    p.includes("/detect") ||
    p.includes("/ws")
  ) {
    return true;
  }
  // RSC / router prefetch App Router: jangan pernah cache.
  const rsc = request.headers.get("RSC");
  if (rsc !== null) return true;
  if (request.headers.get("Next-Router-Prefetch") !== null) return true;
  if (request.headers.get("Next-Router-State-Tree") !== null) return true;
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("text/x-component")) return true;
  return false;
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
  // ws:// dan wss:// bukan http(s) -> sudah dikecualikan di atas; WS tak disentuh.

  if (isNetworkOnly(url, request)) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigasi: network first, fallback offline. HTML tak disimpan.
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

  // HANYA whitelist yang boleh SWR. Sisanya lewat tanpa cache.
  if (url.origin === self.location.origin && isSafeStaticAsset(url)) {
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
