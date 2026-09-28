/* Lotes de traduccion de los niveles de la Enciclopedia (tools/wiki-tr/tiers-work.json, 25 textos por lote).
 *   node tools/tiers-batch.mjs            cuantos lotes hay y cuales estan hechos
 *   node tools/tiers-batch.mjs 3          muestra el lote 3 (id|nivel|idiomas|texto ingles)
 *   node tools/tiers-batch.mjs check 3    comprueba tools/wiki-tr/tiers-batch-03.json: todos los idiomas, longitud y cierre */
import fs from "node:fs";
const W = JSON.parse(fs.readFileSync("tools/wiki-tr/tiers-work.json", "utf8")), N = 25;
const items = Object.keys(W).sort().flatMap(id => Object.entries(W[id]).map(([t, x]) => ({ id, t, ...x })));
const nb = Math.ceil(items.length / N), [arg, arg2] = process.argv.slice(2);
const file = b => `tools/wiki-tr/tiers-batch-${String(b).padStart(2, "0")}.json`;

if (arg == null) {
  const done = [...Array(nb).keys()].filter(b => fs.existsSync(file(b)));
  console.log(`${items.length} textos en ${nb} lotes; hechos: ${done.join(",") || "ninguno"}`);
} else if (arg === "check") {
  const b = +arg2, B = JSON.parse(fs.readFileSync(file(b), "utf8")), bad = [];
  const MIN = l => (l === "zh" || l === "ja" ? 25 : l === "ko" ? 35 : 60);
  for (const x of items.slice(b * N, b * N + N)) for (const l of x.langs) {
    const t = B[l] && B[l][x.id] && B[l][x.id][x.t];
    if (!t) bad.push(`falta ${l} ${x.id}~${x.t}`);
    else if (t.length < MIN(l)) bad.push(`corto ${l} ${x.id}~${x.t}`);
    else if (!/[.!?。！？」)"]$/.test(t)) bad.push(`sin cierre ${l} ${x.id}~${x.t}`);
  }
  console.log(bad.length ? bad.join("\n") : `lote ${b} completo`);
  process.exit(bad.length ? 1 : 0);
} else {
  const b = +arg;
  for (const x of items.slice(b * N, b * N + N)) console.log(`${x.id}|${x.t}|${x.langs.join(",")}|${x.en}`);
}
