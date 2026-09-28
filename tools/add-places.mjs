/*
 * Geolite - anade al banco los lugares nuevos de tools/places-src.mjs sin regenerar lo que ya hay (solo desarrollo, necesita red).
 *   node tools/add-places.mjs --dry     lista lo que falta en data/places.js
 *   node tools/add-places.mjs --fetch   solo resuelve (cache en tools/cache/, mismo formato que build-places + 11 idiomas)
 *   node tools/add-places.mjs           resuelve lo que falte y lo mezcla en data/places.js, data/wiki/<l>.json, <l>-s.json e img.json
 * build-places.mjs lo regenera todo en 6 idiomas; esto respeta los nombres y textos zh/ko/ja/ru/pl de add-langs y add-codex.
 * Despues: python tools/bundle-media.py (fotos) y node tools/build-classic.mjs (rondas del Clasico).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import * as SRC from "./places-src.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "tools", "cache"); fs.mkdirSync(CACHE, { recursive: true });
const WIKI = path.join(ROOT, "data", "wiki");
const LANGS = ["en", "es", "fr", "pt", "de", "it", "zh", "ko", "ja", "ru", "pl"];
const VARIANT = { zh: "zh-cn" };
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite)" };
const readJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);

/* ---- lista de origen, con las mismas claves, tipos y niveles que build-places ---- */
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "codex.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), ctx);
const ckey = ctx.window.AIQ.ckey, PLACES = ctx.window.AIQ.PLACES, PCOUNTRY = ctx.window.AIQ.PCOUNTRY;
const split = s => s.split(/;\s*/).map(x => x.trim()).filter(Boolean);
const items = [], seen = new Set();
function add(kind, tier, raw, ne) {
  const [title, hint] = raw.split("|").map(x => x.trim());
  const id = ne ? "c:" + ne : ckey(title);
  if (!id || seen.has(id)) return; seen.add(id);
  items.push({ id, kind, tier, title, hint: hint || null, ne: ne || null });
}
const tierOf = (i, n) => (i < n ? 0 : i < 2 * n ? 1 : 2);
split(SRC.CAPITALS).forEach((t, i) => add("capital", i < 100 ? 0 : 1, t));
split(SRC.COUNTRIES).forEach((t, i) => { const [ne, w] = t.split("|"); add("country", i < 100 ? 0 : 1, w || ne, ne); });
split(SRC.CITIES).forEach((t, i) => add("city", tierOf(i, 110), t));
split(SRC.LANDMARKS).forEach((t, i) => add("landmark", tierOf(i, 80), t));
split(SRC.NATURE).forEach((t, i) => add("nature", i < 60 ? 0 : 1, t));
split(SRC.HISTORY).forEach((t, i) => add("history", i < 50 ? 0 : 1, t));
const ORD = Object.fromEntries(items.map((it, i) => [it.id, i]));

const DROP = new Set(readJSON(path.join(ROOT, "tools", "drop-places.json"), []));
const have = new Set(PLACES.map(p => p[0]));
const cfile = id => path.join(CACHE, id.replace(/[:/]/g, "_") + ".json");
/* pendientes: ni en el banco ni descartados; un fallo antiguo de build-places (sin v:2) se reintenta */
const todo = items.filter(it => !have.has(it.id) && !DROP.has(it.id));
console.log("pendientes:", todo.length);
if (process.argv.includes("--dry")) { todo.forEach(it => console.log(" ", it.kind, it.id, "<-", it.title)); process.exit(0); }

/* ---- red ---- */
let active = 0, last = 0, FAILS = 0; const waiters = [];
const GAP = 450;
const lock = async () => { if (active >= 2) await new Promise(r => waiters.push(r)); active++; const now = Date.now(), wait = Math.max(0, last + GAP - now); last = now + wait; if (wait) await new Promise(r => setTimeout(r, wait)); };
const unlock = () => { active--; const w = waiters.shift(); if (w) w(); };
async function jget(url, headers = {}, tries = 6) {
  await lock();
  try {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(40000) });
        if (r.status === 404) return null;
        const txt = await r.text();
        if (r.status === 429 || r.status >= 500 || /too many requests/i.test(txt.slice(0, 300))) { const ra = +r.headers.get("retry-after") || 0; await new Promise(r2 => setTimeout(r2, Math.max(ra * 1000, 8000 * (i + 1)))); continue; }
        if (!r.ok) return null;
        return JSON.parse(txt);
      } catch (e) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); }
    }
    FAILS++; return null;                                               // sin respuesta tras reintentar: no es que no exista
  } finally { unlock(); }
}
const enc = encodeURIComponent;
const api = l => `https://${l}.wikipedia.org/w/api.php`;
const summary = (l, t) => jget(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${enc(t.replace(/ /g, "_"))}?redirect=true`);

/* ---- texto (igual que add-codex: cortes y secciones tambien en CJK, ruso y polaco) ---- */
const HIST = /^(history|historia|histoire|história|geschichte|storia|early life|biography|biografía|biographie|biografia|leben|życiorys|历史|歷史|沿革|生平|歴史|経歴|生涯|역사|생애|연혁|история|биография)/i;
const NOHIST = /etimolog|etymolog|toponym|nombre|name|nom$|referenc|see also|v[eé]ase|notes|externa|external|bibliog|further|gallery|galer|nazwa|przypisy|zobacz też|linki zewnętrzne|名称|名稱|参考|參考|参见|參見|外部链接|外部連結|脚注|関連項目|外部リンク|이름|각주|같이 보기|외부 링크|название|примечания|ссылки|литература/i;
function trim(s, n) { s = s.replace(/\n{3,}/g, "\n\n").trim(); if (s.length <= n) return s; const cut = s.slice(0, n), i = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "), cut.lastIndexOf("。")); return (i > n * 0.5 ? cut.slice(0, i + 1) : cut).trim() + (i > n * 0.5 ? "" : "…"); }
function parseExtract(text, L) {
  text = (text || "").replace(/\r/g, "");
  const cjk = ["zh", "ja"].includes(L), nLead = cjk ? 600 : 1300, nHist = cjk ? 700 : 1500;
  const parts = text.split(/\n(?=={2,}\s*[^=\n]+?\s*={2,}\s*\n)/), lead = parts.shift() || "";
  const all = parts.map(p => { const m = p.match(/^(={2,})\s*([^=\n]+?)\s*={2,}\s*\n([\s\S]*)$/); return m ? { l: m[1].length, h: m[2], t: m[3].trim() } : null; }).filter(Boolean);
  const grab = k => { let txt = all[k].t; for (let m = k + 1; m < all.length && all[m].l > all[k].l; m++) txt += "\n\n" + all[m].t; return txt.trim(); };
  const minH = cjk ? 50 : 120, minA = cjk ? 80 : 200;
  let k = all.findIndex((x, i) => x.l === 2 && HIST.test(x.h) && grab(i).length > minH);
  if (k < 0) k = all.findIndex((x, i) => x.l === 2 && !NOHIST.test(x.h) && grab(i).length > minA);
  return { lead: trim(lead, nLead), history: k >= 0 ? trim(grab(k), nHist) : "" };
}
async function langRecord(L, title) {
  const j = await jget(`${api(L)}?action=query&prop=extracts|description|info&inprop=varianttitles&explaintext=1&exsectionformat=wiki&redirects=1&titles=${enc(title)}${VARIANT[L] ? "&variant=" + VARIANT[L] : ""}&format=json&formatversion=2`);
  const pg = j && j.query && j.query.pages && j.query.pages[0]; if (!pg || pg.missing) return null;
  const e = parseExtract(pg.extract, L);
  return { t: (VARIANT[L] && pg.varianttitles && pg.varianttitles[VARIANT[L]]) || pg.title, d: pg.description || "", x: e.lead, h: e.history };
}

/* ---- foto: la principal del articulo salvo mapas, banderas y logos ---- */
const BAD_IMG = /flag|bandera|drapeau|coat[_ ]of[_ ]arms|escudo|emblem|seal[_ ]|logo|locator|location|map[_ .]|mapa|blank|symbol|icon[_.]|\.svg|signature|stamp|banner|diagram|montage|(^|[_ ])(chart|graph|table|timeline|scan|page|text|coin|genealogy)|inscription|distribution|extent|territor/i;
const fileOf = src => { const parts = String(src).split("?")[0].split("/"); let f = parts.pop(); if (parts.includes("thumb")) f = parts.pop(); else f = f.replace(/^\d+px-/, ""); return decodeURIComponent(f); };
async function photo(fn) {
  const j = await jget(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata|size|url&iiextmetadatafilter=Artist|LicenseShortName&format=json&formatversion=2`);
  const ii = ((((j && j.query && j.query.pages) || [])[0] || {}).imageinfo || [])[0]; if (!ii) return null;
  const md = ii.extmetadata || {}, strip = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return { s: ii.url.split("?")[0], w: ii.width, h: ii.height, c: { a: strip(md.Artist && md.Artist.value).slice(0, 90), l: strip(md.LicenseShortName && md.LicenseShortName.value), p: "https://commons.wikimedia.org/wiki/File:" + enc(fn) } };
}
async function bestPhoto(S) {
  const main = S.originalimage || S.thumbnail, fn = main ? fileOf(main.source) : null;
  if (fn && !BAD_IMG.test(fn)) { const p = await photo(fn); if (p) return p; }
  const j = await jget(`https://en.wikipedia.org/api/rest_v1/page/media-list/${enc(S.title.replace(/ /g, "_"))}`);
  for (const x of ((j && j.items) || []).filter(x => x.type === "image" && x.title && !BAD_IMG.test(x.title) && /\.(jpe?g|png|webp)$/i.test(x.title)).slice(0, 3)) { const p = await photo(x.title.replace(/^[^:]+:/, "")); if (p) return p; }
  return fn ? photo(fn) : null;                                       // mejor un mapa que nada
}

const FIX = readJSON(path.join(ROOT, "tools", "fix-places.json"), {});
async function resolve(it) {
  const f = cfile(it.id), old = readJSON(f, null);
  if (old && old.v === 2) return old;
  const fails0 = FAILS, flaky = () => FAILS !== fails0;
  const fx = FIX[it.id]; if (fx) it = { ...it, cands: fx[0].split("|"), hint: null };
  const rec = { v: 2, id: it.id, kind: it.kind, tier: it.tier, ne: it.ne, ok: false };
  let S = null;
  for (const t of it.cands || [it.title]) { if (!t) continue; const a = await summary("en", t); if (a && a.type !== "disambiguation" && a.title) { S = a; break; } }
  if (!S && !it.cands) for (const alt of [it.title + " (city)", it.title + " (place)"]) { const a = await summary("en", alt); if (a && a.type !== "disambiguation" && a.title) { S = a; break; } }
  if (!S) { rec.err = flaky() ? "sin respuesta" : "sin articulo"; if (!flaky()) fs.writeFileSync(f, JSON.stringify(rec)); return rec; }
  rec.title = S.title; rec.qid = S.wikibase_item || null;
  let c = S.coordinates;
  if (!c && it.hint) { const H = await summary("en", it.hint); c = H && H.coordinates; if (H && H.wikibase_item && !rec.qid) rec.qid = H.wikibase_item; rec.hintQid = H && H.wikibase_item; }
  if (fx && it.kind !== "country") { rec.lat = fx[1]; rec.lon = fx[2]; }
  else if (c) { rec.lat = +c.lat.toFixed(4); rec.lon = +c.lon.toFixed(4); }
  rec.img = await bestPhoto(S);
  const ll = await jget(`${api("en")}?action=query&titles=${enc(S.title)}&prop=langlinks&lllimit=500&format=json&formatversion=2`);
  const links = { en: S.title }; ((((ll && ll.query && ll.query.pages) || [])[0] || {}).langlinks || []).forEach(x => { if (LANGS.includes(x.lang)) links[x.lang] = x.title; });
  rec.w = {};
  for (const L of LANGS) { if (!links[L]) continue; const r = await langRecord(L, links[L]); if (r) rec.w[L] = r; }
  rec.ok = !!(rec.w.en && (rec.lat != null || it.kind === "country"));
  if (!rec.ok && !rec.err) rec.err = "sin coordenadas";
  if (!flaky()) fs.writeFileSync(f, JSON.stringify(rec)); else rec.flaky = true;   // incompleto: se reintenta en la siguiente pasada
  return rec;
}

let n = 0, next = 0; const recs = [];
await Promise.all([0, 1, 2].map(async () => { while (next < todo.length) { const r = await resolve(todo[next++]); recs.push(r); if (++n % 10 === 0) console.log(n + "/" + todo.length); } }));
const flakyRecs = recs.filter(r => r.flaky || r.err === "sin respuesta"), good = recs.filter(r => r.ok && !r.flaky);
console.log("resueltos:", good.length, "| fallidos:", recs.filter(r => !r.ok && !r.flaky && r.err !== "sin respuesta").map(r => r.id + " (" + r.err + ")").join(", ") || "ninguno");
if (flakyRecs.length) console.log("sin respuesta (no se mezclan; vuelve a lanzarlo):", flakyRecs.map(r => r.id).join(", "));
if (process.argv.includes("--fetch") || !good.length) process.exit(0);

/* ---- pais (Wikidata P17), preferiendo un pais actual de la lista ---- */
const MODERN = new Set(Object.keys(PCOUNTRY));                         // paises que ya usa el banco
const cqid = ne => { const p = PLACES.find(x => x[0] === "c:" + ne), en = p && p[6].en; const q = en && Object.keys(PCOUNTRY).find(k => PCOUNTRY[k].en === en); if (!q) console.log("  country-fix sin QID:", ne); return q || null; };
const CFIX = readJSON(path.join(ROOT, "tools", "country-fix.json"), {});
const P17 = {}, qids = [...new Set(good.map(r => r.qid || r.hintQid).filter(Boolean))];
for (let i = 0; i < qids.length; i += 40) {
  const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.slice(i, i + 40).join("|")}&props=claims&format=json`);
  for (const q of Object.keys((j && j.entities) || {})) {
    const cl = (j.entities[q].claims || {}).P17 || (j.entities[q].claims || {}).P495 || [];
    const cand = cl.filter(c => c.rank !== "deprecated" && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id).map(c => ({ id: c.mainsnak.datavalue.value.id, ended: !!(c.qualifiers && c.qualifiers.P582), pref: c.rank === "preferred" }));
    const pick = cand.find(c => MODERN.has(c.id) && !c.ended && c.pref) || cand.find(c => MODERN.has(c.id) && !c.ended) || cand.find(c => MODERN.has(c.id)) || cand.find(c => !c.ended && c.pref) || cand.find(c => !c.ended);
    if (pick) P17[q] = pick.id;
  }
}
const countryOf = r => { if (r.id in CFIX) return CFIX[r.id] ? cqid(CFIX[r.id]) : null; return P17[r.qid || r.hintQid] || null; };
const newQ = [...new Set(good.map(countryOf).filter(q => q && !PCOUNTRY[q]))];
for (let i = 0; i < newQ.length; i += 40) {
  const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${newQ.slice(i, i + 40).join("|")}&props=labels&languages=en|es|fr|pt|de|it|zh-cn|zh-hans|zh|ko|ja|ru|pl&format=json`);
  for (const q of Object.keys((j && j.entities) || {})) { const lb = j.entities[q].labels || {}, v = k => (lb[k] ? lb[k].value : ""); PCOUNTRY[q] = Object.fromEntries(LANGS.map(l => [l, (l === "zh" ? v("zh-cn") || v("zh-hans") || v("zh") : v(l)) || v("en")])); }
}

/* ---- mezcla ---- */
const clean = t => String(t || "").replace(/\s*\(.*?\)\s*/g, " ").split(",")[0].replace(/\s+/g, " ").trim();
const tidy = t => String(t || "").replace(/\(\s*[,;:\s]*\)/g, "").replace(/（\s*[，,;；:：\s]*）/g, "").replace(/\(\s*[,;:]\s*/g, "(").replace(/\s+([,.;:])/g, "$1").replace(/[ \t]{2,}/g, " ");
const NFIX = readJSON(path.join(ROOT, "tools", "name-fix.json"), {});
const order = Object.fromEntries(PLACES.map(p => [p[0], ORD[p[0]] != null ? ORD[p[0]] : 9999]));
for (const r of good) {
  const names = Object.fromEntries(LANGS.map(l => [l, clean((r.w[l] || r.w.en).t)])); if (NFIX[r.id]) Object.assign(names, NFIX[r.id]);
  if (r.kind === "country") PLACES.push([r.id, "country", r.tier, r.lat == null ? null : r.lat, r.lon == null ? null : r.lon, null, names, 0]);
  else PLACES.push([r.id, r.kind, r.tier, r.lat, r.lon, countryOf(r), names, 0]);
  order[r.id] = ORD[r.id];
}
{ const grp = {}; PLACES.forEach(p => (grp[p[1] + "|" + p[2]] = grp[p[1] + "|" + p[2]] || []).push(p));   // fama: percentil dentro de su tipo y nivel, como build-places
  for (const g of Object.values(grp)) { g.sort((a, b) => order[a[0]] - order[b[0]]); g.forEach((p, i) => { p[7] = Math.round(i * 99 / Math.max(1, g.length - 1)); }); } }
fs.writeFileSync(path.join(ROOT, "data", "places.js"), "/* Generado por tools/build-places.mjs + tools/add-langs.mjs + tools/add-places.mjs - no editar. [id, tipo, tier, lat, lon, pais(QID), nombres{en,es,fr,pt,de,it,zh,ko,ja,ru,pl}, dificultad 0-99 (0 = el mas famoso)] */\nwindow.AIQ = window.AIQ || {};\nwindow.AIQ.PLACES = " + JSON.stringify(PLACES) + ";\nwindow.AIQ.PCOUNTRY = " + JSON.stringify(PCOUNTRY) + ";\n");
const firstSentence = (s, L) => (["zh", "ja"].includes(L) ? (s.match(/^[^。！？]*[。！？]/) || [s])[0] : s.split(/(?<=[.!?])\s/)[0] || "");
for (const L of LANGS) {
  const fw = path.join(WIKI, L + ".json"), fs2 = path.join(WIKI, L + "-s.json"), W = readJSON(fw, {}), SH = readJSON(fs2, {});
  for (const r of good) {
    const w = r.w[L]; if (!w) continue;
    W[r.id] = [w.t, w.d, tidy(w.x), tidy(w.h)];
    const d = w.d ? w.d[0].toUpperCase() + w.d.slice(1) + (["zh", "ja"].includes(L) ? "。" : ". ") : "", s = (d + firstSentence(W[r.id][2] || "", L)).slice(0, 240);
    if (s) SH[r.id] = s;
  }
  fs.writeFileSync(fw, JSON.stringify(W)); fs.writeFileSync(fs2, JSON.stringify(SH));
}
const IMGF = path.join(WIKI, "img.json"), IMG = readJSON(IMGF, {});
for (const r of good) if (r.img) IMG[r.id] = [r.img.s, r.img.w, r.img.h, [r.img.c.a, r.img.c.l, r.img.c.p]];
fs.writeFileSync(IMGF, JSON.stringify(IMG));
console.log("places.js:", PLACES.length, "lugares (+" + good.length + "), data/wiki e img.json actualizados");
