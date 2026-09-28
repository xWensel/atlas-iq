/*
 * Geolite - anade idiomas nuevos a la Enciclopedia y al banco de lugares SIN tocar los existentes (solo desarrollo).
 *   node tools/add-langs.mjs              descarga lo que falte (reanudable: tools/cache-langs/) y escribe data/wiki/<l>.json, <l>-s.json y los nombres en data/places.js
 *   node tools/add-langs.mjs --assemble   solo escribe desde la cache
 * Parte de los articulos ya resueltos en ingles (data/wiki/en.json) y sigue sus enlaces interlingüisticos.
 * es-419 no necesita datos propios: reutiliza la Wikipedia en espanol (ver BASE_OF en js/support.js).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "tools", "cache-langs"); fs.mkdirSync(CACHE, { recursive: true });
const WIKI = path.join(ROOT, "data", "wiki");
const NEW = ["zh", "ko", "ja", "ru", "pl"];
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite)" };
const VARIANT = { zh: "zh-cn" };                                    // chino: siempre simplificado

let active = 0, last = 0; const waiters = [];
const GAP = 450;
const lock = async () => { if (active >= 2) await new Promise(r => waiters.push(r)); active++; const now = Date.now(), wait = Math.max(0, last + GAP - now); last = now + wait; if (wait) await new Promise(r => setTimeout(r, wait)); };
const unlock = () => { active--; const w = waiters.shift(); if (w) w(); };
async function jget(url, tries = 6) {
  await lock();
  try {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(url + "&maxlag=5", { headers: UA, signal: AbortSignal.timeout(40000) });
        if (r.status === 404) return null;
        const txt = await r.text();
        if (r.status === 429 || r.status >= 500 || /too many requests|maxlag/i.test(txt.slice(0, 300))) { const ra = +r.headers.get("retry-after") || 0; await new Promise(r2 => setTimeout(r2, Math.max(ra * 1000, 8000 * (i + 1)))); continue; }
        if (!r.ok) return null;
        return JSON.parse(txt);
      } catch (e) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); }
    }
    return null;
  } finally { unlock(); }
}
const enc = encodeURIComponent;

const HIST = /^(history|historia|histoire|história|geschichte|storia|early life|biography|historia|życiorys|历史|歷史|沿革|生平|歴史|沿革|経歴|生涯|역사|생애|연혁|история|биография)/i;
const NOHIST = /etimolog|etymolog|toponym|nombre|name|nom$|referenc|see also|notes|externa|external|bibliog|further|gallery|名称|名稱|参考|參考|参见|參見|przypisy|zobacz też|linki zewnętrzne|bibliografia|外部链接|外部連結|脚注|関連項目|外部リンク|名称|이름|각주|같이 보기|외부 링크|название|примечания|ссылки|литература|см\. также/i;
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
const clean = t => String(t || "").replace(/\s*[(（].*?[)）]\s*/g, " ").split(/[,，]/)[0].replace(/\s+/g, " ").trim();

/* ---- datos actuales ---- */
const EN = JSON.parse(fs.readFileSync(path.join(WIKI, "en.json"), "utf8"));
const ids = Object.keys(EN);
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), ctx);
const PLACES = ctx.window.AIQ.PLACES, PCOUNTRY = ctx.window.AIQ.PCOUNTRY;

const cfile = n => path.join(CACHE, n + ".json");
const load = (n, d) => (fs.existsSync(cfile(n)) ? JSON.parse(fs.readFileSync(cfile(n), "utf8")) : d);
const save = (n, v) => fs.writeFileSync(cfile(n), JSON.stringify(v));

async function links(L) {                                           // id -> titulo en L
  const out = load("links-" + L, null); if (out) return out;
  const res = {}, byTitle = {};
  ids.forEach(id => { (byTitle[EN[id][0]] = byTitle[EN[id][0]] || []).push(id); });
  const titles = Object.keys(byTitle);
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    let cont = "";
    do {
      const j = await jget(`https://en.wikipedia.org/w/api.php?action=query&titles=${enc(batch.join("|"))}&prop=langlinks&lllang=${L}&lllimit=500&redirects=1&format=json&formatversion=2${cont}`);
      if (!j) break;
      const back = {}; ((j.query && j.query.normalized) || []).concat((j.query && j.query.redirects) || []).forEach(x => { back[x.to] = back[x.from] || x.from; });
      ((j.query && j.query.pages) || []).forEach(p => { const ll = (p.langlinks || [])[0]; if (!ll) return; const orig = byTitle[p.title] ? p.title : back[p.title]; (byTitle[orig] || []).forEach(id => { res[id] = ll.title; }); });
      cont = j.continue ? "&" + Object.entries(j.continue).map(([k, v]) => k + "=" + enc(v)).join("&") : "";
    } while (cont);
    process.stdout.write(`\r${L} enlaces ${Math.min(i + 50, titles.length)}/${titles.length}`);
  }
  console.log(`\n${L}: ${Object.keys(res).length} articulos enlazados`);
  save("links-" + L, res); return res;
}

async function variantTitles(L, lk) {                               // chino: titulo en simplificado
  if (!VARIANT[L]) return {};
  const out = load("vt-" + L, null); if (out) return out;
  const res = {}, titles = [...new Set(Object.values(lk))];
  for (let i = 0; i < titles.length; i += 50) {
    const j = await jget(`https://${L}.wikipedia.org/w/api.php?action=query&titles=${enc(titles.slice(i, i + 50).join("|"))}&prop=info&inprop=varianttitles&format=json&formatversion=2`);
    ((j && j.query && j.query.pages) || []).forEach(p => { const v = p.varianttitles && p.varianttitles[VARIANT[L]]; if (v) res[p.title] = v; });
  }
  save("vt-" + L, res); return res;
}

async function records(L, lk) {
  const f = "rec-" + L, recs = load(f, {}); let n = 0;
  const todo = Object.entries(lk).filter(([id]) => !(id in recs));
  const total = todo.length;
  await Promise.all(todo.map(async ([id, title]) => {
    const j = await jget(`https://${L}.wikipedia.org/w/api.php?action=query&prop=extracts|description&explaintext=1&exsectionformat=wiki&redirects=1&titles=${enc(title)}${VARIANT[L] ? "&variant=" + VARIANT[L] : ""}&format=json&formatversion=2`);
    const pg = j && j.query && j.query.pages && j.query.pages[0];
    if (pg && !pg.missing) { const e = parseExtract(pg.extract, L); recs[id] = [pg.title, pg.description || "", e.lead, e.history]; } else recs[id] = null;
    if (++n % 25 === 0) { save(f, recs); process.stdout.write(`\r${L} articulos ${n}/${total}`); }
  }));
  save(f, recs); console.log(`\n${L}: ${Object.values(recs).filter(Boolean).length} articulos`);
  return recs;
}

async function countryLabels() {
  const out = load("countries", null); if (out) return out;
  const qs = Object.keys(PCOUNTRY), res = {};
  for (let i = 0; i < qs.length; i += 40) {
    const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qs.slice(i, i + 40).join("|")}&props=labels&languages=zh-cn|zh-hans|zh|ko|ja|ru|pl&format=json`);
    for (const q of Object.keys((j && j.entities) || {})) { const lb = j.entities[q].labels || {}, v = k => (lb[k] ? lb[k].value : "");
      res[q] = { zh: v("zh-cn") || v("zh-hans") || v("zh"), ko: v("ko"), ja: v("ja"), ru: v("ru"), pl: v("pl") }; }
  }
  save("countries", res); return res;
}

function assemble(all, vts, CL) {
  const firstSentence = (s, L) => (["zh", "ja"].includes(L) ? (s.match(/^[^。！？]*[。！？]/) || [s])[0] : (s.split(/(?<=[.!?])\s/)[0] || ""));
  const inPlaces = new Set(PLACES.map(p => p[0]));
  for (const L of NEW) {
    const recs = all[L], vt = vts[L] || {}, wiki = {}, sh = {};
    for (const id of ids) {
      const r = recs[id]; if (!r) continue;
      const t = vt[r[0]] || r[0];
      wiki[id] = [t, r[1], tidy(r[2]), tidy(r[3])];
      if (inPlaces.has(id)) { const first = firstSentence(wiki[id][2] || "", L); const d = r[1] ? r[1][0].toUpperCase() + r[1].slice(1) + (["zh", "ja"].includes(L) ? "。" : ". ") : ""; const s = (d + first).slice(0, 240); if (s) sh[id] = s; }
    }
    fs.writeFileSync(path.join(WIKI, L + ".json"), JSON.stringify(wiki));
    fs.writeFileSync(path.join(WIKI, L + "-s.json"), JSON.stringify(sh));
    console.log(L, "wiki", Object.keys(wiki).length, "notas", Object.keys(sh).length);
  }
  const NFIX = fs.existsSync(path.join(ROOT, "tools", "name-fix.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "name-fix.json"), "utf8")) : {};
  for (const p of PLACES) {
    const names = p[6];
    for (const L of NEW) { const r = all[L][p[0]]; if (r) names[L] = clean((vts[L] || {})[r[0]] || r[0]); if (NFIX[p[0]] && NFIX[p[0]][L]) names[L] = NFIX[p[0]][L]; }
  }
  for (const q of Object.keys(PCOUNTRY)) for (const L of NEW) { const v = CL[q] && CL[q][L]; if (v) PCOUNTRY[q][L] = v; }
  fs.writeFileSync(path.join(ROOT, "data", "places.js"), "/* Generado por tools/build-places.mjs + tools/add-langs.mjs - no editar. [id, tipo, tier, lat, lon, pais(QID), nombres{en,es,fr,pt,de,it,zh,ko,ja,ru,pl}, dificultad 0-99 (0 = el mas famoso)] */\nwindow.AIQ = window.AIQ || {};\nwindow.AIQ.PLACES = " + JSON.stringify(PLACES) + ";\nwindow.AIQ.PCOUNTRY = " + JSON.stringify(PCOUNTRY) + ";\n");
  console.log("places.js actualizado:", PLACES.length, "lugares");
}

const only = process.argv.includes("--assemble");
const all = {}, vts = {};
for (const L of NEW) {
  const lk = only ? load("links-" + L, {}) : await links(L);
  vts[L] = only ? load("vt-" + L, {}) : await variantTitles(L, lk);
  all[L] = only ? load("rec-" + L, {}) : await records(L, lk);
}
const CL = only ? load("countries", {}) : await countryLabels();
assemble(all, vts, CL);
