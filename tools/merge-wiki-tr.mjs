/*
 * Geolite - mezcla en data/wiki las traducciones a mano de la Enciclopedia (solo desarrollo, sin red).
 *   node tools/merge-wiki-tr.mjs
 * tools/wiki-tr/<l>.json: { id: [titulo, descripcion, texto, historia] } traducido del articulo ingles (data/wiki/en.json) para las tarjetas
 * cuya Wikipedia en ese idioma no tiene articulo. Se guardan en data/wiki/<l>.json con un 5.o campo "en" (idioma de origen):
 * el juego lo acredita como "traducido de Wikipedia en ingles" y enlaza el articulo original (js/wiki.js, js/codex.js).
 * Nunca pisa un texto propio de esa Wikipedia. Idempotente: relanzarlo tras add-langs / add-codex / add-places / fill-wiki-gaps.
 * Tambien pone la nota corta (<l>-s.json) y el nombre del lugar (data/places.js) si solo tenian el ingles.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "data", "wiki"), TR = path.join(ROOT, "tools", "wiki-tr");
const CJK = l => l === "zh" || l === "ja";
const firstSentence = (s, L) => (CJK(L) ? (s.match(/^[^。！？]*[。！？]/) || [s])[0] : s.split(/(?<=[.!?])\s/)[0] || "");
const clean = t => String(t || "").replace(/\s*[(（].*?[)）]\s*/g, " ").split(/[,，]/)[0].replace(/\s+/g, " ").trim();

const PJ = path.join(ROOT, "data", "places.js"), ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(PJ, "utf8"), ctx);
const PLACES = ctx.window.AIQ.PLACES, PCOUNTRY = ctx.window.AIQ.PCOUNTRY, byId = Object.fromEntries(PLACES.map(p => [p[0], p]));
let names = 0;
for (const f of fs.readdirSync(TR).filter(f => /^[a-z]{2}\.json$/.test(f))) {
  const L = f.slice(0, 2), T = JSON.parse(fs.readFileSync(path.join(TR, f), "utf8"));
  const fw = path.join(WIKI, L + ".json"), fs2 = path.join(WIKI, L + "-s.json"), W = JSON.parse(fs.readFileSync(fw, "utf8")), SH = JSON.parse(fs.readFileSync(fs2, "utf8"));
  let n = 0, kept = 0;
  for (const [id, r] of Object.entries(T)) {
    if (W[id] && !W[id][4]) { kept++; continue; }                          // ya hay articulo propio en ese idioma
    W[id] = [r[0], r[1] || "", r[2] || "", r[3] || "", "en"]; n++;
    const p = byId[id];
    if (p) {
      const d = r[1] ? r[1][0].toUpperCase() + r[1].slice(1) + (CJK(L) ? "。" : ". ") : "", s = (d + firstSentence(r[2] || "", L)).slice(0, 240);
      if (s) SH[id] = s;
      if (!p[6][L] || p[6][L] === p[6].en) { p[6][L] = clean(r[0]); names++; }
    }
  }
  fs.writeFileSync(fw, JSON.stringify(W)); fs.writeFileSync(fs2, JSON.stringify(SH));
  console.log(L, "traducciones mezcladas:", n, kept ? `(${kept} ya tenian articulo propio y se respetan)` : "");
}
if (names) {
  const head = fs.readFileSync(PJ, "utf8").split("\n")[0];
  fs.writeFileSync(PJ, head + "\nwindow.AIQ = window.AIQ || {};\nwindow.AIQ.PLACES = " + JSON.stringify(PLACES) + ";\nwindow.AIQ.PCOUNTRY = " + JSON.stringify(PCOUNTRY) + ";\n");
  console.log("places.js: nombres traducidos", names);
}
