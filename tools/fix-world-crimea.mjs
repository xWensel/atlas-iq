/*
 * Geolite - pasa Crimea de Rusia a Ucrania en data/world.js (postura de la ONU; world-atlas/Natural Earth la pone en Rusia).
 * El poligono de Crimea se FUSIONA con Ucrania (topojson.mergeArcs): no queda frontera interna en el istmo de Perekop.
 *   node tools/fix-world-crimea.mjs      (sin red; idempotente: si Crimea ya esta en Ucrania no hace nada)
 * Vuelve a lanzarlo si se regenera data/world.js desde world-atlas.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "data", "world.js"), src = fs.readFileSync(file, "utf8");
const m = src.match(/^(window\.ATLAS_TOPO=)(.*);(\s*)$/m); if (!m) throw new Error("formato de data/world.js desconocido");
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "vendor", "topojson-client.min.js"), "utf8"), ctx);
const tj = ctx.topojson, topo = JSON.parse(m[2]), G = topo.objects.countries.geometries;
const ru = G.find(g => g.properties.name === "Russia"), ua = G.find(g => g.properties.name === "Ukraine");
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const polys = tj.feature(topo, ru).geometry;
const idx = (polys.type === "Polygon" ? [polys.coordinates] : polys.coordinates).findIndex(p => inRing(34.1, 44.95, p[0]));   // Simferopol
if (idx < 0 || ru.type !== "MultiPolygon") { console.log("Crimea ya esta en Ucrania: nada que hacer."); process.exit(0); }
const merged = tj.mergeArcs(topo, [ua, { type: "Polygon", arcs: ru.arcs[idx] }]);
ua.type = merged.type; ua.arcs = merged.arcs;
ru.arcs.splice(idx, 1); if (ru.arcs.length === 1) { ru.type = "Polygon"; ru.arcs = ru.arcs[0]; }
fs.writeFileSync(file, src.replace(m[0], () => m[1] + JSON.stringify(topo) + ";" + m[3]));
console.log(`Crimea (poligono ${idx} de Rusia) fusionada con Ucrania: ${ua.arcs.length} poligonos.`);
