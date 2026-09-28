/*
 * Geolite - busca foto nueva para las entradas cuya imagen ya no existe en Commons o es un logo (solo desarrollo, necesita red).
 *   node tools/fix-photos.mjs id1 id2 ...     (sin ids: las que tools/bundle-media.log marca como FALLO)
 *   node tools/fix-photos.mjs "id=Archivo de Commons.jpg"   (foto elegida a mano; ojo: estatuas con derechos, p.ej. La Sirenita o Cloud Gate, las borra Commons)
 * Actualiza data/wiki/img.json; despues `python tools/bundle-media.py` descarga solo las que falten.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)" };
const IMGF = path.join(ROOT, "data", "wiki", "img.json"), IMG = JSON.parse(fs.readFileSync(IMGF, "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "wiki", "en.json"), "utf8"));
const BAD = /flag|bandera|coat[_ ]of[_ ]arms|emblem|seal[_ ]|logo|locator|location|map[_ .]|blank|symbol|icon[_.]|\.svg|signature|stamp|banner|diagram|montage|poster/i;
const enc = encodeURIComponent, wait = ms => new Promise(r => setTimeout(r, ms));
async function j(url) { for (let i = 0; i < 5; i++) { const r = await fetch(url, { headers: UA }); if (r.ok) return r.json(); if (r.status === 404) return null; await wait(3000 * (i + 1)); } return null; }
async function info(fn) {
  const q = await j(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata|size|url&iiextmetadatafilter=Artist|LicenseShortName&format=json&formatversion=2`);
  const ii = ((((q && q.query && q.query.pages) || [])[0] || {}).imageinfo || [])[0]; if (!ii) return null;
  const md = ii.extmetadata || {}, strip = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return [ii.url.split("?")[0], ii.width, ii.height, [strip(md.Artist && md.Artist.value).slice(0, 90), strip(md.LicenseShortName && md.LicenseShortName.value), "https://commons.wikimedia.org/wiki/File:" + enc(fn)]];
}
let ids = process.argv.slice(2);
if (!ids.length) ids = [...new Set(fs.readFileSync(path.join(ROOT, "tools", "bundle-media.log"), "utf8").split(/\r?\n/).map(l => (l.match(/^(?:FALLO|ERROR) (\S+) /) || [])[1]).filter(Boolean))];
for (const arg of ids) {
  const [id, pick] = arg.split(/=(.*)/s);                               // "id=Archivo.jpg": foto elegida a mano
  if (pick) { const got = await info(pick); console.log(got ? "OK " : "NO EXISTE", id, "->", pick); if (got) IMG[id] = got; continue; }
  const title = EN[id] && EN[id][0]; if (!title) { console.log(id, "sin articulo en en.json"); continue; }
  const old = IMG[id] && decodeURIComponent(IMG[id][0].split("/").pop());
  const s = await j(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc(title.replace(/ /g, "_"))}?redirect=true`);
  const cands = [];
  const main = s && (s.originalimage || s.thumbnail); if (main) cands.push(decodeURIComponent(main.source.split("?")[0].split("/").pop()).replace(/^\d+px-/, ""));
  const ml = await j(`https://en.wikipedia.org/api/rest_v1/page/media-list/${enc(title.replace(/ /g, "_"))}`);
  ((ml && ml.items) || []).filter(x => x.type === "image" && x.title && /\.(jpe?g|png|webp)$/i.test(x.title)).forEach(x => cands.push(x.title.replace(/^[^:]+:/, "")));
  let got = null;
  for (const fn of cands) { if (BAD.test(fn) || fn === old) continue; got = await info(fn); if (got) break; }
  if (got) { IMG[id] = got; console.log("OK ", id, "->", decodeURIComponent(got[0].split("/").pop())); } else { delete IMG[id]; console.log("sin foto", id); }
  await wait(500);
}
fs.writeFileSync(IMGF, JSON.stringify(IMG));
