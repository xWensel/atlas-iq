/*
 * Geolite - regenera data/carretes.js (el carrete de cada ronda de la Aventura) desde el reparto automatico de js/adventure.js.
 *   npx electron tools/build-carretes.cjs
 * Reparto (v0.20): cada tema se divide entre SUS rondas por nivel 1-10 de su categoria (data/niveles.js), sin tamano fijo y sin dejar nada fuera:
 * con dos rondas, la primera lleva los niveles 1-5 y la segunda los 6-10. La 12 no tiene carrete propio (saca de todo el banco); lo que se ponga
 * a mano en su lista sale primero como su pregunta dificil.
 * OJO: pisa las listas editadas a mano. Para mover una pregunta concreta, edita data/carretes.js directamente (ids de data/places.js;
 * "c:<Pais>" para paises y banderas, "clue:<id>" para las pistas de data/pistas.js). Abre el juego con Electron sin ventana (file://).
 */
const { app, BrowserWindow } = require("electron");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const NAMES = ["Capitales", "Monumentos I", "Banderas I", "Países (jefe)", "Ciudades I", "Historia", "Naturaleza", "Banderas II (jefe)", "Ciudades II", "Apodos y pistas", "Monumentos II", "De todo un poco (jefe): saca de todo el banco; lo que se ponga aqui sale primero como su dificil"];
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, webPreferences: { offscreen: true, backgroundThrottling: false } });
  await w.loadFile(path.join(ROOT, "index.html"));
  for (let i = 0; i < 60; i++) { if (await w.webContents.executeJavaScript("!!(window.AIQ && AIQ.core && AIQ.core.world && AIQ.adv && AIQ.adv._autoAssign)")) break; await new Promise(r => setTimeout(r, 500)); }
  const lists = await w.webContents.executeJavaScript("AIQ.adv._autoAssign()");
  const out = `/* Carretes de la Aventura (v0.20): TODAS las preguntas del banco repartidas entre las 12 rondas, cada una en las rondas de su tema.
 * Se pueden editar a mano (ids de data/places.js; "c:<Pais>" para paises y banderas, "clue:<id>" para las pistas de data/pistas.js).
 * Dentro de cada ronda salen 3 del 60 % mas facil, 1 del 20 % medio y 1 del 20 % mas dificil (segun el nivel de data/niveles.js).
 * Reparto de cero: npx electron tools/build-carretes.cjs */
window.AIQ = window.AIQ || {};
window.AIQ.CARRETES = [
${lists.map((l, i) => `  /* ronda ${i + 1} · ${NAMES[i]} (${l.length}) */ ${JSON.stringify(l)}`).join(",\n")}
];
`;
  fs.writeFileSync(path.join(ROOT, "data", "carretes.js"), out);
  console.log("data/carretes.js:", lists.map((l, i) => `R${i + 1}=${l.length}`).join(" "));
  app.quit();
});
