const CACHE_NAME = "qr-studio-cache-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./icon-192.svg",
  "./icon-512.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === "navigate") {
          return caches.match("./offline.html");
        }

        return new Response("Offline", {
          status: 503,
          statusText: "Offline"
        });
      })
  );
});