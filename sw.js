/* Geolite - service worker: funciona sin conexion (cache de la app) y se actualiza solo. */
const CACHE = "geolite-v0.18.1";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/style.css", "css/boot.css", "css/skins.css", "css/codex.css", "css/hub.css", "css/premium.css", "css/challenges.css", "css/uikit.css", "css/tour.css", "css/marcador.css", "js/marcador.js", "css/nombre.css", "js/nombre.js", "css/podio.css", "css/portada.css", "js/podio.js", "css/salir.css", "js/salir.js","js/uikit.js", "js/tips.js", "js/tour.js", "js/jukebox.js", "js/profile.js", "js/rank.js", "js/relics.js", "js/challenges.js", "js/chfx.js", "js/dealer.js", "js/pointer.js", "js/adventure.js", "js/hub.js", "js/icons.js", "js/i18n2.js", "js/i18n3.js", "js/i18n4.js", "js/i18n5.js", "js/art.js", "data/codex.js", "data/places.js", "js/codex.js", "js/wiki.js",
  "js/vendor/topojson-client.min.js", "js/vendor/earcut.min.js", "data/world.js", "data/classic.js", "data/locations.js", "data/history.js", "data/classic-tr.js", "data/campaigns.js",
  "js/geo.js", "js/i18n.js", "js/logo.js", "js/support.js", "js/audio.js", "js/map2d.js", "js/map.js", "js/skins.js", "js/game.js", "data/flags.js", "js/steam.js",
  "assets/icon-192.png", "assets/icon-512.png", "assets/logo.png", "assets/icons/logo_mark.png", "assets/icons/logo_mark_s.png", "favicon.ico",
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                        // servicios externos: siempre red
  if (url.pathname.startsWith("/api/")) return;                      // clasificacion: siempre en vivo (una respuesta vieja haria creer que hay servidor)
  // red primero para lo propio (asi siempre hay la version mas nueva) y cache como respaldo sin conexion; las fuentes, cache primero
  const isFont = url.pathname.includes("/fonts/");
  e.respondWith(
    (isFont ? caches.match(req) : Promise.resolve(null)).then(hit => hit || fetch(req).then(res => {
      // solo respuestas enteras (200): la musica llega por trozos (206) y cache.put los rechaza; las fotos HD (~900 MB) no se guardan: solo se piden al ampliar
      if (res.status === 200 && !url.pathname.includes("/assets/wiki/hd/")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => {                                                   // sin red: solo las paginas caen a la portada (nunca un script o una imagen)
      const nav = req.mode === "navigate";                             // una pagina no puede servirse con una respuesta redirigida (Vercel manda index.html -> /)
      return caches.match(req).then(r => (r && !(nav && r.redirected) ? r : nav ? caches.match("./") : Response.error()));
    }))
  );
});
