/*
 * Geolite - constructor de datos de banderas (solo desarrollo, requiere red a Wikidata y Wikimedia Commons).
 *   node tools/build-flags.mjs   resuelve la bandera (Wikidata P41) y el credito (Commons) de cada pais de data/places.js y escribe data/flags.js
 * Formato data/flags.js: window.AIQ.FLAGS = { "<nombre en ingles del pais>": [archivo, ancho, alto, [autor, licencia, pagina] | null] }
 * Las imagenes no se descargan aqui: las empaqueta despues `python tools/bundle-media.py --flags` en assets/flags/<pais>.svg (salta las que ya existen: borra la vieja si cambia el archivo).
 * Si un pais no encaja por nombre (Wikidata usa un nombre oficial distinto al del juego), anadelo a tools/flag-name-fix.json: { "<nombre del juego>": "<nombre a buscar en Wikidata>" | "<QID>" }.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Api-User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite)" };

/* ---- paises: los mismos 196 nombres en ingles que ya usa el juego (data/places.js, filas kind="country") ---- */
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "places.js"), "utf8"), ctx);
const COUNTRIES = ctx.window.AIQ.PLACES.filter(r => r[1] === "country").map(r => r[6].en);

/* ---- red con limite de concurrencia y reintentos (mismo patron que build-places.mjs) ---- */
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

/* ---- Wikidata: nombre en ingles -> QID -> archivo de bandera (propiedad P41 "flag image") ---- */
const FIX = fs.existsSync(path.join(ROOT, "tools", "flag-name-fix.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "flag-name-fix.json"), "utf8")) : {};
async function qidOf(name) {
  if (/^Q\d+$/.test(FIX[name] || "")) return FIX[name];               // alias con QID directo: la busqueda de "Georgia" devolvia el estado de EE. UU.
  const j = await jget(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${enc(FIX[name] || name)}&language=en&type=item&limit=1&format=json`);
  return j && j.search && j.search[0] && j.search[0].id;
}
async function flagFileOf(qid) {
  const j = await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json`);
  const claims = j && j.entities && j.entities[qid] && j.entities[qid].claims;
  const list = (claims && claims.P41) || []; if (!list.length) return null;
  /* P41 puede tener varias banderas historicas (con fecha de fin en P582): se descartan y se prefiere el rango "preferred" */
  const val = c => c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
  const current = c => !(c.qualifiers && c.qualifiers.P582);
  const chosen = list.find(c => c.rank === "preferred" && current(c)) || list.find(c => c.rank === "preferred")
    || list.find(c => c.rank !== "deprecated" && current(c)) || list[list.length - 1];
  return val(chosen);
}
async function credit(fn) {
  try {
    const j = await jget(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=Artist|LicenseShortName&format=json&formatversion=2`);
    const info = ((j.query.pages[0] || {}).imageinfo || [])[0] || {}, md = info.extmetadata || {};
    const strip = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    return { w: info.width || 0, h: info.height || 0, a: strip(md.Artist && md.Artist.value).slice(0, 90), l: strip(md.LicenseShortName && md.LicenseShortName.value), p: "https://commons.wikimedia.org/wiki/File:" + enc(fn) };
  } catch (e) { return null; }
}

async function main() {
  const out = {}, missing = []; let done = 0;
  await Promise.all(COUNTRIES.map(name => (async () => {
    const qid = await qidOf(name); if (!qid) { missing.push(name); return; }
    const fn = await flagFileOf(qid); if (!fn) { missing.push(name); return; }
    const c = await credit(fn);
    out[name] = [fn, (c && c.w) || 0, (c && c.h) || 0, c ? [c.a, c.l, c.p] : null];
    if (++done % 20 === 0) console.log(`  ${done}/${COUNTRIES.length}...`);
  })()));
  const js = "/* Generado por tools/build-flags.mjs - no editar. Bandera (Wikidata P41) y credito (Commons) por pais.\n" +
    " * Las imagenes van empaquetadas en assets/flags/<pais>.svg (tools/bundle-media.py) y las pinta A.adv.renderFlag (js/adventure.js). */\n" +
    "window.AIQ = window.AIQ || {};\nwindow.AIQ.FLAGS = " + JSON.stringify(out) + ";\n";
  fs.writeFileSync(path.join(ROOT, "data", "flags.js"), js);
  console.log(`OK: ${Object.keys(out).length}/${COUNTRIES.length} paises con bandera.`);
  if (missing.length) console.log(`Sin bandera (anade un alias en tools/flag-name-fix.json si el nombre no encaja): ${missing.join(", ")}`);
}
main();
