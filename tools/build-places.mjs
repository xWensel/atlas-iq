/*
 * Atlas IQ - constructor del banco de lugares y de la Enciclopedia (solo desarrollo).
 *   node tools/build-places.mjs            resuelve lo que falte (reanudable: tools/cache/) y regenera data/places.js + data/wiki/*.json
 *   node tools/build-places.mjs --assemble solo ensambla desde la cache
 * Fuentes: listas de tools/places-src.mjs + entradas del juego (tools/codex-entries.json, volcado desde el navegador).
 * Para cada lugar: coordenadas, nombre y texto en 6 idiomas (Wikipedia), pais (Wikidata P17), foto y credito (Commons).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import * as SRC from "./places-src.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "tools", "cache"); fs.mkdirSync(CACHE, { recursive: true });
const OUT_WIKI = path.join(ROOT, "data", "wiki"); fs.mkdirSync(OUT_WIKI, { recursive: true });
const LANGS = ["en", "es", "fr", "pt", "de", "it"];
const UA = { "User-Agent": "AtlasIQ-builder/1.0 (https://github.com/xWensel/atlas-iq; educational geography game; polite batch job)", "Api-User-Agent": "AtlasIQ-builder/1.0 (https://github.com/xWensel/atlas-iq)" };

/* ---- claves estables identicas a las del juego (A.ckey de data/codex.js) ---- */
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "codex.js"), "utf8"), ctx);
const ckey = ctx.window.AIQ.ckey;

const split = s => s.split(/;\s*/).map(x => x.trim()).filter(Boolean);
const items = [];                                                   // {id,kind,tier,title,hint,ne}
const seen = new Set();
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

const ORD = Object.fromEntries(items.map((it, i) => [it.id, i]));         // posicion en las listas de origen (van de mas facil a mas dificil)

/* ---- red con limite de concurrencia y reintentos ---- */
let active = 0, last = 0; const waiters = [];
const GAP = 260;                                                    // ~4 peticiones/s en total, para no saturar a Wikimedia
const lock = async () => { if (active >= 3) await new Promise(r => waiters.push(r)); active++; const now = Date.now(), wait = Math.max(0, last + GAP - now); last = now + wait; if (wait) await new Promise(r => setTimeout(r, wait)); };
const unlock = () => { active--; const w = waiters.shift(); if (w) w(); };
async function jget(url, tries = 5) {
  await lock();
  try {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) });
        if (r.status === 404) return null;
        if (r.status === 429 || r.status >= 500) { const ra = +r.headers.get("retry-after") || 0; await new Promise(r2 => setTimeout(r2, Math.max(ra * 1000, 4000 * (i + 1)))); continue; }
        if (!r.ok) return null;
        return await r.json();
      } catch (e) { await new Promise(r => setTimeout(r, 1200 * (i + 1))); }
    }
    return null;
  } finally { unlock(); }
}
const enc = encodeURIComponent;
const summary = (lang, t) => jget(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc(t.replace(/ /g, "_"))}?redirect=true`);

const HIST = /^(history|historia|histoire|história|geschichte|storia|early life|biography|biografía|biographie|biografia|leben)/i;
const NOHIST = /etimolog|etymolog|toponym|nombre|name|nom$|referenc|see also|v[eé]ase|notes|externa|external|bibliog|further|gallery|galer/i;
function trim(s, n) { s = s.replace(/\n{3,}/g, "\n\n").trim(); if (s.length <= n) return s; const cut = s.slice(0, n), i = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". ")); return (i > n * 0.5 ? cut.slice(0, i + 1) : cut).trim() + (i > n * 0.5 ? "" : "…"); }
function parseExtract(text) {
  text = (text || "").replace(/\r/g, "");
  const parts = text.split(/\n(?=={2,}\s*[^=\n]+?\s*={2,}\s*\n)/), lead = parts.shift() || "";
  const all = parts.map(p => { const m = p.match(/^(={2,})\s*([^=\n]+?)\s*={2,}\s*\n([\s\S]*)$/); return m ? { l: m[1].length, h: m[2], t: m[3].trim() } : null; }).filter(Boolean);
  const grab = k => { let txt = all[k].t; for (let m = k + 1; m < all.length && all[m].l > all[k].l; m++) txt += "\n\n" + all[m].t; return txt.trim(); };
  let k = all.findIndex((x, i) => x.l === 2 && HIST.test(x.h) && grab(i).length > 120);
  if (k < 0) k = all.findIndex((x, i) => x.l === 2 && !NOHIST.test(x.h) && grab(i).length > 200);
  return { lead: trim(lead, 1300), history: k >= 0 ? trim(grab(k), 1500) : "" };
}
async function langRecord(lang, title) {
  const j = await jget(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|description&explaintext=1&exsectionformat=wiki&redirects=1&titles=${enc(title)}&format=json&formatversion=2`);
  const pg = j && j.query && j.query.pages && j.query.pages[0]; if (!pg || pg.missing) return null;
  const e = parseExtract(pg.extract);
  return { t: pg.title, d: pg.description || "", x: e.lead, h: e.history };
}
async function credit(src) {
  try {
    let fn = decodeURIComponent(src.split("?")[0].split("/").pop().replace(/^\d+px-/, "")); if (/\.svg\.png$/i.test(fn)) fn = fn.replace(/\.png$/i, "");
    const j = await jget(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=Artist|LicenseShortName&format=json&formatversion=2`);
    const md = (((j.query.pages[0] || {}).imageinfo || [])[0] || {}).extmetadata || {}, strip = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    return { a: strip(md.Artist && md.Artist.value).slice(0, 90), l: strip(md.LicenseShortName && md.LicenseShortName.value), p: "https://commons.wikimedia.org/wiki/File:" + enc(fn) };
  } catch (e) { return null; }
}

const FIX = fs.existsSync(path.join(ROOT, "tools", "fix-places.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "fix-places.json"), "utf8")) : {};
async function resolve(it) {
  const f = path.join(CACHE, it.id.replace(/[:/]/g, "_") + ".json");
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  const fx = FIX[it.id]; if (fx) { it = { ...it, cands: fx[0].split("|"), geo: null, hint: null }; }
  const rec = { id: it.id, kind: it.kind, tier: it.tier, ne: it.ne, ok: false, extra: !!it.extra };
  let S = null;
  const hav = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const okGeo = s => { if (!it.geo || !s.coordinates) return true; return hav(it.geo[0], it.geo[1], s.coordinates.lat, s.coordinates.lon) < (it.geo[2] || 300); };
  for (const t of (it.cands || [it.title])) { if (!t) continue; const a = await summary("en", t); if (a && a.type !== "disambiguation" && okGeo(a)) { S = a; break; } }
  if (!S && !it.cands) for (const alt of [it.title + " (city)", it.title + " (place)"]) { const a = await summary("en", alt); if (a && a.type !== "disambiguation") { S = a; break; } }
  if (!S && it.geo) {                                                // respaldo: el articulo mas cercano cuyo titulo se parezca
    const g = await jget(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${it.geo[0]}|${it.geo[1]}&gsradius=10000&gslimit=50&format=json&formatversion=2`), first = String(it.title || "").split(/[ ,]/)[0].toLowerCase();
    const hit = ((g && g.query && g.query.geosearch) || []).find(x => x.title.toLowerCase().includes(first)); if (hit) S = await summary("en", hit.title);
  }
  if (!S) { rec.err = "sin articulo"; fs.writeFileSync(f, JSON.stringify(rec)); return rec; }
  rec.title = S.title; rec.qid = S.wikibase_item || null;
  let c = S.coordinates;
  if (!c && it.hint) { const H = await summary("en", it.hint); c = H && H.coordinates; if (H && H.wikibase_item && !rec.qid) rec.qid = H.wikibase_item; rec.hintQid = H && H.wikibase_item; }
  if (fx && it.kind !== "country") { rec.lat = fx[1]; rec.lon = fx[2]; }                      // correccion manual: coordenadas fiables
  else if (c) { rec.lat = +c.lat.toFixed(4); rec.lon = +c.lon.toFixed(4); }
  if (S.originalimage || S.thumbnail) { const o = S.originalimage || S.thumbnail; rec.img = { s: o.source.split("?")[0], w: o.width, h: o.height }; rec.img.c = await credit(o.source); }
  // titulos en cada idioma (langlinks)
  const ll = await jget(`https://en.wikipedia.org/w/api.php?action=query&titles=${enc(S.title)}&prop=langlinks&lllimit=500&format=json&formatversion=2`);
  const links = {}; ((ll && ll.query && ll.query.pages && ll.query.pages[0] && ll.query.pages[0].langlinks) || []).forEach(x => { if (LANGS.includes(x.lang)) links[x.lang] = x.title; });
  links.en = S.title; rec.w = {};
  await Promise.all(LANGS.map(async L => { const t = links[L]; if (!t) return; const r = await langRecord(L, t); if (r) rec.w[L] = r; }));
  rec.ok = !!(rec.w.en && (rec.lat != null || it.kind === "country" || it.extra));
  fs.writeFileSync(f, JSON.stringify(rec)); return rec;
}

const clean = t => String(t || "").replace(/\s*\(.*?\)\s*/g, " ").split(",")[0].replace(/\s+/g, " ").trim();
async function assemble(recs) {
  const MODERN = new Set(recs.filter(r => r.ok && r.kind === "country" && !r.extra && r.qid).map(r => r.qid));
  // paises (Wikidata P17) y sus nombres
  const qids = [...new Set(recs.filter(r => r.ok && r.qid).map(r => r.hintQid && !r.qid ? r.hintQid : r.qid))];
  const P17 = {};
  for (let i = 0; i < qids.length; i += 40) {
    const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.slice(i, i + 40).join("|")}&props=claims&format=json`);
    for (const q of Object.keys((j && j.entities) || {})) { const cl = (j.entities[q].claims || {}).P17 || (j.entities[q].claims || {}).P495 || [];
      const cand = cl.filter(c => c.rank !== "deprecated" && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id).map(c => ({ id: c.mainsnak.datavalue.value.id, ended: !!(c.qualifiers && c.qualifiers.P582), pref: c.rank === "preferred" }));
      // preferimos un pais actual (uno de los de la lista de paises) sin fecha de fin; nunca imperios o reinos historicos si hay alternativa
      const pick = cand.find(c => MODERN.has(c.id) && !c.ended && c.pref) || cand.find(c => MODERN.has(c.id) && !c.ended) || cand.find(c => MODERN.has(c.id)) || cand.find(c => !c.ended && c.pref) || cand.find(c => !c.ended);
      if (pick) P17[q] = pick.id; }
  }
  const CFIX = fs.existsSync(path.join(ROOT, "tools", "country-fix.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "country-fix.json"), "utf8")) : {};   // id -> nombre Natural Earth ("" = sin pais: mares y oceanos)
  const cqid = ne => { const r = recs.find(x => x.id === "c:" + ne && x.qid); return r ? r.qid : null; };
  for (const r of recs) if (r.ok && r.id in CFIX) { const q = CFIX[r.id] ? cqid(CFIX[r.id]) : null; if (q) { r.pkey = r.qid || "f:" + r.id; P17[r.pkey] = q; } else { r.noCountry = true; } }
  const cq = [...new Set(Object.values(P17))], CN = {};
  for (let i = 0; i < cq.length; i += 40) {
    const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${cq.slice(i, i + 40).join("|")}&props=labels&languages=${LANGS.join("|")}&format=json`);
    for (const q of Object.keys((j && j.entities) || {})) { const L = j.entities[q].labels || {}; CN[q] = Object.fromEntries(LANGS.map(l => [l, L[l] ? L[l].value : (L.en ? L.en.value : "")])); }
  }
  const tidy = t => String(t || "").replace(/\(\s*[,;:\s]*\)/g, "").replace(/\(\s*[,;:]\s*/g, "(").replace(/\s+([,.;:])/g, "$1").replace(/[ 	]{2,}/g, " ");
  const fameOf = r => (ORD[r.id] != null ? ORD[r.id] : 9999);
  const NFIX = fs.existsSync(path.join(ROOT, "tools", "name-fix.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "name-fix.json"), "utf8")) : {};      // id -> nombres corregidos por idioma
  const DROP = new Set(fs.existsSync(path.join(ROOT, "tools", "drop-places.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "drop-places.json"), "utf8")) : []);   // lugares duplicados que no entran en el banco de preguntas
  const CLAB = fs.existsSync(path.join(ROOT, "tools", "country-labels.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "country-labels.json"), "utf8")) : {};
  for (const q of Object.keys(CLAB)) CN[q] = Object.assign(CN[q] || {}, CLAB[q]);
  const places = [], wiki = Object.fromEntries(LANGS.map(l => [l, {}])), img = {};
  for (const r of recs) {
    if (!r.ok) continue;
    const names = Object.fromEntries(LANGS.map(l => [l, clean((r.w[l] || r.w.en).t)])); if (NFIX[r.id]) Object.assign(names, NFIX[r.id]);
    if (r.extra || DROP.has(r.id)) { /* solo contenido */ }
    else if (r.kind !== "country") places.push([r.id, r.kind, r.tier, r.lat, r.lon, (r.noCountry ? null : P17[r.pkey || r.qid] || null), names, fameOf(r)]);
    else if (!r.extra) places.push([r.id, "country", r.tier, r.lat == null ? null : r.lat, r.lon == null ? null : r.lon, null, names, fameOf(r)]);
    for (const l of LANGS) if (r.w[l]) wiki[l][r.id] = [r.w[l].t, r.w[l].d, tidy(r.w[l].x), tidy(r.w[l].h)];
    if (r.img) img[r.id] = [r.img.s, r.img.w, r.img.h, r.img.c ? [r.img.c.a, r.img.c.l, r.img.c.p] : null];
  }
  { const grp = {}; places.forEach(p => (grp[p[1] + "|" + p[2]] = grp[p[1] + "|" + p[2]] || []).push(p));       // fama: 0 = muy conocido ... 99 = raro (percentil dentro de su tipo y nivel)
    for (const g of Object.values(grp)) { g.sort((a, b) => a[7] - b[7]); g.forEach((p, i) => { p[7] = Math.round(i * 99 / Math.max(1, g.length - 1)); }); } }
  fs.writeFileSync(path.join(ROOT, "data", "places.js"), "/* Generado por tools/build-places.mjs - no editar. [id, tipo, tier, lat, lon, pais(QID), nombres{en,es,fr,pt,de,it}, dificultad 0-99 (0 = el mas famoso)] */\nwindow.AIQ = window.AIQ || {};\nwindow.AIQ.PLACES = " + JSON.stringify(places) + ";\nwindow.AIQ.PCOUNTRY = " + JSON.stringify(CN) + ";\n");
  for (const l of LANGS) fs.writeFileSync(path.join(OUT_WIKI, l + ".json"), JSON.stringify(wiki[l]));
  // notas de campo cortas (descripcion + 1.a frase) solo para los lugares del banco de preguntas
  const inPlaces = new Set(places.map(p => p[0]));
  for (const l of LANGS) { const sh = {}; for (const id of inPlaces) { const r = wiki[l][id] || wiki.en[id]; if (!r) continue; const first = (r[2] || "").split(/(?<=[.!?])\s/)[0] || ""; const t = ((r[1] ? r[1][0].toUpperCase() + r[1].slice(1) + ". " : "") + first).slice(0, 240); if (t) sh[id] = t; } fs.writeFileSync(path.join(OUT_WIKI, l + "-s.json"), JSON.stringify(sh)); }
  fs.writeFileSync(path.join(OUT_WIKI, "img.json"), JSON.stringify(img));
  const bad = recs.filter(r => !r.ok).map(r => r.id + " (" + (r.err || "sin coords") + ")");
  const byKind = {}; places.forEach(p => { const k = p[1] + "/t" + p[2]; byKind[k] = (byKind[k] || 0) + 1; });
  console.log("lugares:", places.length, JSON.stringify(byKind)); console.log("descartados:", bad.length, bad.slice(0, 60).join(", "));
}

const only = process.argv.includes("--assemble");
if (process.argv.includes("--extra")) {                             // entradas del juego que no estan en las listas: tools/codex-extra.json
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "codex-extra.json"), "utf8"));
  items.length = 0; ex.forEach(e => items.push({ id: e.id, kind: e.type, tier: e.rarity || 0, title: e.wiki, extra: true, cands: [...new Set([e.override, e.full, e.wiki, e.name].filter(Boolean))], geo: e.lat != null && !e.nogeo ? [e.lat, e.lon, ["nature", "water", "strait", "country"].includes(e.type) ? 1800 : 300] : null }));
}
let done = 0; let recs = [];
console.log(items.length, "por procesar");
const queue = items.slice();
async function worker() { while (queue.length) { const it = queue.shift(); recs.push(only ? (fs.existsSync(path.join(CACHE, it.id.replace(/[:/]/g, "_") + ".json")) ? JSON.parse(fs.readFileSync(path.join(CACHE, it.id.replace(/[:/]/g, "_") + ".json"), "utf8")) : { ok: false, id: it.id, err: "sin cache" }) : await resolve(it)); if (++done % 25 === 0) console.log(done + "/" + items.length); } }
await Promise.all(Array.from({ length: 4 }, worker));
// ensambla con TODO lo que haya en la cache (listas + extras)
recs = fs.readdirSync(CACHE).filter(f => f.endsWith(".json")).map(f => JSON.parse(fs.readFileSync(path.join(CACHE, f), "utf8")));
await assemble(recs);
