/*
 * Geolite - regenera el modo Clasico con contenido propio (sustituye la base
 * copiada del Traveler IQ Challenge original por lugares y datos ya presentes
 * en el banco propio del juego: data/places.js + data/wiki/en-s.json, ambos
 * generados por tools/build-places.mjs a partir de Wikipedia/Wikidata).
 *
 * Regenera las 7 campanas del modo Clasico (game1, worldcapitals, usa, asia,
 * centralsouthamerica, oceania) con lugares/datos propios. classic-tr.js deja
 * de hacer falta para nombres de sitio (se traducen solos via data/places.js)
 * pero se mantiene por si el nombre de algun nivel necesita traduccion manual.
 *
 *   node tools/build-classic.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(read("data/places.js"), ctx);
const PLACES = ctx.window.AIQ.PLACES;      // [id, kind, tier, lat, lon, countryQID, names{en..it}, fame0-99]
const PCOUNTRY = ctx.window.AIQ.PCOUNTRY;  // {QID: {en, es, ...}}
const FACTS_EN = JSON.parse(read("data/wiki/en-s.json"));

const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const byKindTier = {};
for (const p of PLACES) (byKindTier[p[1] + "/" + p[2]] ||= []).push(p);
for (const k in byKindTier) byKindTier[k].sort((a, b) => a[7] - b[7]); // fame 0 = mas famoso primero

/* Retoques a mano sobre el texto auto-extraido de Wikipedia: casos donde la
 * primera frase salia circular/floja y hay un dato mejor mas adelante en el
 * mismo resumen. */
const FACT_OVERRIDES = {
  "battle-of-trafalgar": "Nelson's fleet was outnumbered, with only 27 ships of the line against the 33 of Villeneuve's combined French-Spanish fleet.",
  "puebla": "Founded by the Spanish in 1531 to secure the trade route between Mexico City and the port of Veracruz.",
};

const US_QID = "Q30";
function regionOf(lat, lon) {
  if (lat < 25 && (lon > 145 || lon < -140)) return "oceania";                 // Pacifico, incluidas naciones ecuatoriales (Kiribati, Marshall, Nauru...)
  if (lon < -30) return (lat > -60 && lat < 33) ? "latam" : "namerica";
  if (lat < 35 && lon < 65) return "africa";                                   // incluye islas del Indico (Mauricio, Seychelles)
  if (lat >= 35) return "europe";
  return "asia";
}

const usedIds = new Set();
const usedNames = new Set();
function take(kind, tier, n, { countryCap = 3, region = null } = {}) {
  let pool = (byKindTier[kind + "/" + tier] || []).filter(p => !usedIds.has(p[0]) && !usedNames.has(norm(p[6].en)) && FACTS_EN[p[0]] && p[3] != null && p[4] != null);
  if (region) pool = pool.filter(p => (region === "usa" ? p[5] === US_QID : regionOf(p[3], p[4]) === region));
  const out = [], perCountry = {}, seen = new Set();
  for (const p of pool) {
    if (out.length >= n) break;
    const nm = norm(p[6].en); if (seen.has(nm)) continue;
    const c = p[5] || "-";
    if ((perCountry[c] || 0) >= countryCap) continue;
    out.push(p); seen.add(nm); perCountry[c] = (perCountry[c] || 0) + 1;
  }
  if (out.length < n) for (const p of pool) { if (out.length >= n) break; const nm = norm(p[6].en); if (seen.has(nm)) continue; out.push(p); seen.add(nm); } // rellena si el cupo por pais dejo huecos
  out.forEach(p => { usedIds.add(p[0]); usedNames.add(norm(p[6].en)); });
  return out;
}
const ABBR = /\b(?:U\.S|U\.K|U\.N|St|Mt|Mr|Mrs|Dr|vs|approx|no)\./g; // estas abreviaturas nunca cierran la frase (evita cortes tipo "St." o "U.S.")
function firstSentence(s) {
  s = String(s || "").trim();
  const guarded = s.replace(ABBR, m => m.slice(0, -1) + "\u0001");
  const m = guarded.match(/^.*?[.!?](?=\s|$)/);
  let cut = (m ? m[0] : guarded).replace(/\u0001/g, ".");
  if (cut.length < 15) cut = s;                                    // frase demasiado corta (extraccion fallida) -> usa el texto completo
  return cut.replace(/\.\.+/g, ".").slice(0, 200);                  // "U.S.." -> "U.S." (doble punto ya presente en el resumen fuente)
}
function destName(p) {
  const en = p[6].en, qid = p[5];
  const country = qid && PCOUNTRY[qid] ? PCOUNTRY[qid].en : null;
  return country && country !== en ? `${en}, ${country}` : en;
}
function mkDest(p) {
  return { n: destName(p), lat: p[3], lon: p[4], f: FACT_OVERRIDES[p[0]] || firstSentence(FACTS_EN[p[0]]) };
}

const LABEL = { capital: "Capital Cities", landmark: "Famous Landmarks", city: "Cities", nature: "Natural Wonders", history: "Historic Sites", country: "Countries" };

/* Construye una campana a partir de una lista de niveles [diff, kind, tier, n, opts?].
 * Umbrales (tpq/kmBase/kmDist/speed/cutoff/advance) son una curva propia, no la del
 * original; los niveles cuyo cupo no se pueda llenar del todo se recortan al tamano real,
 * y los que se queden con menos de 3 lugares se descartan (no dan para un nivel de verdad). */
function buildGame(prefix, spec) {
  const levels = [];
  spec.forEach(([diff, kind, tier, n, opts], i) => {
    const picks = take(kind, tier, n, opts);
    if (picks.length < 3) return;
    if (picks.length < n) console.warn(`Aviso [${prefix}]: ${diff}/${kind}/t${tier} solo tiene ${picks.length}/${n} lugares.`);
    const kmBase = Math.max(1500, 6000 - i * 300);
    const speed = Math.max(300, 600 - i * 15);
    levels.push({
      id: levels.length + 1, diff, name: `${prefix} ${LABEL[kind]} (${diff})`, kind, region: (opts && opts.region) || "world", bonus: false,
      tpq: 10, kmBase, kmDist: 2, speed, cutoff: 0.5,
      advance: Math.round((picks.length * kmBase * 0.55) / 100) * 100,
      dests: picks.map(mkDest),
    });
  });
  return levels;
}

/* Orden de construccion (no de aparicion en el menu): "World" escoge primero
 * (es la campana principal), luego las regionales, y "World Capitals" al
 * final reparte lo que sobra (si no, se quedaba sin capitales propias). */
const LV_game1 = buildGame("World", [
  ["Easy", "city", 0, 6], ["Easy", "capital", 0, 6], ["Easy", "landmark", 0, 6],
  ["Medium", "city", 0, 10], ["Medium", "landmark", 1, 10], ["Medium", "capital", 1, 10], ["Medium", "nature", 0, 10],
  ["Hard", "city", 1, 12], ["Hard", "capital", 1, 12], ["Hard", "landmark", 2, 12],
  ["Very hard", "history", 0, 12], ["Hardest", "city", 2, 15],
]);
const LV_usa = buildGame("USA", [
  ["Easy", "city", 0, 8, { region: "usa" }], ["Easy", "landmark", 0, 8, { region: "usa" }],
  ["Medium", "landmark", 1, 12, { region: "usa" }], ["Medium", "nature", 1, 12, { region: "usa" }],
  ["Hard", "city", 2, 15, { region: "usa" }], ["Hard", "history", 1, 12, { region: "usa" }],
]);
const LV_europe = buildGame("Europe", [
  ["Easy", "city", 0, 8, { region: "europe" }], ["Easy", "capital", 0, 10, { region: "europe" }], ["Easy", "landmark", 0, 8, { region: "europe" }],
  ["Medium", "city", 1, 12, { region: "europe" }], ["Medium", "landmark", 2, 10, { region: "europe" }], ["Medium", "nature", 1, 10, { region: "europe" }],
  ["Hard", "city", 2, 12, { region: "europe" }], ["Hard", "landmark", 2, 12, { region: "europe" }], ["Hard", "history", 1, 12, { region: "europe" }],
  ["Very hard", "history", 0, 10, { region: "europe" }],
]);
const LV_asia = buildGame("Asia", [
  ["Easy", "capital", 0, 10, { region: "asia" }], ["Easy", "city", 0, 10, { region: "asia" }],
  ["Medium", "landmark", 0, 10, { region: "asia" }], ["Medium", "capital", 1, 10, { region: "asia" }],
  ["Medium", "nature", 1, 10, { region: "asia" }], ["Hard", "landmark", 1, 10, { region: "asia" }],
  ["Hard", "history", 1, 10, { region: "asia" }], ["Very hard", "city", 1, 9, { region: "asia" }],
]);
const LV_latam = buildGame("Latin America", [
  ["Easy", "capital", 0, 10, { region: "latam" }], ["Easy", "city", 0, 8, { region: "latam" }],
  ["Medium", "landmark", 0, 5, { region: "latam" }], ["Medium", "capital", 1, 10, { region: "latam" }],
  ["Medium", "landmark", 1, 10, { region: "latam" }], ["Hard", "landmark", 2, 12, { region: "latam" }],
  ["Hard", "nature", 1, 12, { region: "latam" }], ["Very hard", "city", 2, 15, { region: "latam" }],
  ["Very hard", "history", 1, 10, { region: "latam" }],
]);
const LV_oceania = buildGame("Oceania", [
  ["Easy", "capital", 0, 5, { region: "oceania" }], ["Easy", "city", 2, 8, { region: "oceania" }],
  ["Medium", "nature", 1, 8, { region: "oceania" }], ["Medium", "capital", 1, 6, { region: "oceania" }],
  ["Hard", "country", 0, 4, { region: "oceania" }],
]);
const LV_worldcapitals = [
  ...buildGame("Europe", [["Easy", "capital", 0, 12, { region: "europe" }], ["Medium", "capital", 1, 12, { region: "europe" }]]),
  ...buildGame("Asia", [["Easy", "capital", 0, 10, { region: "asia" }], ["Medium", "capital", 1, 10, { region: "asia" }]]),
  ...buildGame("Africa", [["Easy", "capital", 0, 12, { region: "africa" }], ["Medium", "capital", 1, 12, { region: "africa" }]]),
  ...buildGame("Latin America", [["Easy", "capital", 0, 10, { region: "latam" }], ["Medium", "capital", 1, 10, { region: "latam" }]]),
  ...buildGame("Oceania", [["Hard", "capital", 0, 8, { region: "oceania" }]]),
].map((L, i) => ({ ...L, id: i + 1 }));

/* Modo Banderas: las 196 banderas de paises (data/flags.js, casan 1:1 por nombre con
 * las entradas "country" de data/places.js) en 5 tramos por fama. Sin tope por pais
 * (cada entrada YA es un pais, el tope de take() no aplica aqui). */
function buildFlags() {
  const pool = [...(byKindTier["country/0"] || []), ...(byKindTier["country/1"] || [])]
    .filter(p => !usedIds.has(p[0]) && !usedNames.has(norm(p[6].en)) && FACTS_EN[p[0]] && p[3] != null && p[4] != null)
    .sort((a, b) => a[7] - b[7]);
  pool.forEach(p => { usedIds.add(p[0]); usedNames.add(norm(p[6].en)); });
  const BANDS = [["Easy", 30], ["Medium", 40], ["Hard", 40], ["Very hard", 40], ["Hardest", Infinity]];
  const levels = []; let i = 0;
  BANDS.forEach(([diff, n], idx) => {
    const picks = n === Infinity ? pool.slice(i) : pool.slice(i, i + n); i += picks.length;
    if (picks.length < 3) return;
    const kmBase = Math.max(1500, 6000 - idx * 300);
    const speed = Math.max(300, 600 - idx * 15);
    levels.push({
      id: levels.length + 1, diff, name: `Flags (${diff})`, kind: "flag", region: "world", bonus: false,
      tpq: 10, kmBase, kmDist: 2, speed, cutoff: 0.5,
      advance: Math.round((picks.length * kmBase * 0.55) / 100) * 100,
      dests: picks.map(mkDest),
    });
  });
  return levels;
}
const LV_flags = buildFlags();

/* Modo Pistas: ronda "solo dato" (bonus:true, ver campaigns.js) que mezcla ciudades,
 * monumentos, naturaleza e historia de todo el mundo; el nombre se oculta y se revela
 * como respuesta, igual que las rondas bonus del original. */
function buildClues() {
  const BANDS = [
    ["Easy", [["city", 0, 4], ["landmark", 0, 4], ["nature", 0, 3], ["history", 0, 3]]],
    ["Medium", [["city", 1, 5], ["landmark", 2, 5], ["nature", 1, 4], ["history", 1, 4]]],
    ["Hard", [["city", 2, 6], ["landmark", 2, 6], ["nature", 1, 5], ["history", 1, 5]]],
    ["Very hard", [["city", 2, 6], ["landmark", 0, 6], ["history", 0, 6]]],
  ];
  const levels = [];
  BANDS.forEach(([diff, parts], idx) => {
    let picks = [];
    parts.forEach(([kind, tier, n]) => { picks = picks.concat(take(kind, tier, n)); });
    if (picks.length < 3) return;
    const kmBase = Math.max(1500, 6000 - idx * 300);
    const speed = Math.max(300, 600 - idx * 15);
    levels.push({
      id: levels.length + 1, diff, name: `Clues (${diff})`, kind: "clue", region: "world", bonus: true,
      tpq: 10, kmBase, kmDist: 2, speed, cutoff: 0.5,
      advance: Math.round((picks.length * kmBase * 0.55) / 100) * 100,
      dests: picks.map(mkDest),
    });
  });
  return levels;
}
const LV_clues = buildClues();

const GAMES = {
  game1: { title: "World", levels: LV_game1 },
  worldcapitals: { title: "World Capitals", levels: LV_worldcapitals },
  usa: { title: "USA", levels: LV_usa },
  europe: { title: "Europe", levels: LV_europe },
  asia: { title: "Asia", levels: LV_asia },
  centralsouthamerica: { title: "Latin America", levels: LV_latam },
  oceania: { title: "Oceania", levels: LV_oceania },
  flags: { title: "Flags", levels: LV_flags },
  clues: { title: "Clues", levels: LV_clues },
};

const arr = Object.entries(GAMES).map(([id, g]) => ({ id, title: g.title, home: { lat: 0.0, lon: 0.0, zoom: 1.0 }, levels: g.levels }));

const header = `/* Modo Clasico: contenido propio, generado por tools/build-classic.mjs desde data/places.js + data/wiki (Wikipedia/Wikidata). No copia lugares, puntuacion ni datos del Traveler IQ Challenge original. */\n`;
fs.writeFileSync(path.join(ROOT, "data", "classic.js"),
  header + "window.AIQ = window.AIQ || {};\nwindow.AIQ.CLASSIC = " + JSON.stringify(arr) + ";\n");

for (const [id, g] of Object.entries(GAMES)) console.log(id + ":", g.levels.length, "niveles,", g.levels.reduce((a, l) => a + l.dests.length, 0), "lugares.");
