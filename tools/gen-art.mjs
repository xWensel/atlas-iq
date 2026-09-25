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
const STYLE = "chunky 16-bit pixel art illustration, Balatro-like roguelike card game art that fuses CASINO and GEOGRAPHY: green felt printed with world maps and latitude longitude lines, globe-engraved poker chips, playing cards with map faces and compass-rose pin mountain palm suits, dice, roulette and slot machines showing landmarks, warm neon marquee bulbs, bold dark purple outlines, flat cel shading, limited saturated palette of teal green, coral red, warm gold and deep violet, crisp pixels, no text, no letters, no watermark";
const SCENE = "wide panoramic scene, dramatic lighting, rich detail";

const W = [768, 480], SQ = [512, 512];
const A = (id, prompt, size = SQ, seed = 11) => ({ id, prompt, size, seed });
const M = [
  /* jefes: "la casa" al otro lado de la mesa */
  A("boss_wind", `a howling gale blowing map-faced playing cards, globe poker chips and torn atlas pages off a card table on a ship deck over rough sea, huge white wind swirls, ${SCENE}`, W),
  A("boss_storm", `lightning striking a giant slot machine whose reels show landmarks and globes, floating on a dark stormy sea, jackpot bulbs, heavy rain, ${SCENE}`, W),
  A("boss_strict", `a stern cartographer pit boss behind a felt table printed with latitude lines, giant golden scales weighing a globe against stacks of poker chips, huge ruler and brass dividers, spotlight, ${SCENE}`, W),
  A("boss_silence", `a roulette wheel that is a spinning world globe frozen in eerie silence at night, muted giant golden bell with a red cross, slot machines showing pins, purple moonlight, ${SCENE}`, W),
  A("boss_fog", `a lighthouse made of neon marquee bulbs guiding ships over a sea of green felt printed with a map, thick fog, globe poker chips glowing on a pier, ${SCENE}`, W),
  /* actos y escenas */
  A("act_0", `sunrise over hills of green felt printed with a world map graticule, a road paved with globe poker chips, a flag with a compass rose suit, dice and a brass compass, ${SCENE}`, W),
  A("act_1", `a caravel with map-faced playing card sails on a sea of green felt with meridian lines heading to the torn edge of the world map, a roulette globe as the moon, twilight, ${SCENE}`, W),
  A("act_2", `ancient moai statues wearing jester hats among glowing slot machines that show landmarks in a moonlit jungle, globe poker chips scattered around, ${SCENE}`, W),
  A("act_3", `a glowing world globe crowned with gold between four giant constellations shaped like a compass, a map pin, a mountain and a palm tree card suits, marquee bulbs, aurora, starry night, ${SCENE}`, W),
  A("camp", `an explorer's high-roller camp at night: a striped tent, a green felt table printed with a world map with pins, map-faced playing cards, globe poker chips, campfire and lantern, marquee bulbs, ${SCENE}`, W),
  A("chest", `a jackpot: an overflowing treasure chest spilling globe-engraved poker chips, dice, map playing cards, a compass and gold coins, slot machine lights and golden rays, ${SCENE}`, W),
  A("win", `a golden laurel wreath around a glowing globe, a royal flush of map-faced playing cards fanned out, confetti of tiny globes and chips, jackpot sunburst, ${SCENE}`, W),
  A("lose", `a cracked brass compass, a torn treasure map and scattered losing map-faced playing cards on green felt printed with a map, a single die showing one pip, dim lamp, sad mood, ${SCENE}`, W),
  A("hub_hero", `casino table seen from above: green felt printed as a world map with latitude and longitude lines, globe-engraved poker chip stacks, a fan of playing cards with compass suits, dice, a brass compass and spyglass, warm neon glow, ${SCENE}`, W),
  /* Enciclopedia: ilustracion de respaldo por tipo (cuando no hay foto) */
  ...[["city", "a dense old city skyline at dusk with lit windows"], ["capital", "a grand capital building with a golden dome and flags"], ["country", "a tall flagpole with a big red waving flag over a landscape"],
    ["landmark", "a majestic ancient temple with columns"], ["nature", "snowy mountain peaks with a sun and a forest"], ["water", "a deep blue ocean with big waves and a small island"],
    ["strait", "a narrow sea strait between two green coasts seen from above"], ["battle", "crossed swords and shields on a battlefield with banners"],
    ["event", "an old calendar page with a golden star and a wax seal"], ["person", "a marble bust of a historical figure with a laurel wreath on a pedestal"],
    ["curiosity", "a glowing lightbulb with sparkles and a magnifying glass"], ["place", "a big red map pin on a folded map"]]
    .map(([t, d]) => A("type_" + t, `${d}, shown on a green felt table printed with a world map, like the illustration on a casino playing card, framed, warm neon glow`, SQ, 5)),
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
