/*
 * Geolite - audita las licencias de las fotos y banderas de la Enciclopedia (data/wiki/img.json, data/flags.js) antes de vender en Steam.
 *   node tools/audit-licenses.mjs           -> docs/licencias-fotos.md (resumen + lista de lo que hay que revisar)
 *   node tools/audit-licenses.mjs --live    ademas vuelve a preguntar a Commons la licencia actual de las fotos "revisar"
 *                                           (necesita red; una licencia puede cambiar o el archivo borrarse despues de bajarlo)
 * Clases: libre (sin condiciones), atribucion (CC BY, OGL...: basta citar autor/licencia/enlace), compartir (CC BY-SA, GFDL:
 * ademas la foto modificada se comparte igual), revisar (sin licencia, NC/ND, "todos los derechos", desconocida).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");

function classify(lic) {
  const l = String(lic || "").trim();
  if (!l) return "revisar";
  if (/(^|[\s-])N[CD]([\s-]|\d|$)/i.test(l) || /all rights|copyrighted|fair use|no free|non-?free/i.test(l)) return "revisar";
  if (/^(public domain|pd\b|cc0|no restrictions|fal\b|free art|attribution$)/i.test(l) || /public domain|^pd/i.test(l)) return /^attribution$/i.test(l) ? "atribucion" : "libre";
  if (/\bBY-SA\b|GFDL|GPL|copyleft/i.test(l)) return "compartir";
  if (/\bCC BY\b|OGL|KOGL|open government|licence ouverte/i.test(l)) return "atribucion";
  return "revisar";
}

const img = JSON.parse(fs.readFileSync(path.join(ROOT, "data/wiki/img.json"), "utf8"));
const flagsSrc = fs.readFileSync(path.join(ROOT, "data/flags.js"), "utf8");
const ctx = { window: { AIQ: {} } }; vm.createContext(ctx); vm.runInContext(flagsSrc, ctx);
const rows = [];
for (const [id, r] of Object.entries(img)) rows.push({ kind: "foto", id, artist: (r[3] || [])[0] || "", lic: (r[3] || [])[1] || "", page: (r[3] || [])[2] || "" });
for (const [id, r] of Object.entries(ctx.window.AIQ.FLAGS || {})) rows.push({ kind: "bandera", id, artist: (r[3] || [])[0] || "", lic: (r[3] || [])[1] || "", page: (r[3] || [])[2] || "" });
for (const r of rows) { r.cls = classify(r.lic); if (r.cls !== "revisar" && !r.artist && !/^libre$/.test(r.cls)) r.noAuthor = true; }

if (LIVE) {
  const todo = rows.filter(r => r.cls === "revisar" && r.page), enc = encodeURIComponent, wait = ms => new Promise(s => setTimeout(s, ms));
  console.log(`Consultando ${todo.length} archivos a Commons...`);
  for (const r of todo) {
    const fn = decodeURIComponent(r.page.split("/wiki/File:")[1] || "");
    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=Artist|LicenseShortName|NonFree|Restrictions&format=json&formatversion=2`, { headers: { "User-Agent": "GeoliteLicenseAudit/1.0 (vault raiders)" } });
      const p = ((await res.json()).query.pages || [])[0] || {}, ii = (p.imageinfo || [])[0];
      if (p.missing || !ii) { r.live = "BORRADO en Commons"; continue; }
      const md = ii.extmetadata || {}; r.live = `${(md.LicenseShortName || {}).value || "?"}${md.NonFree ? " (NonFree)" : ""}${md.Restrictions ? " restr: " + md.Restrictions.value : ""}`;
    } catch (e) { r.live = "sin respuesta"; }
    await wait(250);
  }
}

const by = {}; for (const r of rows) (by[r.cls] = by[r.cls] || []).push(r);
const lic = {}; for (const r of rows) lic[r.lic || "(sin licencia)"] = (lic[r.lic || "(sin licencia)"] || 0) + 1;
const n = c => (by[c] || []).length;
const md = [];
md.push("# Licencias de fotos y banderas (Geolite)", "", `Generado por \`node tools/audit-licenses.mjs\`. ${rows.length} imagenes (${rows.filter(r => r.kind === "foto").length} fotos, ${rows.filter(r => r.kind === "bandera").length} banderas).`, "");
md.push("| Clase | Que exige | Imagenes |", "|---|---|---|");
md.push(`| libre | nada (dominio publico, CC0, FAL...) | ${n("libre")} |`, `| atribucion | citar autor, licencia y enlace (CC BY, OGL, KOGL) | ${n("atribucion")} |`, `| compartir | lo anterior + la foto modificada se comparte con la misma licencia (CC BY-SA, GFDL) | ${n("compartir")} |`, `| **revisar** | sin licencia, NC/ND o desconocida: sustituir o comprobar a mano | **${n("revisar")}** |`, "");
md.push("## Licencias encontradas", "", ...Object.entries(lic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`), "");
md.push("## A revisar", "", "| Tipo | Id | Autor | Licencia | Pagina en Commons | Ahora en Commons |", "|---|---|---|---|---|---|");
for (const r of (by.revisar || [])) md.push(`| ${r.kind} | ${r.id} | ${r.artist.replace(/\|/g, "/")} | ${r.lic || "(vacia)"} | ${r.page} | ${r.live || ""} |`);
const noAuth = rows.filter(r => r.noAuthor);
md.push("", `## Con licencia que exige atribucion pero sin autor registrado (${noAuth.length})`, "", "Basta con el enlace a la pagina de Commons (que trae el autor), pero conviene completar el nombre.", "", ...noAuth.slice(0, 200).map(r => `- ${r.kind} ${r.id} - ${r.lic} - ${r.page}`));
fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs/licencias-fotos.md"), md.join("\n") + "\n");
console.log(`libre ${n("libre")} | atribucion ${n("atribucion")} | compartir ${n("compartir")} | REVISAR ${n("revisar")} | sin autor ${noAuth.length}`);
console.log("-> docs/licencias-fotos.md");
