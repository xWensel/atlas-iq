/*
 * Atlas IQ - generador de ilustraciones (solo desarrollo, NO forma parte del juego).
 * (Solo escenas e ilustraciones grandes: los iconos pequenos son vectoriales propios, js/icons.js, y quedan mas coherentes.)
 * Pide a Pollinations imagenes en un estilo unico (pixel art de carta roguelike, paleta Casino) y las guarda en assets/gen/.
 * La clave se lee de POLLINATIONS_KEY (fichero .env.local, ignorado por git y por Vercel). Nunca va en el codigo del juego.
 *
 *   node tools/gen-art.mjs            genera lo que falte
 *   node tools/gen-art.mjs boss_wind  regenera solo esos ids (borra antes el archivo si quieres otra semilla)
 *   node tools/gen-art.mjs --list     lista los ids
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets", "gen");
try { for (const l of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^(\w+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; } } catch (e) { /* sin .env.local */ }
const KEY = process.env.POLLINATIONS_KEY;

/* ---------- estilo comun: todo debe parecer del mismo juego ---------- */
const STYLE = "chunky 16-bit pixel art illustration, roguelike card game art, bold dark purple outlines, flat cel shading, limited saturated palette of teal green, coral red, warm gold and deep violet, playful casino-table mood, crisp pixels, no text, no letters, no watermark";
const SCENE = "wide panoramic scene, dramatic lighting, rich detail";

const W = [768, 480], SQ = [512, 512];
const A = (id, prompt, size = SQ, seed = 11) => ({ id, prompt, size, seed });
const M = [
  /* jefes */
  A("boss_wind", `a howling gale battering a tiny wooden caravel on rough sea, huge white wind ribbons and swirls, flying scraps of old maps, ${SCENE}`, W),
  A("boss_storm", `a monstrous thunderstorm cloud with forked lightning over a dark sea, a tiny ship below, heavy rain, ${SCENE}`, W),
  A("boss_strict", `enormous golden balance scales and a cartographer's ruler and dividers on old parchment, stern strict mood, rays of light, ${SCENE}`, W),
  A("boss_silence", `a giant golden bell struck silent under a purple moonlit night, muffled sound waves fading, a red cross over it, ${SCENE}`, W),
  A("boss_fog", `a striped red and white lighthouse in thick sea fog, light beams cutting the mist, calm dark water, ${SCENE}`, W),
  /* actos y escenas */
  A("act_0", `sunrise over green hills with a winding dirt road, a brass compass and a folded treasure map, explorer's first day, ${SCENE}`, W),
  A("act_1", `a caravel sailing at twilight toward the torn edge of the world map, sea serpent tentacle, first stars, ${SCENE}`, W),
  A("act_2", `ancient moai statues in a moonlit jungle, glowing vines, mysterious ruins, ${SCENE}`, W),
  A("act_3", `a starry night with constellations drawn over a glowing globe crowned with gold, aurora, legendary finale, ${SCENE}`, W),
  A("camp", `an explorer's night camp with a red tent, crackling campfire, lantern, journal and a map on a log, mountains and stars behind, ${SCENE}`, W),
  A("chest", `an overflowing open treasure chest of gold coins and gems with a crown, golden light rays, sparkles, ${SCENE}`, W),
  A("win", `a golden laurel wreath around a glowing world globe, confetti, triumphant sunburst, ${SCENE}`, W),
  A("lose", `a cracked brass compass and a torn treasure map lying on wet dark ground in the rain, a small skull, sad mood, ${SCENE}`, W),
  A("hub_hero", `an adventurer's table seen from above, big old world map, brass compass, spyglass, dice and gold coins on green felt, ${SCENE}`, W),
  /* Enciclopedia: ilustracion de respaldo por tipo (cuando no hay foto) */
  ...[["city", "a dense old city skyline at dusk with lit windows"], ["capital", "a grand capital building with a golden dome and flags"], ["country", "a tall flagpole with a big red waving flag over a landscape"],
    ["landmark", "a majestic ancient temple with columns"], ["nature", "snowy mountain peaks with a sun and a forest"], ["water", "a deep blue ocean with big waves and a small island"],
    ["strait", "a narrow sea strait between two green coasts seen from above"], ["battle", "crossed swords and shields on a battlefield with banners"],
    ["event", "an old calendar page with a golden star and a wax seal"], ["person", "a marble bust of a historical figure with a laurel wreath on a pedestal"],
    ["curiosity", "a glowing lightbulb with sparkles and a magnifying glass"], ["place", "a big red map pin on a folded map"]]
    .map(([t, d]) => A("type_" + t, `${d}, framed illustration, dark purple background`, SQ, 5)),
];

if (process.argv.includes("--list")) { console.log(M.map(m => m.id).join("\n")); process.exit(0); }
if (!KEY) { console.error("Falta POLLINATIONS_KEY (pon la clave en atlas-iq/.env.local)"); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2).filter(a => !a.startsWith("--"));
const todo = M.filter(m => (!only.length || only.includes(m.id)) && (only.length || !fs.existsSync(path.join(OUT, m.id + ".jpg"))));
console.log(`${todo.length} imagenes por generar`);

async function gen(m, tries = 4) {
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(m.prompt + ", " + STYLE)}?model=flux&width=${m.size[0]}&height=${m.size[1]}&seed=${m.seed}&nologo=true&private=true`;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { Authorization: "Bearer " + KEY } });
      if (r.ok && /image/.test(r.headers.get("content-type") || "")) { fs.writeFileSync(path.join(OUT, m.id + ".jpg"), Buffer.from(await r.arrayBuffer())); return true; }
      console.log(`  ${m.id}: HTTP ${r.status}, reintento`);
    } catch (e) { console.log(`  ${m.id}: ${e.message}, reintento`); }
    await new Promise(r => setTimeout(r, 3000 * (i + 1)));
  }
  return false;
}
let idx = 0, ok = 0;
await Promise.all(Array.from({ length: 3 }, async () => { while (idx < todo.length) { const m = todo[idx++]; const g = await gen(m); if (g) { ok++; console.log("ok", m.id); } else console.log("FALLO", m.id); } }));

/* manifiesto: el juego solo pide las imagenes que existen */
const have = M.map(m => m.id).filter(id => fs.existsSync(path.join(OUT, id + ".jpg")));
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(have));
console.log(`${ok}/${todo.length} generadas; manifiesto con ${have.length}`);
