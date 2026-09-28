/*
 * Geolite - texto propio para cada entrada de nivel de la Enciclopedia (Historia "~h" y Dato clave "~k").
 * Hasta ahora js/codex.js las recortaba al vuelo del mismo articulo que la ficha: con articulos cortos salian
 * vacias y repetian el texto de la ficha. Aqui se fijan de antemano, idioma por idioma:
 *   1. el recorte de siempre, si da texto suficiente y no repite la introduccion;
 *   2. si no, otra seccion del articulo completo de ESA Wikipedia (historia para ~h; geografia, arquitectura,
 *      cultura... para ~k);
 *   3. si esa Wikipedia no da para mas, la traduccion a mano del texto ingles de ese nivel
 *      (tools/wiki-tr/tiers-<l>.json {id: {h, k}}), acreditada como traducida.
 *
 *   node tools/codex-tiers.mjs --fetch     descarga los articulos completos que hagan falta (tools/cache-tiers/, necesita red)
 *   node tools/codex-tiers.mjs             informe + tools/wiki-tr/tiers-todo.json (lo que falta por traducir, con el texto ingles)
 *   node tools/codex-tiers.mjs --merge     ademas escribe en data/wiki/<l>.json: r[3] = Historia, r[5] = Dato clave,
 *                                          r[6] = {h, k} idioma de origen de las traducidas (js/codex.js las usa tal cual)
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "data", "wiki"), CACHE = path.join(ROOT, "tools", "cache-tiers"), TR = path.join(ROOT, "tools", "wiki-tr");
const LANGS = ["en", "es", "fr", "pt", "de", "it", "zh", "ko", "ja", "ru", "pl"];
const FETCH = process.argv.includes("--fetch"), MERGE = process.argv.includes("--merge");
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite)" };
const readJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);

/* las mismas funciones de limpieza y de frases que el juego (js/wiki.js) */
const ctx = { window: { AIQ: {} }, fetch: () => Promise.resolve({ ok: false, json: () => ({}) }), location: { href: "" } }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "wiki.js"), "utf8"), ctx);
const { cleanText, sentences } = ctx.window.AIQ;
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), ctx);
const IDS = ctx.window.AIQ.PLACES.map(p => p[0]);                       // cada lugar del banco tiene ~h y ~k (js/codex.js, paso 6)

const CJK = l => l === "zh" || l === "ja", joiner = l => (CJK(l) ? "" : " ");
const MIN = l => (CJK(l) ? 35 : l === "ko" ? 45 : 80);                  // texto minimo para que un nivel "cuente"
const MAXC = l => (CJK(l) ? 260 : l === "ko" ? 330 : 620);                // y maximo: la tarjeta es una lectura corta

/* el recorte actual de js/codex.js (tiers), para no cambiar lo que ya esta bien */
function currentTiers(rec, l) {
  const sents = sentences(cleanText(rec[2])), hist = cleanText(rec[3]).split(/\n+/).filter(x => x.trim()), J = joiner(l);
  let n = 0, len = 0; while (n < sents.length && (n < 2 || len < 200) && n < 3) len += sents[n++].length;
  const intro = sents.slice(0, n).join(J), rest = sents.slice(n);
  let histP = hist, key = rest.join(J);
  if (key.length < 90 && hist.length > 1) { const h = Math.ceil(hist.length / 2); histP = hist.slice(0, h); key = (key ? key + "\n" : "") + hist.slice(h).join("\n"); }
  if (!histP.length && rest.length > 2) { const h = Math.ceil(rest.length / 2); histP = [rest.slice(0, h).join(J)]; key = rest.slice(h).join(J); }
  return { intro: intro || cleanText(rec[2]), h: histP.join("\n"), k: key };
}
const norm = s => String(s || "").toLowerCase().replace(/[\s\p{P}]+/gu, "");
/* un nivel vale si tiene texto suficiente y no repite frases de la introduccion ni del otro nivel */
function good(t, l, ...others) {
  if (!t || t.length < MIN(l)) return false;
  const ss = sentences(t).map(norm).filter(x => x.length > 12), other = new Set(others.flatMap(o => sentences(o || "").map(norm)));
  return ss.length > 0 && ss.filter(x => other.has(x)).length / ss.length < 0.34;
}
/* primeras frases completas hasta el maximo */
function clip(t, l) {
  const ss = sentences(cleanText(t)), J = joiner(l); let out = "";
  for (const s of ss) { if (out && (out + J + s).length > MAXC(l)) break; out = out ? out + J + s : s; }
  return out;
}

/* ---- articulo completo por secciones ---- */
const HIST = /^(history|historia|histoire|história|geschichte|storia|история|역사|歴史|历史|歷史|沿革|dzieje|historique|background|antecedentes|contexte|hintergrund|contesto|предыстория|背景)/i;
const SKIP = /(etymolog|etimolog|étymolog|toponym|name|nombre|nom\b|nome|namen|nazwa|название|名称|名稱|이름|referenc|referências|références|referenze|einzelnachweise|bibliograf|literatur|see also|véase|voir aussi|ver também|siehe auch|vedi anche|zobacz|см\. также|参见|関連項目|같이 보기|external|enlaces|liens|ligações|weblinks|collegamenti|linki|ссылки|外部|외부|notes|notas|anmerkungen|note|przypisy|примечания|脚注|注释|각주|gallery|galer|galerie|галерея|画廊|ギャラリー|further|sources|fuentes|quellen|fonti|źródła|источники|出典|來源|来源)/i;
const KEYPREF = /(geograph|geograf|géograph|география|地理|지리|architect|arquitect|architett|architekt|архитект|建筑|建築|건축|descri|beschreib|opis|описание|概要|개요|climat|clima|klima|климат|気候|气候|기후|cultur|kultur|культур|文化|문화|econom|wirtschaft|gospodark|экономик|经济|経済|경제|touris|turism|turyst|туризм|观光|観光|관광|legacy|legado|héritage|patrimon|erbe|eredità|dziedzictw|наследи|遗产|遺産|유산|feature|caracter|merkmal|caratteri|cech|особенност|特征|特徴|특징|aftermath|consecuencias|conséquences|folgen|conseguenze|skutki|последстви|影响|影響|영향|design|diseño|conception|projekt|progett|конструкц|设计|設計|설계|flora|fauna|geolog|геолог|地质|地質|지질|biograf|leben|vie|vita|życie|жизнь|生平|生涯|생애|work|obra|œuvre|werk|opere|twórczość|творчеств|作品|작품|landmark|monument|sehenswürd|monumenti|zabytki|достопримечательн|景点|名所|명소)/i;
function sectionsOf(text) {
  const parts = String(text || "").replace(/\r/g, "").split(/\n(?=={2,}\s*[^=\n]+?\s*={2,}\s*\n)/), lead = parts.shift() || "";
  const secs = parts.map(p => { const m = p.match(/^(={2,})\s*([^=\n]+?)\s*={2,}\s*\n([\s\S]*)$/); return m ? { lvl: m[1].length, h: m[2].trim(), t: m[3].replace(/\n={2,}[^=\n]+={2,}\n/g, "\n").trim() } : null; }).filter(Boolean);
  return { lead, secs };
}

async function jget(url) {
  for (let i = 0; i < 6; i++) {
    try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) }); if (r.ok) return await r.json(); if (r.status === 404) return null; } catch (e) { /* red: se reintenta */ }
    await new Promise(s => setTimeout(s, 3000 * (i + 1)));
  }
  return null;
}
async function fullArticle(l, title) {
  const f = path.join(CACHE, l, encodeURIComponent(title).replace(/%/g, "_").slice(0, 180) + ".json");
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8")).x;
  if (!FETCH) return null;
  const j = await jget(`https://${l}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&format=json&formatversion=2${l === "zh" ? "&variant=zh-cn" : ""}&titles=${encodeURIComponent(title)}`);
  const pg = j && j.query && j.query.pages && j.query.pages[0], x = pg && !pg.missing ? pg.extract || "" : "";
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify({ t: title, x }));
  await new Promise(s => setTimeout(s, 250));
  return x;
}

/* ---- ensamblado ---- */
/* siempre se parte de los datos SIN volcar (r[3] original): si la ficha ya tiene r[5], el r[3] es la Historia elegida y
 * recalcular sobre ella cambia el resultado. El original se guarda en tools/wiki-tr/tiers-base/<l>.json la primera vez. */
const BASE = path.join(TR, "tiers-base");
const W = Object.fromEntries(LANGS.map(l => {
  const cur = readJSON(path.join(WIKI, l + ".json"), {}), fb = path.join(BASE, l + ".json");
  if (!fs.existsSync(fb)) {
    if (Object.values(cur).some(r => r[5])) throw new Error(`data/wiki/${l}.json ya esta volcado y falta ${fb}: restauralo del commit anterior al volcado`);
    fs.mkdirSync(BASE, { recursive: true }); fs.writeFileSync(fb, JSON.stringify(cur));
  }
  const base = readJSON(fb, {});
  for (const [id, r] of Object.entries(cur)) if (!base[id]) base[id] = r;   // fichas nuevas (add-codex / add-places) desde el ultimo volcado
  return [l, base];
}));
/* traducciones a mano: tools/wiki-tr/tiers-<l>.json {id: {h, k}} y los lotes tools/wiki-tr/tiers-batch-*.json {l: {id: {h, k}}} */
const TRAN = Object.fromEntries(LANGS.map(l => [l, readJSON(path.join(TR, `tiers-${l}.json`), {})]));
for (const f of fs.existsSync(TR) ? fs.readdirSync(TR).filter(f => /^tiers-batch-.*.json$/.test(f)).sort() : []) {
  const B = readJSON(path.join(TR, f), {});
  for (const [l, o] of Object.entries(B)) for (const [id, t] of Object.entries(o)) TRAN[l][id] = { ...(TRAN[l][id] || {}), ...t };
}
/* fichas con texto propio escrito a mano (tools/wiki-tr/codex-own.json {l: {id: {t?, d?, x?, h?, k?, tr?}}}): cuando dos tarjetas
 * comparten articulo (la Wikipedia local redirige Sovereign Hill a Ballarat; "Apertura del canal de Suez" y "Canal de Suez"; Singapur
 * ciudad y pais) una de ellas repetiria el texto de la otra. t/d/x = titulo, descripcion, texto de la ficha; h/k = sus niveles;
 * tr = traducido del articulo ingles de esa tarjeta (se acredita y enlaza el original, r[4] = "en"). Se aplica antes que todo lo demas. */
const OWN = {};
for (const f of fs.existsSync(TR) ? fs.readdirSync(TR).filter(f => /^codex-own.*\.json$/.test(f)).sort() : [])
  for (const [l, o] of Object.entries(readJSON(path.join(TR, f), {}))) Object.assign((OWN[l] ||= {}), o);
for (const [l, o] of Object.entries(OWN)) for (const [id, v] of Object.entries(o)) {
  const r = (W[l][id] ||= [W.en[id] ? W.en[id][0] : id, "", "", "", null]);
  if (v.t) r[0] = v.t; if (v.d != null) r[1] = v.d; if (v.x) r[2] = v.x; if (v.h) r[3] = v.h;
  if (v.tr) r[4] = "en";
}
/* fuente inglesa de lo que se traduce: 2-3 frases completas (la tarjeta de nivel es una lectura corta) */
const clipEn = t => { const ss = sentences(cleanText(t)); let o = ""; for (const x of ss) { if (o && (o + " " + x).length > 420) break; o = o ? o + " " + x : x; } return o; };
const report = {}, todo = {}, out = Object.fromEntries(LANGS.map(l => [l, {}]));
const enTiers = {};

for (const l of ["en", ...LANGS.filter(x => x !== "en")]) {
  const R = { total: 0, keep: 0, section: 0, translated: 0, missing: 0 };
  for (const id of IDS) {
    const rec = W[l][id]; if (!rec) continue;
    const cur = currentTiers(rec, l), native = !rec[4];                  // rec[4]: la ficha entera ya es traduccion del ingles
    const res = { h: null, k: null, src: {} }, own = OWN[l] && OWN[l][id];
    for (const tier of ["h", "k"]) {
      R.total++;
      if (own && own[tier]) { R.translated++; res[tier] = own[tier]; if (own.tr || l !== "en") res.src[tier] = "en"; continue; }
      const other = tier === "h" ? res.k || cur.k : res.h || cur.h;
      let t = cur[tier] && good(cur[tier], l, cur.intro, tier === "k" ? cur.h : "") ? cur[tier] : null;
      if (t) { R.keep++; res[tier] = t; continue; }
      if (native && rec[0]) {                                              // otra seccion del articulo completo de esta Wikipedia
        const x = await fullArticle(l, rec[0]);
        if (x) {
          const { lead, secs } = sectionsOf(x), used = [cur.intro, res.h || "", res.k || ""];
          const cands = tier === "h"
            ? secs.filter(s => HIST.test(s.h))
            : [...secs.filter(s => !HIST.test(s.h) && !SKIP.test(s.h) && KEYPREF.test(s.h)), ...secs.filter(s => !HIST.test(s.h) && !SKIP.test(s.h) && !KEYPREF.test(s.h)),
              { t: sentences(cleanText(lead)).slice(3).join(joiner(l)) }];
          for (const s of cands) { const c = clip(s.t, l); if (good(c, l, ...used, other)) { t = c; break; } }
        }
      }
      if (t) { R.section++; res[tier] = t; continue; }
      const tr = TRAN[l][id] && TRAN[l][id][tier];                         // traduccion a mano del texto ingles de este nivel
      if (tr) { R.translated++; res[tier] = tr; res.src[tier] = "en"; continue; }
      R.missing++;
      if (l !== "en") ((todo[l] ||= {})[id] ||= {})[tier] = clipEn(enTiers[id] && enTiers[id][tier] || "");
    }
    if (l === "en") enTiers[id] = { h: res.h, k: res.k };
    out[l][id] = res;
  }
  report[l] = R;
  console.log(l.padEnd(3), `niveles ${R.total}: se quedan ${R.keep}, seccion propia ${R.section}, traducidos ${R.translated}, faltan ${R.missing}`);
}

fs.mkdirSync(TR, { recursive: true });
fs.writeFileSync(path.join(TR, "tiers-todo.json"), JSON.stringify(todo, null, 1));
console.log("Por traducir:", Object.entries(todo).map(([l, o]) => `${l} ${Object.values(o).reduce((a, x) => a + Object.keys(x).length, 0)}`).join(", "), "-> tools/wiki-tr/tiers-todo.json");

/* formato acordado con js/wiki.js y js/codex.js: con r[5] (Dato clave) relleno, r[3] se muestra entero como Historia
 * y r[6] = {h?: "en", k?: "en"} acredita los niveles traducidos. Solo se escribe cuando los dos niveles tienen texto. */
if (MERGE) {
  let n = 0;
  for (const l of LANGS) {
    const f = path.join(WIKI, l + ".json"), J = readJSON(f, {});
    for (const id of Object.keys(OWN[l] || {})) J[id] = W[l][id].slice();      // fichas con texto propio (tambien las que no tienen niveles)
    for (const [id, r] of Object.entries(out[l])) {
      if (!J[id] || !r.h || !r.k) continue;
      while (J[id].length < 5) J[id].push(null);
      J[id][3] = r.h; J[id][5] = r.k; J[id][6] = Object.keys(r.src).length ? r.src : null; n++;
    }
    fs.writeFileSync(f, JSON.stringify(J));
  }
  console.log(`Mezclado en data/wiki/<l>.json: ${n} fichas con Historia (r[3]) y Dato clave (r[5]) propios`);
}

/* lista de trabajo por ficha: cada texto ingles una vez, con los idiomas que lo necesitan (tools/wiki-tr/tiers-work.json) */
{
  const work = {};
  for (const [l, o] of Object.entries(todo)) for (const [id, t] of Object.entries(o)) for (const [tier, en] of Object.entries(t)) {
    const w = ((work[id] ||= {})[tier] ||= { en, langs: [] }); w.langs.push(l);
  }
  fs.writeFileSync(path.join(TR, "tiers-work.json"), JSON.stringify(work, null, 1));
}
