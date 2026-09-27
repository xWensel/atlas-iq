/* Renombra los mp3 de assets/music (NN.mp3 o NN-slug.mp3) a NN-slug.mp3, con el nombre
 * descriptivo real de cada pista (el mismo "name" que lleva en el motor generativo). */
"use strict";
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "..", "assets", "music");

const NAMES = [
  "Lounge Nocturno", "Ragtime Roulette", "Bossa de Medianoche", "Samba del Crupier", "Blues del Tapete",
  "Vals Real", "Funk Jackpot", "Big Band All-In", "Mambo Royale", "Cash Out",
  "Banca al Día", "Apuesta en Vivo", "Pleno al Quince", "Handicap Asiático", "Funk da Sorte",
  "House del Crupier", "Tecno del Bote", "Merengue del Premio", "Cha-Cha del Casino", "Ranchera de la Suerte",
  "Corrido del Apostador",
];

function slug(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

for (const f of fs.readdirSync(dir)) {
  const m = f.match(/^(\d{2})(?:-.*)?\.mp3$/);
  if (!m) continue;
  const i = parseInt(m[1], 10) - 1;
  if (!NAMES[i]) continue;
  const dest = path.join(dir, m[1] + "-" + slug(NAMES[i]) + ".mp3");
  const src = path.join(dir, f);
  if (src !== dest) fs.renameSync(src, dest);
}
console.log(fs.readdirSync(dir).sort().join("\n"));
