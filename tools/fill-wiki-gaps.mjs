/*
 * Geolite - rellena huecos de la Enciclopedia: tarjetas que tienen texto en ingles pero no en algun otro idioma (solo desarrollo, necesita red).
 *   node tools/fill-wiki-gaps.mjs [tools/wiki-tr/todo.json]
 * todo.json: {idioma: [id, ...]} (lo vuelca el juego desde el navegador). Para cada id busca en Wikidata (sitelinks del articulo ingles)
 * si ESE idioma tiene articulo: muchos huecos eran fallos de red de la primera descarga, no articulos inexistentes.
 * Si existe, trae su texto (zh en zh-cn) y lo mezcla en data/wiki/<l>.json y <l>-s.json. Lo que quede sin articulo se reescribe en
 * tools/wiki-tr/todo.json: eso se traduce a mano en tools/wiki-tr/<l>.json (lo mezcla tools/merge-wiki-tr.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "data", "wiki");
const TODO = process.argv[2] || path.join(ROOT, "tools", "wiki-tr", "todo.json");
const VARIANT = { zh: "zh-cn" };
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite)" };
const enc = encodeURIComponent, wait = ms => new Promise(r => setTimeout(r, ms));
async function jget(url) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) });
      if (r.status === 404) return null;
      const t = await r.text();
      if (r.status === 429 || r.status >= 500 || /too many requests/i.test(t.slice(0, 300))) { await wait(8000 * (i + 1)); continue; }
      if (!r.ok) return null;
      await wait(350); return JSON.parse(t);
    } catch (e) { await wait(2000 * (i + 1)); }
  }
  throw new Error("sin respuesta: " + url.slice(0, 120));                 // mejor parar que dar por inexistente un articulo
}
/* mismo tratamiento del texto que add-codex / add-places */
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
const tidy = t => String(t || "").replace(/\(\s*[,;:\s]*\)/g, "").replace(/（\s*[，,;；:：\s]*）/g, "").replace(/\(\s*[,;:]\s*/g, "(").replace(/\s+([,.;:])/g, "$1").replace(/[ \t]{2,}/g, " ");
const firstSentence = (s, L) => (["zh", "ja"].includes(L) ? (s.match(/^[^。！？]*[。！？]/) || [s])[0] : s.split(/(?<=[.!?])\s/)[0] || "");

const todo = JSON.parse(fs.readFileSync(TODO, "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(WIKI, "en.json"), "utf8"));
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), ctx);
const inPlaces = new Set(ctx.window.AIQ.PLACES.map(p => p[0]));
/* coordenadas y tipo de cada tarjeta (banco de lugares + volcado del codex) para validar lo que devuelva la busqueda */
const GEO = {};
for (const p of ctx.window.AIQ.PLACES) if (p[3] != null) GEO[p[0]] = { lat: p[3], lon: p[4], big: ["nature", "country"].includes(p[1]) };
const CA = path.join(ROOT, "tools", "codex-all.json");
if (fs.existsSync(CA)) for (const e of JSON.parse(fs.readFileSync(CA, "utf8"))) if (e[2] != null && !GEO[e[0]]) GEO[e[0]] = { lat: e[2], lon: e[3], big: ["nature", "water", "strait", "country"].includes(e[1]) };
const hav = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

/* 1) sitelinks de Wikidata a partir del titulo ingles (50 por peticion) */
const ids = [...new Set(Object.values(todo).flat())].filter(id => EN[id]);
const links = {}, labels = {};                                             // id -> {lang: titulo} / {lang: etiqueta de Wikidata}
for (let i = 0; i < ids.length; i += 50) {
  const part = ids.slice(i, i + 50), titles = part.map(id => EN[id][0]);
  const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${enc(titles.join("|"))}&props=sitelinks|labels&languages=en|es|fr|pt|de|it|zh-cn|zh-hans|zh|ko|ja|ru|pl&format=json`);
  const byTitle = {}, labBy = {};
  for (const q of Object.values((j && j.entities) || {})) {
    const sl = q.sitelinks || {}; if (!sl.enwiki) continue;
    byTitle[sl.enwiki.title] = Object.fromEntries(Object.entries(sl).filter(([k]) => /^[a-z]{2}wiki$/.test(k)).map(([k, v]) => [k.slice(0, 2), v.title]));
    const lb = q.labels || {}, v = k => (lb[k] ? lb[k].value : ""); labBy[sl.enwiki.title] = { en: v("en"), es: v("es"), fr: v("fr"), pt: v("pt"), de: v("de"), it: v("it"), zh: v("zh-cn") || v("zh-hans") || v("zh"), ko: v("ko"), ja: v("ja"), ru: v("ru"), pl: v("pl") };
  }
  for (const id of part) { links[id] = byTitle[EN[id][0]] || {}; labels[id] = labBy[EN[id][0]] || {}; }
  process.stdout.write(`\rwikidata ${Math.min(i + 50, ids.length)}/${ids.length}`);
}
console.log();

/* 1b) sin enlace directo: el tema suele existir en ese idioma bajo otro elemento de Wikidata (Bali isla/provincia, Annapurna/Annapurna I...).
   Se busca por la etiqueta local y se acepta solo si el articulo tiene coordenadas junto a las de la tarjeta (25 km; 150 km para naturaleza y paises) */
async function searchNear(L, id) {
  const g = GEO[id]; if (!g) return null;
  const qs = [...new Set([labels[id] && labels[id][L], EN[id][0]].filter(Boolean))];
  for (const q of qs) {
    const sj = await jget(`https://${L}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${enc(q)}&srlimit=5&srnamespace=0&format=json&formatversion=2`);
    const titles = ((sj && sj.query && sj.query.search) || []).map(x => x.title); if (!titles.length) continue;
    const cj = await jget(`https://${L}.wikipedia.org/w/api.php?action=query&prop=coordinates|pageprops&ppprop=disambiguation&redirects=1&titles=${enc(titles.join("|"))}&format=json&formatversion=2`);
    const pages = (cj && cj.query && cj.query.pages) || [];
    for (const t of titles) {
      const pg = pages.find(p => p.title === t); if (!pg || !pg.coordinates || (pg.pageprops && "disambiguation" in pg.pageprops)) continue;
      /* ademas del sitio, el titulo tiene que ser el nombre buscado: solo con la cercania colaba "Sidney" por "Hyde Park Barracks"
         o un atentado por "Bondi Beach" */
      const nt = x => String(x).replace(/\s*[(（].*?[)）]\s*/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
      const d = hav(g.lat, g.lon, pg.coordinates[0].lat, pg.coordinates[0].lon);
      if (d <= (g.big ? 150 : 25) && nt(pg.title) === nt(q)) return pg.title;
    }
  }
  return null;
}
const viaSearch = [];

/* 2) texto de los que si tienen articulo */
const left = {}; let filled = 0;
for (const [L, list] of Object.entries(todo)) {
  const fw = path.join(WIKI, L + ".json"), fs2 = path.join(WIKI, L + "-s.json"), W = JSON.parse(fs.readFileSync(fw, "utf8")), SH = JSON.parse(fs.readFileSync(fs2, "utf8"));
  for (const id of list) {
    if (W[id] && !W[id][4]) continue;                                      // ya tiene texto propio
    let t = links[id] && links[id][L];
    if (!t) { t = await searchNear(L, id); if (t) viaSearch.push(L + ":" + id + " -> " + t); }
    let ok = false;
    if (t) {
      const j = await jget(`https://${L}.wikipedia.org/w/api.php?action=query&prop=extracts|description|info&inprop=varianttitles&explaintext=1&exsectionformat=wiki&redirects=1&titles=${enc(t)}${VARIANT[L] ? "&variant=" + VARIANT[L] : ""}&format=json&formatversion=2`);
      const pg = j && j.query && j.query.pages && j.query.pages[0];
      if (pg && !pg.missing && pg.extract) {
        const e = parseExtract(pg.extract, L), tt = (VARIANT[L] && pg.varianttitles && pg.varianttitles[VARIANT[L]]) || pg.title;
        W[id] = [tt, pg.description || "", tidy(e.lead), tidy(e.history)]; ok = true; filled++;
        if (inPlaces.has(id)) { const d = pg.description ? pg.description[0].toUpperCase() + pg.description.slice(1) + (["zh", "ja"].includes(L) ? "。" : ". ") : ""; const s = (d + firstSentence(W[id][2], L)).slice(0, 240); if (s) SH[id] = s; }
      }
    }
    if (!ok) (left[L] ||= []).push(id);
  }
  fs.writeFileSync(fw, JSON.stringify(W)); fs.writeFileSync(fs2, JSON.stringify(SH));
  console.log(L, "rellenados", list.length - ((left[L] || []).length), "/", list.length);
}
fs.writeFileSync(TODO, JSON.stringify(left));
if (viaSearch.length) console.log("encontrados por busqueda + coordenadas:\n  " + viaSearch.join("\n  "));
console.log("total rellenados", filled, "| quedan para traducir a mano:", Object.values(left).flat().length, "(" + TODO + ")");
