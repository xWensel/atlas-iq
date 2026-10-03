/*
 * Geolite - fronteras invisibles de mares, oceanos, golfos, estrechos y lagos (solo desarrollo).
 *   npm i --no-save --no-package-lock polygon-clipping   (solo para este script: une los trozos de cada masa de agua)
 *   node tools/build-aguas.mjs        descarga (una vez, a tools/cache-ne/) y regenera data/aguas.js
 * Fuente: Natural Earth 10m (dominio publico): geography_marine_polys (ya recortado al agua: las islas son huecos) y lakes.
 * Cada pregunta de agua del banco (data/places.js) se acierta haciendo clic DENTRO de su masa de agua, como un pais (js/aguas.js).
 * Regla de reparto: un oceano incluye sus mares marginales que no tienen pregunta propia; un mar incluye los mares que contiene
 * (el Mediterraneo, el Adriatico y el Egeo...). Los mares con pregunta propia no se suman a su oceano.
 * Formato: A.WATERS[id] = { p: [ poligono = [ anillo = [lon, lat, lon, lat, ...], ...huecos ], ... ], c?: [lon, lat] }
 *   c = punto interior para la etiqueta cuando el de data/places.js cae fuera de la masa de agua.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import pc from "polygon-clipping";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "tools", "cache-ne"); fs.mkdirSync(CACHE, { recursive: true });
const BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/";
async function load(name) {
  const f = path.join(CACHE, name + ".geojson");
  if (!fs.existsSync(f)) { const r = await fetch(BASE + name + ".geojson"); if (!r.ok) throw new Error(name + " " + r.status); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
  return JSON.parse(fs.readFileSync(f, "utf8"));
}
const MARINE = await load("ne_10m_geography_marine_polys"), LAKES = await load("ne_10m_lakes");

/* id del banco -> nombres de Natural Earth ("m:" mar, "l:" lago) */
const W = {
  "arctic-ocean": "m:Arctic Ocean|m:Beaufort Sea|m:Chukchi Sea|m:East Siberian Sea|m:Laptev Sea|m:Kara Sea|m:Barents Sea|m:Lincoln Sea",
  "atlantic-ocean": "m:North Atlantic Ocean|m:South Atlantic Ocean|m:Labrador Sea|m:Greenland Sea|m:Norwegian Sea|m:Bay of Biscay|m:Gulf of Guinea|m:Irish Sea|m:Gulf of Saint Lawrence",
  "pacific-ocean": "m:North Pacific Ocean|m:South Pacific Ocean|m:Philippine Sea|m:Bering Sea|m:Gulf of Alaska|m:Sea of Okhotsk|m:East China Sea|m:Yellow Sea|m:Solomon Sea|m:Bismarck Sea",
  "indian-ocean": "m:INDIAN OCEAN|m:Laccadive Sea|m:Andaman Sea|m:Mozambique Channel|m:Gulf of Aden|m:Gulf of Oman",
  "southern-ocean": "m:SOUTHERN OCEAN|m:Weddell Sea|m:Bellingshausen Sea|m:Amundsen Sea|m:Scotia Sea|m:Davis Sea",
  "mediterranean-sea": "m:Mediterranean Sea|m:Tyrrhenian Sea|m:Ionian Sea|m:Adriatic Sea|m:Aegean Sea|m:Balearic Sea|m:Ligurian Sea|m:Alboran Sea|m:Sea of Crete|m:Golfe du Lion|m:Gulf of Gabès|m:Gulf of Sidra|m:Sea of Marmara",
  "adriatic-sea": "m:Adriatic Sea",
  "aegean-sea": "m:Aegean Sea|m:Sea of Crete",
  "arabian-sea": "m:Arabian Sea",
  "baltic-sea": "m:Baltic Sea|m:Gulf of Bothnia|m:Gulf of Finland|m:Gulf of Riga",
  "bay-of-bengal": "m:Bay of Bengal",
  "black-sea": "m:Black Sea|m:Sea of Azov",
  "caribbean-sea": "m:Caribbean Sea|m:Gulf of Honduras",
  "coral-sea": "m:Coral Sea",
  "gulf-of-mexico": "m:Gulf of Mexico|m:Bahía de Campeche",
  "north-sea": "m:North Sea",
  "persian-gulf": "m:Persian Gulf",
  "red-sea": "m:Red Sea|m:Gulf of Suez|m:Gulf of Aqaba",
  "sargasso-sea": "m:Sargasso Sea",
  "sea-of-japan": "m:Sea of Japan|m:Tatar Strait",
  "south-china-sea": "m:South China Sea|m:Gulf of Tonkin|m:Gulf of Thailand",
  "tasman-sea": "m:Tasman Sea",
  "caspian-sea": "m:Caspian Sea",
  "english-channel": "m:English Channel",
  "strait-of-malacca": "m:Strait of Malacca|m:Strait of Singapore",
  "bosporus": "m:Bosporus",
  "hudson-bay": "m:Hudson Bay|m:James Bay",
  "chesapeake-bay": "m:Chesapeake Bay",
  "shark-bay": "m:Shark Bay",
  "lake-maracaibo": "m:Lago de Maracaibo",
  "dead-sea": "l:Dead Sea", "great-salt-lake": "l:Great Salt Lake", "lake-balaton": "l:Lake Balaton", "lake-chad": "l:Lake Chad", "lake-como": "l:Lago di Como",
  "lake-constance": "l:Bodensee", "lake-geneva": "l:Lake Geneva", "lake-ladoga": "l:Lake Ladoga", "lake-malawi": "l:Lake Malawi", "lake-michigan": "l:Lake Michigan",
  "lake-nicaragua": "l:Lago de Nicaragua", "lake-ontario": "l:Lake Ontario", "lake-superior": "l:Lake Superior", "lake-tahoe": "l:Lake Tahoe", "lake-tanganyika": "l:Lake Tanganyika",
  "lake-titicaca": "l:Lago Titicaca", "lake-victoria": "l:Lake Victoria", "lake-baikal": "l:Lake Baikal", "loch-ness": "l:Loch Ness", "lake-taupo": "l:Lake Taupo",
  "kati-thanda-lake-eyre": "l:Lake Eyre North|l:Lake Eyre South",
};
/* a mano (Natural Earth no los trae, o solo en trocitos): un anillo [lon, lat] por estrecho */
const HAND = {
  "bering-strait": [[-170.6, 65.0], [-168.9, 64.5], [-167.0, 64.6], [-166.6, 65.4], [-167.4, 66.4], [-169.6, 66.6], [-171.0, 65.9]],          // entre el cabo Dezhnev y el cabo Principe de Gales
  "strait-of-gibraltar": [[-6.03, 36.18], [-5.8, 36.05], [-5.6, 35.98], [-5.45, 36.07], [-5.34, 36.12], [-5.3, 35.9], [-5.42, 35.88], [-5.6, 35.85], [-5.75, 35.8], [-5.92, 35.79]],   // de Trafalgar-Spartel a Gibraltar-Ceuta
  "drake-passage": [[-69.5, -56.3], [-66.5, -55.6], [-62.5, -56.3], [-57.5, -60.8], [-57.0, -63.2], [-61.5, -63.8], [-65.5, -65.0], [-70.0, -62.5], [-72.0, -59.5]],   // del cabo de Hornos a las Shetland del Sur
};

const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const pick = (fc, name, lake) => fc.features.filter(f => norm(f.properties.name || "") === norm(name) && (!lake || true));
const polysOf = f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);

/* Douglas-Peucker en grados */
function rdp(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]; let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); if (d > md) { md = d; mi = i; }
    }
    if (md > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const span = ring => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x1 - x0, y1 - y0]; };
const rnd = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

function simplePoly(rings) {
  const out = []; const [sx, sy] = span(rings[0]), big = Math.max(sx, sy), tol = Math.max(0.004, Math.min(0.12, big * 0.0025)), d = big > 15 ? 2 : 3;
  rings.forEach((r, i) => {
    const [hx, hy] = span(r); if (i > 0 && Math.max(hx, hy) < Math.max(0.03, big * 0.015)) return;     // islas minusculas: fuera
    let q = rdp(r.slice(0, -1), tol); if (q.length < 3) return;
    const flat = []; for (const [x, y] of q) flat.push(rnd(x, d), rnd(y, d)); out.push(flat);
  });
  return out.length ? out : null;
}

/* punto interior (para la etiqueta): el de la rejilla mas lejos del borde */
const pip = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) { const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inside = (x, y, polys) => polys.some(p => pip(x, y, p[0]) && !p.slice(1).some(h => pip(x, y, h)));
const edgeKm = (x, y, polys) => { let m = 1e9; const k = Math.cos(y * Math.PI / 180); for (const p of polys) for (const r of p) for (let i = 0; i < r.length; i += 2) m = Math.min(m, Math.hypot((r[i] - x) * k, r[i + 1] - y)); return m * 111; };

const places = (() => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), ctx); const o = {}; ctx.window.AIQ.PLACES.forEach(r => (o[r[0]] = r)); return o; })();

const OUT = {}, missing = [];
for (const [id, spec] of Object.entries(W)) {
  const polys = [], raw = [];
  for (const part of spec.split("|")) {
    const lake = part[0] === "l", name = part.slice(2), fs_ = pick(lake ? LAKES : MARINE, name);
    if (!fs_.length) { missing.push(id + " <- " + part); continue; }
    for (const f of fs_) for (const p of polysOf(f)) raw.push(p);
  }
  /* los trozos se unen en una sola masa: sin fronteras internas (el borde que se dibuja es solo el de fuera) */
  let merged = raw; if (raw.length > 1) { try { merged = pc.union(raw[0], ...raw.slice(1)); } catch (e) { console.log("union fallida:", id, e.message); } }
  for (const p of merged) { const s = simplePoly(p); if (s) polys.push(s); }
  if (polys.length) OUT[id] = { p: polys };
}
for (const [id, ring] of Object.entries(HAND)) OUT[id] = { p: [[ring.flatMap(([x, y]) => [x, y])]] };
if (missing.length) { console.log("SIN POLIGONO:", missing.join("; ")); process.exitCode = 1; }

/* etiqueta: si el punto del banco no cae dentro, el que se indica aqui o, si no, el punto mas interior de una rejilla */
const LABEL = { "southern-ocean": [60, -62] };
let moved = 0;
for (const [id, e] of Object.entries(OUT)) {
  const r = places[id]; if (!r) { console.log("no esta en places.js:", id); continue; }
  if (LABEL[id] && inside(LABEL[id][0], LABEL[id][1], e.p)) { e.c = LABEL[id]; moved++; continue; }
  if (r[3] != null && inside(r[4], r[3], e.p)) continue;
  let best = null, bd = -1;
  for (const poly of e.p) {                                         // rejilla fina por poligono: los estrechos y los lagos alargados no caen en una rejilla del conjunto
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < poly[0].length; i += 2) { x0 = Math.min(x0, poly[0][i]); x1 = Math.max(x1, poly[0][i]); y0 = Math.min(y0, poly[0][i + 1]); y1 = Math.max(y1, poly[0][i + 1]); }
    const N = 80; for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) { const x = x0 + (x1 - x0) * a / N, y = y0 + (y1 - y0) * b / N; if (!inside(x, y, [poly])) continue; const d = edgeKm(x, y, [poly]) * Math.sqrt(Math.max(1e-6, (x1 - x0) * (y1 - y0))); if (d > bd) { bd = d; best = [rnd(x, 3), rnd(y, 3)]; } }
  }
  if (best) { e.c = best; moved++; console.log("etiqueta movida:", id, [r[4], r[3]], "->", best); }
}
const body = Object.entries(OUT).sort(([a], [b]) => a.localeCompare(b)).map(([id, e]) => ` ${JSON.stringify(id)}:${JSON.stringify(e)}`).join(",\n");
const js = `/* Generado por tools/build-aguas.mjs - no editar. Fronteras invisibles de mares, oceanos y lagos (Natural Earth, dominio publico; ver el comentario del script). */
window.AIQ = window.AIQ || {};
window.AIQ.WATERS = {
${body}
};
`;
fs.writeFileSync(path.join(ROOT, "data", "aguas.js"), js);
console.log("masas de agua:", Object.keys(OUT).length, "| etiquetas movidas:", moved, "| tamano:", (js.length / 1024).toFixed(0), "KB");
