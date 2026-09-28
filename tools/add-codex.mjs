/*
 * Geolite - empaqueta las tarjetas de la Enciclopedia que aun no estaban en data/wiki/ (solo desarrollo, necesita red).
 *   node tools/add-codex.mjs <codex-all.json>      reanudable (tools/cache-codex/); escribe data/wiki/<l>.json, <l>-s.json e img.json
 * <codex-all.json>: volcado del juego (A.codex) con [id, tipo, lat, lon, nogeo, nombreEn, full, wiki, nombreEs] por articulo.
 * Busca el articulo igual que lo hacia el juego en directo (geosearch para ciudades, candidatos y respaldo por cercania),
 * y trae el texto en los 11 idiomas de Wikipedia, la foto y su credito de Commons. Tras esto el juego no consulta Wikipedia.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "tools", "cache-codex"); fs.mkdirSync(CACHE, { recursive: true });
const WIKI = path.join(ROOT, "data", "wiki");
const LANGS = ["en", "es", "fr", "pt", "de", "it", "zh", "ko", "ja", "ru", "pl"];
const VARIANT = { zh: "zh-cn" };
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite)" };

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
    FAILS++; return null;                                           // sin respuesta tras reintentar: no es que no exista
  } finally { unlock(); }
}
const enc = encodeURIComponent;
const api = l => `https://${l}.wikipedia.org/w/api.php`;
const summary = (l, t) => jget(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${enc(t.replace(/ /g, "_"))}?redirect=true`, VARIANT[l] ? { "Accept-Language": VARIANT[l] } : {});

const HIST = /^(history|historia|histoire|história|geschichte|storia|early life|biography|biografía|biographie|biografia|leben|historia|życiorys|biografia|历史|歷史|沿革|生平|歴史|経歴|生涯|역사|생애|연혁|история|биография)/i;
const NOHIST = /etimolog|etymolog|toponym|nombre|name|nom$|referenc|see also|v[eé]ase|notes|externa|external|bibliog|further|gallery|galer|nazwa|przypisy|zobacz też|linki zewnętrzne|bibliografia|名称|名稱|参考|參考|参见|參見|外部链接|外部連結|脚注|関連項目|外部リンク|이름|각주|같이 보기|외부 링크|название|примечания|ссылки|литература/i;
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
const hav = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const norm = x => String(x).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const BAD_IMG = /flag|bandera|drapeau|coat[_ ]of[_ ]arms|escudo|emblem|seal[_ ]|logo|locator|location|map[_ .]|mapa|blank|symbol|icon[_.]|\.svg|signature|stamp|banner|diagram|montage|(^|[_ ])(chart|graph|table|timeline|scan|page|text|tablet|coin|tree|genealogy)|inscription|distribution|extent|territor|evolution|comparison|constitution/i;
const fileOf = src => { const parts = String(src).split("?")[0].split("/"); let f = parts.pop(); if (parts.includes("thumb")) f = parts.pop(); else f = f.replace(/^\d+px-/, ""); return decodeURIComponent(f); };

/* articulos que la busqueda automatica no encuentra (titulo distinto o coordenadas del articulo lejos de las del juego) */
const TITLE_FIX = { "zheng-he": "Zheng He", "congress-of-tucuman-deputies": "Congress of Tucumán", "discovery-of-tutankhamun-s-grave": "KV62" };
async function findTitle(e) {
  const [id, type, lat, lon, nogeo, nameEn, full, wiki] = e;
  if (TITLE_FIX[id]) return TITLE_FIX[id];
  const okGeo = s => { if (nogeo || lat == null || !s.coordinates) return true; const lim = ["nature", "water", "strait", "country"].includes(type) ? 1800 : 300; return hav(lat, lon, s.coordinates.lat, s.coordinates.lon) < lim; };
  if (["city", "capital", "place"].includes(type) && lat != null && !nogeo) {
    const g = await jget(`${api("en")}?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=500&format=json`), nm = norm(nameEn);
    const hit = ((g && g.query && g.query.geosearch) || []).find(x => { const t = norm(x.title); return t === nm || (t.startsWith(nm + ", ") && !/\(/.test(t)); });
    if (hit) return hit.title;
  }
  for (const t of [...new Set([full, wiki, nameEn].filter(Boolean))]) { const s = await summary("en", t); if (s && s.type !== "disambiguation" && s.title && okGeo(s)) return s.title; }
  if (lat != null && !nogeo) {
    const g = await jget(`${api("en")}?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=40&format=json`), first = nameEn.split(/[ ,]/)[0].toLowerCase();
    const hit = ((g && g.query && g.query.geosearch) || []).find(x => x.title.toLowerCase().includes(first)); if (hit) return hit.title;
  }
  return null;
}
async function credit(fn) {
  const j = await jget(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata|size|url&iiextmetadatafilter=Artist|LicenseShortName&format=json&formatversion=2`);
  const ii = ((((j && j.query && j.query.pages) || [])[0] || {}).imageinfo || [])[0]; if (!ii) return null;
  const md = ii.extmetadata || {}, strip = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return { src: ii.url.split("?")[0], w: ii.width, h: ii.height, c: [strip(md.Artist && md.Artist.value).slice(0, 90), strip(md.LicenseShortName && md.LicenseShortName.value), "https://commons.wikimedia.org/wiki/File:" + enc(fn)] };
}
async function betterImage(type, title, wikiName) {
  if (type === "country") for (const t of ["Tourism in " + wikiName, "Tourism in the " + wikiName]) { const ts = await summary("en", t); const src = ((ts && ts.originalimage) || {}).source || ""; if (/\.jpe?g/i.test(src.split("?")[0]) && !BAD_IMG.test(fileOf(src))) return fileOf(src); }
  const j = await jget(`https://en.wikipedia.org/api/rest_v1/page/media-list/${enc(title.replace(/ /g, "_"))}`);
  const it = ((j && j.items) || []).filter(x => x.type === "image" && x.title && !BAD_IMG.test(x.title) && /\.(jpe?g|png|webp)$/i.test(x.title))[0];
  return it ? it.title.replace(/^[^:]+:/, "") : null;
}
async function resolve(e) {
  const f = path.join(CACHE, e[0].replace(/[:/\\]/g, "_") + ".json");
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  const rec = { id: e[0], w: {} }, fails0 = FAILS, flaky = () => FAILS !== fails0;   // cualquier fallo de red mientras tanto: no se cachea
  const title = await findTitle(e);
  if (!title) { rec.err = flaky() ? "sin respuesta" : "sin articulo"; if (!flaky()) fs.writeFileSync(f, JSON.stringify(rec)); return rec; }
  const S = await summary("en", title); rec.title = title;
  const ll = await jget(`${api("en")}?action=query&titles=${enc(title)}&prop=langlinks&lllimit=500&redirects=1&format=json&formatversion=2`);
  const links = { en: title }; ((((ll && ll.query && ll.query.pages) || [])[0] || {}).langlinks || []).forEach(x => { if (LANGS.includes(x.lang)) links[x.lang] = x.title; });
  for (const L of LANGS) {
    const t = links[L]; if (!t) continue;
    const j = await jget(`${api(L)}?action=query&prop=extracts|description|info&inprop=varianttitles&explaintext=1&exsectionformat=wiki&redirects=1&titles=${enc(t)}${VARIANT[L] ? "&variant=" + VARIANT[L] : ""}&format=json&formatversion=2`);
    const pg = j && j.query && j.query.pages && j.query.pages[0]; if (!pg || pg.missing) continue;
    const ex = parseExtract(pg.extract, L), tt = (VARIANT[L] && pg.varianttitles && pg.varianttitles[VARIANT[L]]) || pg.title;
    rec.w[L] = [tt, pg.description || "", ex.lead, ex.history];
  }
  let fn = S && (S.originalimage || S.thumbnail) ? fileOf((S.originalimage || S.thumbnail).source) : null;
  if (!fn || BAD_IMG.test(fn) || (["country", "event"].includes(e[1]) && /\.svg/i.test(fn))) fn = (await betterImage(e[1], title, e[7] || e[5])) || fn;
  if (fn) rec.img = await credit(fn);
  if (!flaky()) fs.writeFileSync(f, JSON.stringify(rec)); else rec.flaky = true;   // incompleto: se reintenta en la siguiente pasada
  return rec;
}

const src = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const have = JSON.parse(fs.readFileSync(path.join(WIKI, "en.json"), "utf8"));
const todo = src.filter(e => !have[e[0]]);
console.log("tarjetas a empaquetar:", todo.length);
let n = 0; const recs = [];
let next = 0;                                                            // 4 tarjetas a la vez: la cache se va llenando mientras corre
await Promise.all([0, 1, 2, 3].map(async () => { while (next < todo.length) { const r = await resolve(todo[next++]); recs.push(r); if (++n % 10 === 0) process.stdout.write(`\r${n}/${todo.length}`); } }));
const flaky = recs.filter(r => r.flaky || r.err === "sin respuesta");
console.log("\nresueltas:", recs.filter(r => !r.err && !r.flaky).length, "sin articulo:", recs.filter(r => r.err === "sin articulo").map(r => r.id).join(", "));
if (flaky.length) console.log("sin respuesta (no se mezclan; vuelve a lanzarlo):", flaky.map(r => r.id).join(", "));
for (const r of flaky) recs.splice(recs.indexOf(r), 1);

/* ---- mezcla en data/wiki ---- */
const tidy = t => String(t || "").replace(/\(\s*[,;:\s]*\)/g, "").replace(/（\s*[，,;；:：\s]*）/g, "").replace(/\(\s*[,;:]\s*/g, "(").replace(/\s+([,.;:])/g, "$1").replace(/[ \t]{2,}/g, " ");
const img = JSON.parse(fs.readFileSync(path.join(WIKI, "img.json"), "utf8"));
for (const L of LANGS) {
  const fw = path.join(WIKI, L + ".json"), W = fs.existsSync(fw) ? JSON.parse(fs.readFileSync(fw, "utf8")) : {};
  for (const r of recs) if (r.w && r.w[L]) W[r.id] = [r.w[L][0], r.w[L][1], tidy(r.w[L][2]), tidy(r.w[L][3])];
  fs.writeFileSync(fw, JSON.stringify(W));
}
for (const r of recs) if (r.img && r.img.src) img[r.id] = [r.img.src, r.img.w, r.img.h, r.img.c];
fs.writeFileSync(path.join(WIKI, "img.json"), JSON.stringify(img));
console.log("data/wiki actualizado");
