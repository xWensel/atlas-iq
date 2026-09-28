/*
 * Geolite - datos de los modos Clasico "Eventos" y "Personajes" (solo desarrollo, necesita red).
 *   node tools/build-extra.mjs      -> tools/extra-data.json (lo lee tools/build-classic.mjs, que ya no necesita red)
 * Por cada titulo de tools/extra-src.mjs consulta Wikidata:
 *   personajes: lugar de nacimiento (P19) y sus coordenadas, fechas (P569/P570), retrato (P18), descripcion
 *   eventos:    coordenadas (P625) o las de su ubicacion (P276), fecha (P585/P580), pais (P17)
 * Nombres y descripciones en los 6 idiomas; la fama es el numero de Wikipedias con articulo.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { PEOPLE, EVENTS, COORD_FIX } from "./extra-src.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["en", "es", "fr", "pt", "de", "it", "zh", "ko", "ja", "ru", "pl"];
const QLANGS = [...LANGS, "zh-hans", "zh-cn", "mul"].join("|");                     // chino: preferimos simplificado (zh-hans/zh-cn)
const pick = (m, l) => (l === "zh" ? m["zh-hans"] || m["zh-cn"] || m.zh : m[l]);
const UA = { "User-Agent": "Geolite-builder/1.0 (educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0" };
const WD = "https://www.wikidata.org/w/api.php?format=json&action=wbgetentities";

/* reintenta tambien cuando el limite de peticiones devuelve texto en vez de JSON, o un JSON de error */
async function jget(url) {
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
      if (r.ok) { const j = JSON.parse(await r.text()); if (!j.error) return j; }
      else if (r.status !== 429 && r.status < 500) return null;
    } catch (e) { /* texto de "too many requests" o red: se reintenta */ }
    await new Promise(s => setTimeout(s, 5000 * (i + 1)));
  }
  throw new Error("Sin respuesta de " + url.slice(0, 120));
}
const chunks = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

/* Wikidata no sigue las redirecciones de la Wikipedia: se resuelven antes, 50 titulos por peticion */
async function canon(titles) {
  const map = {};
  for (const part of chunks([...new Set(titles)], 50)) {
    const j = await jget(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(part.join("|"))}`);
    const q = (j && j.query) || {}, step = {};
    for (const x of [...(q.normalized || []), ...(q.redirects || [])]) step[x.from] = x.to;
    for (const t of part) { let c = t; for (let k = 0; k < 3 && step[c]; k++) c = step[c]; map[t] = c; }
    await new Promise(s => setTimeout(s, 600));
  }
  return map;
}
async function byTitles(src) {
  const cmap = await canon(src), back = {};
  for (const t of src) back[cmap[t]] = t;
  const titles = src.map(t => cmap[t]);
  const out = [], miss = [];
  for (const part of chunks([...new Set(titles)], 50)) {
    const j = await jget(`${WD}&sites=enwiki&titles=${encodeURIComponent(part.join("|"))}&props=labels|descriptions|claims|sitelinks&languages=${QLANGS}`);
    for (const e of Object.values((j && j.entities) || {})) {
      if (e.missing !== undefined) { miss.push(e.title); continue; }
      e.src = back[(e.sitelinks.enwiki || {}).title] || (e.sitelinks.enwiki || {}).title; out.push(e);
    }
    await new Promise(s => setTimeout(s, 400));
  }
  return { out, miss };
}
async function byIds(ids) {
  const out = {};
  for (const part of chunks([...new Set(ids)], 50)) {
    const j = await jget(`${WD}&ids=${part.join("|")}&props=labels|claims&languages=${QLANGS}`);
    Object.assign(out, (j && j.entities) || {});
    await new Promise(s => setTimeout(s, 400));
  }
  return out;
}

const snaks = (e, P) => ((e.claims || {})[P] || []).filter(c => c.rank !== "deprecated" && c.mainsnak && c.mainsnak.datavalue).sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred"));
const val = (e, P) => { const c = snaks(e, P)[0]; return c ? c.mainsnak.datavalue.value : null; };
const idOf = (e, P) => { const v = val(e, P); return v && v.id; };
const yearOf = (e, ...Ps) => { for (const P of Ps) { const v = val(e, P); const m = v && String(v.time).match(/^([+-])0*(\d+)-/); if (m) return (m[1] === "-" ? -1 : 1) * +m[2]; } return null; };
const coordOf = e => { const v = e && val(e, "P625"); return v && v.latitude != null ? { lat: +v.latitude.toFixed(4), lon: +v.longitude.toFixed(4) } : null; };
const fixOf = e => { const f = COORD_FIX[e.src]; return f ? { lat: f[0], lon: f[1] } : null; };
const clean = s => String(s || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
/* Wikidata guarda cada vez mas nombres propios solo en la etiqueta "mul" (multilingue): respaldo en ese orden,
 * luego el titulo del articulo en esa Wikipedia y por ultimo el ingles */
const lab = e => {
  const o = {}, L = e.labels || {}, S = e.sitelinks || {};
  for (const l of LANGS) o[l] = clean((pick(L, l) || L.mul || {}).value || (S[l + "wiki"] || {}).title || (L.en || {}).value || (S.enwiki || {}).title || "");
  return o;
};
const desc = e => { const o = {}, D = e.descriptions || {}; for (const l of LANGS) o[l] = (pick(D, l) || D.en || {}).value || ""; return o; };
const fame = e => Object.keys(e.sitelinks || {}).filter(k => /wiki$/.test(k) && !/^(commons|species|meta|mediawiki|wikidata|sources)wiki$/.test(k)).length;

const P = await byTitles(PEOPLE), E = await byTitles(EVENTS);
if (P.miss.length) console.warn("Personajes sin articulo:", P.miss.join(" | "));
if (E.miss.length) console.warn("Eventos sin articulo:", E.miss.join(" | "));

const people = P.out.filter(e => (e.claims.P31 || []).some(c => c.mainsnak.datavalue && c.mainsnak.datavalue.value.id === "Q5"));
const placeIds = [...people.map(e => idOf(e, "P19")), ...E.out.map(e => idOf(e, "P276"))].filter(Boolean);
const PL = await byIds(placeIds);
const countryIds = [...Object.values(PL).map(e => idOf(e, "P17")), ...E.out.map(e => idOf(e, "P17"))].filter(Boolean);
const CO = await byIds(countryIds);
const countryLab = id => (id && CO[id] ? lab(CO[id]) : null);
/* si el lugar de nacimiento es un edificio (hospital, mansion...: sin poblacion P1082) se nombra el municipio que lo contiene */
/* ...y lo mismo si el lugar es tan pequeño que ni tiene nombre en español (parroquias, barrios) */
const isTown = e => !!(e && val(e, "P1082"));
const minor = bp => !isTown(bp) || !(bp.labels || {}).es;
const ADM = await byIds(people.map(e => PL[idOf(e, "P19")]).filter(bp => bp && minor(bp)).map(bp => idOf(bp, "P131")).filter(Boolean));
const townOf = bp => { const a = minor(bp) && ADM[idOf(bp, "P131")]; return a && isTown(a) && (a.labels || {}).es ? a : bp; };
/* la ubicacion de un evento no puede ser un estado (a menudo historico: "Imperio del Brasil", "India britanica") */
const STATEISH = new Set(["Q3024240", "Q6256", "Q7275", "Q3624078", "Q48349", "Q417175", "Q1250464", "Q1763527", "Q133156"]);
const isState = e => !!(e && ((e.claims.P31 || []).some(c => c.mainsnak.datavalue && STATEISH.has(c.mainsnak.datavalue.value.id)) || val(e, "P297")));

const outP = [], outE = [], drop = [];
for (const e of people) {
  const bp = PL[idOf(e, "P19")], c = fixOf(e) || coordOf(bp);
  if (!bp) { drop.push("P: " + lab(e).en + " (sin lugar de nacimiento)"); continue; }
  if (!c) { drop.push("P: " + lab(e).en + " (sin coordenadas de nacimiento)"); continue; }
  const img = val(e, "P18");
  outP.push({ id: e.id, name: lab(e), desc: desc(e), fame: fame(e), ...c, born: yearOf(e, "P569"), died: yearOf(e, "P570"),
    place: lab(townOf(bp)), country: countryLab(idOf(bp, "P17")), img: typeof img === "string" ? img : null });
}
for (const e of E.out) {
  const loc0 = PL[idOf(e, "P276")], locE = isState(loc0) || fixOf(e) ? null : loc0, c = fixOf(e) || coordOf(e) || coordOf(locE);
  const named = locE && (locE.labels || {}).es ? locE : null;              // sin nombre en español ("Waterloo Battlefield"): solo el pais
  if (!c) { drop.push("E: " + lab(e).en + " (sin coordenadas)"); continue; }
  outE.push({ id: e.id, name: lab(e), desc: desc(e), fame: fame(e), ...c, year: yearOf(e, "P585", "P580", "P571"),
    place: named ? lab(named) : null, country: countryLab(idOf(e, "P17") || (locE && idOf(locE, "P17"))) });
}
if (drop.length) console.warn("Descartados:\n  " + drop.join("\n  "));
const dedup = a => { const s = new Set(); return a.filter(x => !s.has(x.id) && s.add(x.id)); };
/* nombres de los paises actuales (los de data/places.js) en los 10 idiomas: build-classic.mjs pone el pais
 * por coordenadas y data/places.js solo trae 6 idiomas */
const vctx = { window: {} }; vm.createContext(vctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), vctx);
const CQ = await byIds(Object.keys(vctx.window.AIQ.PCOUNTRY || {}));
const countries = Object.fromEntries(Object.entries(CQ).filter(([, e]) => e.labels).map(([q, e]) => [q, lab(e)]));
/* continente(s) de cada pais (P30): build-classic.mjs reparte los lugares en regiones con esto */
const CONT = { Q46: "europe", Q48: "asia", Q15: "africa", Q49: "namerica", Q18: "samerica", Q55643: "oceania", Q538: "oceania", Q3960: "oceania", Q51: "antarctica" };
const continents = Object.fromEntries(Object.entries(CQ).map(([q, e]) => [q, [...new Set(snaks(e, "P30").map(c => CONT[c.mainsnak.datavalue.value.id]).filter(Boolean))]]));
/* fama real de cada lugar del banco (numero de Wikipedias con articulo): en data/places.js la "fama" es solo
 * la posicion en tools/places-src.mjs, y build-classic.mjs ordena los niveles de facil a dificil con esto */
const WIKI_EN = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "wiki", "en.json"), "utf8"));
const byTitle = {};
for (const part of chunks(Object.entries(WIKI_EN).filter(([, v]) => v && v[0]), 50)) {
  const j = await jget(`${WD}&sites=enwiki&titles=${encodeURIComponent(part.map(([, v]) => v[0]).join("|"))}&props=sitelinks`);
  for (const e of Object.values((j && j.entities) || {})) if (e.sitelinks && e.sitelinks.enwiki) byTitle[e.sitelinks.enwiki.title] = fame(e);
  await new Promise(s => setTimeout(s, 400));
}
const placeFame = Object.fromEntries(Object.entries(WIKI_EN).filter(([, v]) => v && byTitle[v[0]] != null).map(([id, v]) => [id, byTitle[v[0]]]));
fs.writeFileSync(path.join(ROOT, "tools", "extra-data.json"), JSON.stringify({ people: dedup(outP), events: dedup(outE), countries, continents, placeFame }, null, 1));
console.log(`Fama de lugares: ${Object.keys(placeFame).length}/${Object.keys(WIKI_EN).length}`);
console.log(`Personajes: ${dedup(outP).length}  Eventos: ${dedup(outE).length}`);
