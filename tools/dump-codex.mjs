/* Vuelca las entradas de la Enciclopedia que NO estan en data/places.js (clasico, extendido, personajes, sucesos y curiosidades)
   a tools/codex-extra.json, para que build-places.mjs --extra les descargue el texto y la foto. Solo desarrollo. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = {};
const ctx = { console, setTimeout, clearTimeout, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => (store[k] = v) }, IntersectionObserver: class { observe() {} unobserve() {} }, document: { getElementById: () => null, createElement: () => ({}), querySelectorAll: () => [] }, indexedDB: undefined, performance: { now: () => 0 }, navigator: {}, location: { search: "" } };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["data/world.js", "data/classic.js", "data/locations.js", "data/history.js", "data/codex.js", "data/places.js", "data/campaigns.js", "js/geo.js", "js/i18n.js", "js/support.js", "js/codex.js"]) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f }); } catch (e) { console.error("ERR", f, e.message.slice(0, 120)); }
}
const A = ctx.window.AIQ;
const world = { byName: new Proxy({}, { get: (t, k) => (typeof k === "string" ? { polys: [{ bbox: [0, 0, 1, 1] }] } : undefined) }) };
A.codex.init(world, {});
const inPlaces = new Set(A.PLACES.map(r => r[0])), out = [];
for (const id of A.codex.ids()) {
  if (inPlaces.has(id)) continue;
  const e = A.codex.entry(id);
  out.push({ id, type: e.type, wiki: e.wiki, full: e.full || null, name: e.name.en, override: null, lat: e.lat, lon: e.lon, nogeo: !!e.nogeo, rarity: e.rarity });
}
fs.writeFileSync(path.join(ROOT, "tools", "codex-extra.json"), JSON.stringify(out));
console.log("entradas del juego:", A.codex.total(), "· ya en places:", inPlaces.size, "· extra:", out.length);
