/*
 * Geolite - pasa a chino simplificado (zh-cn) las descripciones de data/wiki/zh.json y zh-s.json (solo desarrollo, necesita red).
 *   node tools/zh-simplify.mjs
 * Titulos y textos ya llegan en zh-cn (variant/varianttitles), pero la descripcion corta sale de Wikidata tal cual la escribio
 * cada editor, a veces en tradicional. Se convierte con el conversor de la propia Wikipedia china (action=parse&variant=zh-cn).
 * Idempotente: se puede relanzar tras add-langs / add-codex / add-places.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "data", "wiki");
const UA = { "User-Agent": "Geolite-builder/1.0 (https://github.com/xWensel/geolite; educational geography game; polite batch job)", "Content-Type": "application/x-www-form-urlencoded" };
const Z = JSON.parse(fs.readFileSync(path.join(WIKI, "zh.json"), "utf8")), ZS = JSON.parse(fs.readFileSync(path.join(WIKI, "zh-s.json"), "utf8"));
const CJK = /[㐀-鿿]/, UNSAFE = /[[\]{}<>|'~=&]/;          // lo que el analizador de wikitexto podria interpretar: se deja como esta
const descs = [...new Set(Object.values(Z).map(r => r[1]).filter(d => d && CJK.test(d) && !UNSAFE.test(d)))];
console.log("descripciones a revisar:", descs.length);

const decode = s => s.replace(/<[^>]*>/g, "").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
const map = {};
for (let i = 0; i < descs.length; i += 80) {
  const part = descs.slice(i, i + 80), text = part.map((d, k) => `QQ${k}QQ ${d}`).join("\n\n");
  let j = null;
  for (let t = 0; t < 5 && !j; t++) {
    try {
      const r = await fetch("https://zh.wikipedia.org/w/api.php", { method: "POST", headers: UA, body: new URLSearchParams({ action: "parse", contentmodel: "wikitext", text, variant: "zh-cn", prop: "text", disablelimitreport: "1", format: "json", formatversion: "2" }) });
      if (r.ok) j = await r.json(); else await new Promise(r2 => setTimeout(r2, 5000 * (t + 1)));
    } catch (e) { await new Promise(r2 => setTimeout(r2, 5000 * (t + 1))); }
  }
  if (!j || !j.parse) { console.log("lote sin respuesta:", i); continue; }
  const html = j.parse.text, re = /QQ(\d+)QQ\s*([\s\S]*?)(?=QQ\d+QQ|$)/g; let m;
  while ((m = re.exec(html))) { const src = part[+m[1]], out = decode(m[2]); if (src && out && out !== src) map[src] = out; }
  process.stdout.write(`\r${Math.min(i + 80, descs.length)}/${descs.length}`);
  await new Promise(r => setTimeout(r, 600));
}
let n = 0, s = 0;
for (const id in Z) { const d = Z[id][1], c = map[d]; if (!c) continue; Z[id][1] = c; n++; if (ZS[id] && ZS[id].startsWith(d)) { ZS[id] = c + ZS[id].slice(d.length); s++; } }
fs.writeFileSync(path.join(WIKI, "zh.json"), JSON.stringify(Z)); fs.writeFileSync(path.join(WIKI, "zh-s.json"), JSON.stringify(ZS));
console.log(`\nconvertidas ${n} descripciones (${Object.keys(map).length} distintas), ${s} notas cortas`);
Object.entries(map).slice(0, 6).forEach(([a, b]) => console.log("  ", a, "->", b));
