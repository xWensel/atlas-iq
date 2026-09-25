/* Atlas IQ - service worker: funciona sin conexion (cache de la app) y se actualiza solo. */
const CACHE = "atlas-iq-v0.3";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/style.css", "css/boot.css",
  "js/vendor/topojson-client.min.js", "js/vendor/earcut.min.js", "data/world.js", "data/classic.js", "data/locations.js", "data/history.js", "data/campaigns.js",
  "js/geo.js", "js/i18n.js", "js/logo.js", "js/support.js", "js/audio.js", "js/map2d.js", "js/map.js", "js/game.js",
  "assets/icon-192.png", "assets/icon-512.png",
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                        // servicios externos: siempre red
  // red primero para lo propio (asi siempre hay la version mas nueva) y cache como respaldo sin conexion; las fuentes, cache primero
  const isFont = url.pathname.includes("/fonts/");
  e.respondWith(
    (isFont ? caches.match(req) : Promise.resolve(null)).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))))
  );
});
