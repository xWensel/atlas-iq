/*
 * Geolite - regenera el modo Clasico (data/classic.js) con contenido propio: data/places.js + data/wiki
 * (tools/build-places.mjs) y tools/extra-data.json (tools/build-extra.mjs, Eventos y Personajes).
 * No usa red: primero `node tools/build-extra.mjs` si cambian las listas de Eventos/Personajes.
 *
 *   node tools/build-classic.mjs
 *
 * Reglas del Clasico:
 *  - Todas las campanas tienen 10 niveles, de mas facil a mas dificil (fama), con las etiquetas
 *    2 x Easy, 2 x Medium, 2 x Hard, 2 x Very hard, 2 x Hardest.
 *  - Sin solapes: cada lugar sale en una sola campana; las capitales solo en "Capitales del mundo",
 *    los paises solo en "Banderas", las batallas y sucesos solo en "Eventos". Mundo y las regiones
 *    son ciudades, monumentos, naturaleza y sitios historicos.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(read("data/places.js"), ctx);
vm.runInContext(read("data/codex.js"), ctx);
const ckey = ctx.window.AIQ.ckey;             // la misma clave de la Enciclopedia que usa el juego
const PLACES = ctx.window.AIQ.PLACES;      // [id, kind, tier, lat, lon, countryQID, names{en..it}, fame0-99]
const PCOUNTRY = ctx.window.AIQ.PCOUNTRY;  // {QID: {en, es, ...}}
const FACTS_EN = JSON.parse(read("data/wiki/en-s.json"));
const LANGS6 = ["en", "es", "fr", "pt", "de", "it"];
const SHORT = Object.fromEntries(LANGS6.map(l => [l, JSON.parse(read(`data/wiki/${l}-s.json`))]));  // cada resumen empieza por una descripcion corta estilo Wikidata
const EXTRA = fs.existsSync(path.join(ROOT, "tools", "extra-data.json")) ? JSON.parse(read("tools/extra-data.json")) : { people: [], events: [], countries: {}, continents: {} };
/* tools/extra-fix.json: nombres, lugares y descripciones traducidos a mano donde Wikidata cae al ingles o no tiene nada ({QID: {name|place|desc: {idioma: texto}}}) */
const EXTRA_FIX = fs.existsSync(path.join(ROOT, "tools", "extra-fix.json")) ? JSON.parse(read("tools/extra-fix.json")) : {};
for (const e of [...(EXTRA.people || []), ...(EXTRA.events || [])]) { const fx = EXTRA_FIX[e.id]; if (fx) for (const k of ["name", "place", "desc"]) if (fx[k]) e[k] = { ...(e[k] || {}), ...fx[k] }; }

const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/* dificultad = menos Wikipedias con articulo (fama real, tools/build-extra.mjs); a igualdad, el orden de la
 * lista curada. En data/places.js la "fama" es solo la posicion en tools/places-src.mjs. */
const PFAME = EXTRA.placeFame || {};
const diffOf = p => (PFAME[p[0]] != null ? -PFAME[p[0]] * 1000 : 0) + p[2] * 100 + p[7];

/* ---------------------------------------------------------------- mapa y paises */
vm.runInContext(read("js/vendor/topojson-client.min.js"), ctx);
vm.runInContext(read("data/world.js"), ctx);
const WORLD = ctx.topojson.feature(ctx.window.ATLAS_TOPO, ctx.window.ATLAS_TOPO.objects.countries).features.map(f => ({
  name: f.properties.name, polys: f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates,
}));
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const QID_BY_EN = {}; for (const [q, n] of Object.entries(PCOUNTRY)) QID_BY_EN[n.en] = q;
const COUNTRY6 = {};                                                     // nombre Natural Earth -> nombres (6 idiomas de data/places.js + zh/ko/ja/ru de Wikidata)
for (const p of PLACES) if (p[1] === "country") COUNTRY6[p[0].slice(2)] = { ...(EXTRA.countries || {})[QID_BY_EN[p[6].en]], ...p[6] };
/* el mapa es de baja resolucion: una ciudad costera (Copenhague, Lisboa) puede caer "en el mar";
 * entonces vale el pais con el borde mas cercano a menos de 60 km */
function countryAt(lat, lon) {
  let f = WORLD.find(w => w.polys.some(poly => inRing(lon, lat, poly[0]) && !poly.slice(1).some(h => inRing(lon, lat, h))));
  if (!f) {
    let best = 60; const kx = 111.32 * Math.cos(lat * Math.PI / 180);
    for (const w of WORLD) for (const poly of w.polys) for (const [x, y] of poly[0]) { const d = Math.hypot((x - lon) * kx, (y - lat) * 110.57); if (d < best) { best = d; f = w; } }
  }
  return f && COUNTRY6[f.name] ? COUNTRY6[f.name] : null;
}

/* ---------------------------------------------------------------- regiones
 * Por el continente del pais (Wikidata P30, tools/extra-data.json). Paises sin continente o
 * transcontinentales se resuelven a mano o por coordenadas. Norteamerica sin EE. UU. ni Canada
 * (Mexico, Centroamerica, Caribe) cuenta como Latinoamerica. */
const REGION_FIX = {
  "Bosnia and Herzegovina": "europe", "Moldova": "europe", "Cyprus": "europe", "Italy": "europe", "Spain": "europe", "Norway": "europe",
  "Paraguay": "latam", "Chile": "latam", "Brazil": "latam", "Uruguay": "latam", "Ecuador": "latam", "Saint Lucia": "latam", "Aruba": "latam", "Panama": "latam",
  "Japan": "asia", "Myanmar": "asia", "Uzbekistan": "asia", "Kazakhstan": "asia", "Azerbaijan": "asia", "Georgia": "asia", "Armenia": "asia", "Yemen": "asia", "Indonesia": "asia",
  "Cape Verde": "africa", "Egypt": "africa",
  "Russia": (lat, lon) => (lon < 60 ? "europe" : "asia"),
  "Turkey": (lat, lon) => (lon < 29.5 && lat > 40.4 ? "europe" : "asia"),                 // Estambul y Tracia
  "France": (lat, lon) => (lon < -100 || (lat < -10 && lon > 100) ? "oceania" : lon < -30 ? "latam" : lon > 40 ? "africa" : "europe"),
  "Kingdom of the Netherlands": (lat, lon) => (lon < -30 ? "latam" : "europe"), "Netherlands": (lat, lon) => (lon < -30 ? "latam" : "europe"),
  "Kingdom of Denmark": (lat, lon) => (lon < -30 ? "namerica" : "europe"), "Denmark": (lat, lon) => (lon < -30 ? "namerica" : "europe"),
};
const NORTH_NOT_LATAM = new Set(["Canada", "Greenland", "Bermuda", "Saint Pierre and Miquelon"]);
function regionOf(p) {
  let q = p[5];
  if (!q) { const c = countryAt(p[3], p[4]); q = c && QID_BY_EN[c.en]; }
  if (!q) return null;
  if (q === "Q30") return "usa";
  const en = (PCOUNTRY[q] || {}).en, fx = REGION_FIX[en];
  if (fx) return typeof fx === "function" ? fx(p[3], p[4]) : fx;
  const c = ((EXTRA.continents || {})[q] || []).filter(x => x !== "antarctica");
  if (c.length !== 1) return null;
  if (c[0] === "samerica") return "latam";
  if (c[0] === "namerica") return NORTH_NOT_LATAM.has(en) ? "namerica" : "latam";
  return c[0];
}

/* batallas, asedios, tratados, catastrofes... van a Eventos: fuera de "Lugares historicos" */
const EVENTISH = /^(battle|siege|sack|fall|treaty|assassination|sinking|storming|bombing|attack|landing|massacre|conquest|revolt|uprising|raid|campaign|operation|signing|peace|great fire|eruption|explosion|discovery)\b|\b(battle|siege|disaster|earthquake|tsunami|eruption|massacre|landings?|rebellion|revolution|war|conference|congress|council|treaty|trials?|summit|accords?|agreement|declaration|coup|incident|expedition|crisis|flight|spill)\b/i;
const kindOf = p => (p[1] === "history" && EVENTISH.test(p[6].en) ? "event" : p[1]);

/* ---------------------------------------------------------------- textos de cada destino */
const FACT_OVERRIDES = {
  "puebla": "Founded by the Spanish in 1531 to secure the trade route between Mexico City and the port of Veracruz.",
};
const ABBR = /\b(?:U\.S|U\.K|U\.N|St|Mt|Mr|Mrs|Dr|vs|approx|no)\./g; // estas abreviaturas nunca cierran la frase (evita cortes tipo "St." o "U.S.")
function firstSentence(s) {
  s = String(s || "").trim();
  const m = s.replace(ABBR, x => x.slice(0, -1) + "\u0001").match(/^.*?[.!?](?=\s|$)/);
  let cut = (m ? m[0] : s).replace(/\u0001/g, ".");
  if (cut.length < 15) cut = s;                                    // frase demasiado corta (extraccion fallida) -> usa el texto completo
  return cut.replace(/\.\.+/g, ".").slice(0, 200);                  // "U.S.." -> "U.S." (doble punto ya presente en el resumen fuente)
}
function destName(p) {
  const en = p[6].en, qid = p[5];
  const country = qid && PCOUNTRY[qid] ? PCOUNTRY[qid].en : null;
  return country && country !== en ? `${en}, ${country}` : en;
}
/* dato curioso en cada idioma, corto como el ingles: la descripcion de data/wiki/<l>.json[id][1]; si falta, la
 * 1.a frase de la nota de <l>-s.json y, si no, la del articulo (<l>.json[id][2]). Los que se queden sin nada caen
 * al ingles y se listan en tools/classic-facts-missing.json para traducirlos a mano. */
const FACT_LANGS = ["es", "fr", "pt", "de", "it", "zh", "ko", "ja", "ru", "pl"];
const wikiFile = f => (fs.existsSync(path.join(ROOT, "data", "wiki", f)) ? JSON.parse(read(`data/wiki/${f}`)) : {});
const SHORT_ALL = Object.fromEntries(FACT_LANGS.map(l => [l, wikiFile(`${l}-s.json`)]));
const WIKI_ALL = Object.fromEntries(FACT_LANGS.map(l => [l, wikiFile(`${l}.json`)]));
const FACT_MISSING = {};
const FACT_FIX = fs.existsSync(path.join(ROOT, "tools", "classic-facts-fix.json")) ? JSON.parse(read("tools/classic-facts-fix.json")) : {};   // {id: {lang: "texto"}}: traducciones a mano, mandan sobre Wikipedia
function firstSentenceL(s) {
  s = String(s || "").trim();
  const m = s.replace(ABBR, x => x.slice(0, -1) + "\u0001").match(/^.*?(?:[.!?](?=\s|$)|[。！？])/);
  const cut = (m ? m[0] : s).replace(/\u0001/g, ".");
  return (cut.length < 4 ? s : cut).replace(/\.\.+/g, ".").slice(0, 200);
}
const clip = (s, l) => { s = String(s || "").trim(); if (!s) return ""; const cjk = l === "zh" || l === "ja"; s = s.replace(/[.。]$/, ""); return s[0].toLocaleUpperCase() + s.slice(1) + (/[!?！？]$/.test(s) ? "" : cjk ? "。" : "."); };
const WIKI_EN = wikiFile("en.json");
/* descripcion copiada tal cual del ingles en Wikidata ("Architectural structure"): no cuenta; los nombres cortos
 * que se escriben igual ("Haiti", "Verdun, France") si */
const copiedEn = (s, id) => { const en = WIKI_EN[id] && WIKI_EN[id][1]; return !!en && s.trim() === en.trim() && s.length > 20; };
function factIn(l, id) {
  if (FACT_FIX[id] && FACT_FIX[id][l]) return FACT_FIX[id][l];
  const w = WIKI_ALL[l][id], desc = w && w[1];
  if (desc && desc.length >= 4 && !copiedEn(desc, id)) return clip(desc, l);
  for (const src of [SHORT_ALL[l][id], w && w[2]]) { const t = src && firstSentenceL(src); if (t && !copiedEn(t.replace(/[.。]$/, ""), id) && !copiedEn(t, id)) return t; }
  return null;
}
function mkDest(p) {
  const f6 = {};
  for (const l of FACT_LANGS) { const t = factIn(l, p[0]); if (t) f6[l] = t; else (FACT_MISSING[p[0]] ||= { en: firstSentence(FACTS_EN[p[0]]), langs: [] }).langs.push(l); }
  if (FACT_FIX[p[0]] && FACT_FIX[p[0]]["es-419"]) f6["es-419"] = FACT_FIX[p[0]]["es-419"];   // solo a mano: si no, el juego usa el de es
  return { n: destName(p), lat: p[3], lon: p[4], f: FACT_OVERRIDES[p[0]] || firstSentence(FACTS_EN[p[0]]), f6 };
}

/* Pista = la descripcion corta con la que arranca cada resumen (p. ej. "Ciudad más poblada de Marruecos."),
 * en los 6 idiomas. Se descarta el lugar si en algun idioma falta, si delata el nombre, si es vaga
 * (solo el pais: "Ciudad de Francia") o si otro lugar tiene la misma pista. */
const NAME_STOP = new Set(["city", "ciudad", "ville", "cidade", "stadt", "citta", "national", "nacional", "parque", "park", "island", "isla", "lake", "lago", "mount", "monte", "river", "saint", "santa", "santo", "great", "grand", "grande", "palace", "palacio", "temple", "templo", "tower", "torre", "castle", "castillo", "church", "iglesia", "cathedral", "catedral", "bridge", "puente", "north", "south", "old", "new", "nueva", "nuevo", "battle", "batalla", "desert", "desierto", "falls", "cataratas"]);
function descOf(s) {
  s = String(s || "").trim();
  const m = s.replace(ABBR, x => x.slice(0, -1) + "\u0001").match(/^.*?[.!?](?=\s|$)/);
  const d = m ? m[0].replace(/\u0001/g, ".") : (s.length < 120 ? s : "");
  return d.length >= 12 && d.length <= 140 ? d : null;
}
const DEMONYM_EN = /^[A-Z][a-z]+(?:ian|ean|an|ese|ish|ch|ic|i|ss|k)$/;
const DE_GENERIC = new Set(["Stadt", "Großstadt", "Hauptstadt", "Hafenstadt", "Kreisstadt", "Kleinstadt", "Millionenstadt", "Metropole", "Gemeinde", "Kommune", "Ortschaft", "Ort", "Staat", "Land", "Region", "Provinz", "Bezirk", "Departement", "Präfektur", "Insel", "Inseln", "Inselgruppe", "Berg", "Gebirge", "See", "Fluss", "Wasserfall", "Nationalpark", "Park", "Denkmal", "Bauwerk", "Turm", "Kirche", "Kathedrale", "Moschee", "Tempel", "Palast", "Schloss", "Burg", "Festung", "Brücke", "Platz", "Museum", "Ruine", "Ruinenstätte", "Stätte", "Welterbe", "Sitz", "Verwaltungssitz", "Großregion", "Kanton", "Bundesstaat", "Bundesland", "Verwaltungseinheit", "Ruinen", "Siedlung", "Wüste", "Küste", "Vulkan", "Halbinsel", "Wolkenkratzer", "Seeschlacht", "Schlacht", "Nord", "Süd", "Ost", "West"]);
function specific(l, d, p) {
  const c = p[5] && PCOUNTRY[p[5]], cTok = c ? norm(c[l] || c.en).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(t => t.length >= 4) : [];
  return d.replace(/[.,;:()«»"“”]/g, " ").split(/\s+/).filter(Boolean).slice(1).some(w => {
    if (!/^[A-ZÀ-ÖØ-Þ]/.test(w)) return false;
    const nw = norm(w).replace(/[^a-z0-9]/g, "");
    if (nw.length < 4 || cTok.some(t => nw.slice(0, 4) === t.slice(0, 4))) return false;
    if (l === "en" && DEMONYM_EN.test(w)) return false;
    if (l === "de" && DE_GENERIC.has(w)) return false;
    return true;
  });
}
const SPEC_LANGS = new Set(["en", "es"]);                               // la pista debe localizar algo en estos; en el resto basta con que exista y no delate el nombre
function clueRaw(p) {
  const out = {};
  for (const l of LANGS6) {
    const d = descOf(SHORT[l][p[0]]); if (!d || (SPEC_LANGS.has(l) && !specific(l, d, p))) return null;
    const txt = " " + norm(d).replace(/[^a-z0-9]+/g, " ") + " ";
    for (const nm of new Set([p[6][l], p[6].en])) {
      const toks = norm(nm).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(t => t.length >= 4 && !NAME_STOP.has(t));
      if (toks.some(t => txt.includes(" " + t + " "))) return null;
    }
    out[l] = d;
  }
  return out;
}
const CLUE_DUP = new Set();
{ const cnt = {}; for (const q of PLACES) { const c = clueRaw(q); if (c) for (const l of LANGS6) { const k = l + "|" + norm(c[l]); cnt[k] = (cnt[k] || 0) + 1; } } for (const k in cnt) if (cnt[k] > 1) CLUE_DUP.add(k); }
function clueOf(p) { const c = clueRaw(p); return c && LANGS6.every(l => !CLUE_DUP.has(l + "|" + norm(c[l]))) ? c : null; }
/* zh/ko/ja/ru/pl: si ya existen sus resumenes cortos (los genera la sesion de idiomas), la pista sale tambien
 * en esos idiomas mientras no nombre el lugar; si no, el juego cae al ingles */
const CLUE_MORE = ["zh", "ko", "ja", "ru", "pl"].filter(l => fs.existsSync(path.join(ROOT, "data", "wiki", `${l}-s.json`)));
for (const l of CLUE_MORE) SHORT[l] = JSON.parse(read(`data/wiki/${l}-s.json`));
function mkClueDest(p) {
  const c = clueOf(p), c6 = { es: c.es, fr: c.fr, pt: c.pt, de: c.de, it: c.it };
  for (const l of CLUE_MORE) {
    const d = descOf(SHORT[l][p[0]]), nm = p[6][l];
    if (d && !(nm && d.toLowerCase().includes(String(nm).toLowerCase()))) c6[l] = d;
  }
  return { n: c.en, c6, lat: p[3], lon: p[4], f: destName(p) };
}

/* ---------------------------------------------------------------- Eventos y Personajes (tools/extra-data.json) */
const XL = ["en", "es", "fr", "pt", "de", "it", "zh", "ko", "ja", "ru", "pl"];      // idiomas de contenido de Eventos/Personajes
/* clave de la Enciclopedia: la del articulo ("queen-victoria"); si esa tarjeta no existe pero si la de la etiqueta
 * (clave antigua, p. ej. "2004-indian-ocean-earthquake"), se conserva la antigua para no perder tarjetas ya
 * desbloqueadas (codex.v1 guarda por clave), salvo que choque con un lugar ("victoria" = Victoria de Seychelles) */
const CODEX_EN = fs.existsSync(path.join(ROOT, "data", "wiki", "en.json")) ? JSON.parse(read("data/wiki/en.json")) : {};
const PLACE_IDS = new Set(PLACES.filter(p => p[1] !== "history").map(p => p[0]));   // los "history" del banco son los mismos sucesos: su tarjeta vale
function codexKey(wiki, label) {
  const k = ckey(wiki || label), old = ckey(label);
  return CODEX_EN[k] || !CODEX_EN[old] || PLACE_IDS.has(old) ? k : old;
}
const BC = { en: "{y} BC", es: "{y} a. C.", fr: "{y} av. J.-C.", pt: "{y} a.C.", de: "{y} v. Chr.", it: "{y} a.C.", zh: "公元前{y}年", ko: "기원전 {y}년", ja: "紀元前{y}年", ru: "{y} до н. э.", pl: "{y} p.n.e." };
const yr = (y, l) => (y == null ? "" : y < 0 ? BC[l].replace("{y}", -y) : String(y));
const ucf = s => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);
const by10 = fn => { const o = {}; for (const l of XL) o[l] = fn(l); return o; };
const restL = o => Object.fromEntries(XL.slice(1).map(l => [l, o[l]]));
const SEP = { zh: "，", ja: "、" };
const joinTxt = l => (...xs) => xs.filter(Boolean).join(SEP[l] || ", ");
/* descripcion corta: fuera el parentesis final con años, tambien el de ancho completo ("（Thomas Edison，1847—1931）") */
const short = s => { s = ucf(String(s || "").replace(/\s*[(（][^)）]*\d{3,4}[^)）]*[)）]\s*$/, "")); if (s.length <= 90) return s; const c = s.slice(0, 90), i = Math.max(c.lastIndexOf(","), c.lastIndexOf("，"), c.lastIndexOf("、")); return (i > 40 ? c.slice(0, i) : c.slice(0, c.lastIndexOf(" ") > 40 ? c.lastIndexOf(" ") : 90)) + "…"; };
function mkPersonDest(p) {
  const ctry = countryAt(p.lat, p.lon) || p.country;
  const fact = by10(l => [joinTxt(l)(p.place && p.place[l], ctry && (ctry[l] || ctry.en)), short(p.desc[l])].filter(Boolean).join(" · "));
  const name = by10(l => p.name[l]);
  return { n: name.en, n6: restL(name), ck: codexKey(p.wiki, name.en), s6: by10(l => (p.born == null ? "" : `${yr(p.born, l)}–${yr(p.died, l)}`)), lat: p.lat, lon: p.lon, f: fact.en, f6: restL(fact), img: p.img };
}
function mkEventDest(e) {
  const ctry = countryAt(e.lat, e.lon);                                  // nunca el P17 de Wikidata: suele ser el estado de la epoca
  const name = by10(l => ucf(e.name[l]));
  const fact = by10(l => joinTxt(l)(e.place && e.place[l], ctry && (ctry[l] || ctry.en)) || short(e.desc[l]));
  return { n: name.en, n6: restL(name), ck: codexKey(e.wiki, name.en), s6: by10(l => yr(e.year, l)), lat: e.lat, lon: e.lon, f: fact.en, f6: restL(fact) };
}

/* ---------------------------------------------------------------- niveles */
const DIFFS = ["Easy", "Easy", "Medium", "Medium", "Hard", "Hard", "Very hard", "Very hard", "Hardest", "Hardest"];
const NLEV = 10, MIN_Q = 5;
function level(k, { kind, region, picks, mk, tpq, bonus, label }) {
  const kmBase = Math.max(1500, 6000 - k * 400), speed = Math.max(300, 600 - k * 25);
  return {
    id: k + 1, diff: DIFFS[k], name: `${label} (${DIFFS[k]})`, kind, region, bonus: !!bonus,
    tpq, kmBase, kmDist: 2, speed, cutoff: 0.5,
    advance: Math.round((picks.length * kmBase * 0.55) / 100) * 100,
    dests: picks.map(mk),
  };
}
/* una lista ya ordenada de facil a dificil -> 10 niveles de <= cap preguntas (lo que sobre queda libre) */
function tenLevels(pool, opt) {
  const cap = opt.cap || 15, per = Math.max(MIN_Q, Math.min(cap, Math.floor(pool.length / NLEV)));
  if (pool.length < NLEV * MIN_Q) console.warn(`Aviso [${opt.label}]: solo ${pool.length} elementos para 10 niveles.`);
  const levels = [];
  for (let k = 0; k < NLEV; k++) {
    const picks = pool.slice(Math.round((k * Math.min(pool.length, per * NLEV)) / NLEV), Math.round(((k + 1) * Math.min(pool.length, per * NLEV)) / NLEV));
    levels.push(level(k, { ...opt, picks }));
  }
  return { levels, used: pool.slice(0, per * NLEV) };
}

/* ---------------------------------------------------------------- reparto sin solapes */
const used = new Set(), usedNames = new Set();
const free = p => !used.has(p[0]) && !usedNames.has(norm(p[6].en)) && FACTS_EN[p[0]] && p[3] != null && p[4] != null;
const claim = list => list.forEach(p => { used.add(p[0]); usedNames.add(norm(p[6].en)); });
const LABEL = { capital: "Capital Cities", landmark: "Famous Landmarks", city: "Cities", nature: "Natural Wonders" };
/* el tipo "history" del banco son batallas y sucesos (asi los clasifica la Enciclopedia, js/codex.js): van a Eventos */
const MIXED = ["city", "landmark", "nature"];

/* Mundo y regiones: los 4 tipos se reparten los 10 niveles segun cuanto haya de cada uno; cada tipo se
 * trocea por fama y los niveles se ordenan por su dificultad media, asi se alternan y van a mas. */
function mixedCampaign(region, prefix, { cap = 12, filter = () => true } = {}) {
  const pools = {};
  for (const k of MIXED) pools[k] = PLACES.filter(p => kindOf(p) === k && free(p) && filter(p) && (region === "world" || regionOf(p) === region)).sort((a, b) => diffOf(a) - diffOf(b));
  const total = MIXED.reduce((a, k) => a + pools[k].length, 0);
  let alloc = {}; MIXED.forEach(k => { alloc[k] = pools[k].length >= MIN_Q ? Math.max(1, Math.round((pools[k].length / total) * NLEV)) : 0; });
  let sum = () => MIXED.reduce((a, k) => a + alloc[k], 0);
  while (sum() > NLEV) { const k = MIXED.filter(x => alloc[x] > 1).sort((a, b) => pools[a].length / alloc[a] - pools[b].length / alloc[b])[0]; alloc[k]--; }
  while (sum() < NLEV) { const k = MIXED.filter(x => pools[x].length >= (alloc[x] + 1) * MIN_Q).sort((a, b) => pools[b].length / (alloc[b] + 1) - pools[a].length / (alloc[a] + 1))[0]; if (!k) break; alloc[k]++; }
  const chunks = [];
  for (const k of MIXED) {
    const n = alloc[k]; if (!n) continue;
    const per = Math.min(cap, Math.floor(pools[k].length / n)), list = pools[k].slice(0, per * n);
    for (let i = 0; i < n; i++) chunks.push({ kind: k, picks: list.slice(i * per, (i + 1) * per), d: (i + 0.5) / n, o: MIXED.indexOf(k) });
  }
  if (chunks.length < NLEV) console.warn(`Aviso [${prefix}]: solo ${chunks.length} niveles.`);
  chunks.sort((a, b) => a.d - b.d || a.o - b.o);                           // posicion relativa dentro de su tipo: la fama no se compara entre tipos
  chunks.forEach(c => claim(c.picks));
  return chunks.map((c, k) => level(k, { kind: c.kind, region, picks: c.picks, mk: mkDest, tpq: 10, label: `${prefix} ${LABEL[c.kind]}` }));
}

/* 1. Banderas: los 196 paises (unico sitio donde salen los paises) */
const countries = PLACES.filter(p => p[1] === "country" && free(p)).sort((a, b) => diffOf(a) - diffOf(b));
const LV_flags = tenLevels(countries, { kind: "flag", region: "world", mk: mkDest, tpq: 10, label: "Flags", cap: 20 }).levels;
claim(countries);

/* 2. Capitales del mundo: todas las capitales (unico sitio donde salen) */
const capitals = PLACES.filter(p => p[1] === "capital" && free(p)).sort((a, b) => diffOf(a) - diffOf(b));
const capRes = tenLevels(capitals, { kind: "capital", region: "world", mk: mkDest, tpq: 10, label: "World Capital Cities", cap: 20 });
claim(capRes.used); claim(capitals);                                      // las que no caben tampoco van a otras campanas

/* 3. Mundo: lo mas conocido de cada tipo */
const LV_game1 = mixedCampaign("world", "World", { cap: 10 });

/* 4. Pistas: se reserva antes que las regiones (hay pocas pistas buenas: si no, se las llevan ellas).
 * Se reparte entre regiones para que ninguna se quede sin sus lugares con buena pista. */
const clueable = PLACES.filter(p => MIXED.includes(kindOf(p)) && free(p) && clueOf(p)).sort((a, b) => diffOf(a) - diffOf(b));
const CLUE_N = 100, byRegion = {};
clueable.forEach(p => (byRegion[regionOf(p) || "-"] ||= []).push(p));
const clueList = []; const cap = Object.fromEntries(Object.entries(byRegion).map(([r, a]) => [r, Math.ceil(a.length * 0.6)]));   // cada region cede como mucho el 60 % de las suyas
for (let i = 0; clueList.length < CLUE_N && Object.values(byRegion).some(a => i < a.length); i++)
  for (const [r, a] of Object.entries(byRegion)) if (i < a.length && i < cap[r] && clueList.length < CLUE_N) clueList.push(a[i]);
clueList.sort((a, b) => diffOf(a) - diffOf(b));
const cluesRes = tenLevels(clueList, { kind: "clue", region: "world", mk: mkClueDest, tpq: 12, bonus: true, label: "Clues", cap: 10 });
claim(cluesRes.used);

/* 5. Regiones con lo que queda */
const LV_usa = mixedCampaign("usa", "USA");
const LV_europe = mixedCampaign("europe", "Europe");
const LV_asia = mixedCampaign("asia", "Asia");
const LV_latam = mixedCampaign("latam", "Latin America");
const LV_oceania = mixedCampaign("oceania", "Oceania");

/* 6. Eventos (sin los que ya salen como lugar) y Personajes, por fama */
const byFame = list => list.slice().sort((a, b) => b.fame - a.fame);
const events = byFame(EXTRA.events).filter(e => !usedNames.has(norm(e.name.en)));
const LV_events = tenLevels(events, { kind: "event", region: "world", mk: mkEventDest, tpq: 12, label: "Historic Events", cap: 20 }).levels;
const LV_people = tenLevels(byFame(EXTRA.people), { kind: "character", region: "world", mk: mkPersonDest, tpq: 12, label: "Historical Figures", cap: 25 }).levels;

const GAMES = {
  game1: { title: "World", levels: LV_game1 },
  worldcapitals: { title: "World Capitals", levels: capRes.levels },
  usa: { title: "USA", levels: LV_usa },
  europe: { title: "Europe", levels: LV_europe },
  asia: { title: "Asia", levels: LV_asia },
  centralsouthamerica: { title: "Latin America", levels: LV_latam },
  oceania: { title: "Oceania", levels: LV_oceania },
  flags: { title: "Flags", levels: LV_flags },
  clues: { title: "Clues", levels: cluesRes.levels },
  events: { title: "Historic Events", levels: LV_events },
  people: { title: "Historical Figures", levels: LV_people },
};

const arr = Object.entries(GAMES).map(([id, g]) => ({ id, title: g.title, home: { lat: 0.0, lon: 0.0, zoom: 1.0 }, levels: g.levels }));
const header = `/* Modo Clasico: contenido propio, generado por tools/build-classic.mjs desde data/places.js + data/wiki (Wikipedia/Wikidata). No copia lugares, puntuacion ni datos del Traveler IQ Challenge original. */\n`;
fs.writeFileSync(path.join(ROOT, "data", "classic.js"), header + "window.AIQ = window.AIQ || {};\nwindow.AIQ.CLASSIC = " + JSON.stringify(arr) + ";\n");
fs.writeFileSync(path.join(ROOT, "tools", "classic-facts-missing.json"), JSON.stringify(FACT_MISSING, null, 1));
console.log(`Datos curiosos sin traduccion propia: ${Object.keys(FACT_MISSING).length} lugares (tools/classic-facts-missing.json)`);

for (const [id, g] of Object.entries(GAMES)) console.log(id.padEnd(20), String(g.levels.length).padStart(2), "niveles,", String(g.levels.reduce((a, l) => a + l.dests.length, 0)).padStart(4), "preguntas:", g.levels.map(l => l.dests.length).join(" "));
