/*
 * Atlas IQ - skins. Cada uno cambia TODO: mapa (shader), paleta de interfaz, tipografia, formas, sonido.
 *   expedicion  cuaderno de campo (papel y tinta)             Fraunces + Bricolage + DM Mono
 *   casino      mesa de cartas + monitor CRT (estilo "Balatro") Pixelify Sans + Silkscreen
 *   plano       cianotipo de ingenieria                         Big Shoulders + Overpass Mono + Architects Daughter
 *   riso        poster serigrafiado con desregistro de tinta    Caprasimo + Courier Prime
 */
window.AIQ = window.AIQ || {};
(function (A) {
  A.MAPSTYLES = A.MAPSTYLES || {};

  A.MAPSTYLES.casino = {
    style: 1, animated: true,
    oceanTop: "#1f5a52", oceanBot: "#0d2c33", shallow: "#39a58c", swirl: ["#0f3b3a", "#1f7a63", "#6b2740"],
    land: ["#f6e6c8", "#ffd9a8", "#ffc4c4", "#c9e8c1", "#bfe0ff", "#f3d6ff", "#fff7e6"],
    line: [0.1, 0.07, 0.16, 0.95], lineW: 2.3, lineOff: [0, 0], lineOffCol: [0, 0, 0, 0], shadow: { off: [3, -4], col: [0.04, 0.02, 0.08, 0.5] },
    grid: "#9fd6c8", gridA: 0.1, tropic: "#ffd98a", ao: 0.1, grain: 0.02, vignette: 0.5, postGrain: 0.045, tint: [1, 1, 1], crt: true,
    ink: "#191325", paper: "#f3eddc", red: "#fe5f55", brass: "#f8b449", hl: "#fe5f55",
  };
  A.MAPSTYLES.plano = {
    style: 2,
    oceanTop: "#0f4fc0", oceanBot: "#072f7e", shallow: "#3f8dff",
    land: ["#1c5fd9", "#2368e2", "#1a56c9", "#2a72ea", "#1e61d5", "#2569df", "#3b7ff2"],
    line: [0.93, 0.97, 1, 0.92], lineW: 1.4, lineOff: [0, 0], lineOffCol: [0, 0, 0, 0],
    grid: "#d3e6ff", gridA: 0.34, tropic: "#ffb36b", ao: 0.05, grain: 0.015, vignette: 0.3, postGrain: 0.03, tint: [1, 1, 1.02],
    ink: "#06285e", paper: "#e6f0ff", red: "#ff7a1a", brass: "#7fd6ff", hl: "#ff7a1a",
  };
  A.MAPSTYLES.riso = {
    style: 3,
    oceanTop: "#2b3fd6", oceanBot: "#1c2aa6", shallow: "#8b9dff",
    land: ["#ffd800", "#ff7eb6", "#f5ecd9", "#17b3a0", "#ff9a4a", "#c7d0ff", "#fffaf0"],
    line: [0.1, 0.14, 0.5, 0.92], lineW: 1.9, lineOff: [2.3, -2.3], lineOffCol: [1, 0.31, 0.12, 0.72],
    grid: "#b7c3ff", gridA: 0, tropic: "#ffd800", ao: 0.0, grain: 0.06, vignette: 0.14, postGrain: 0.09, tint: [1.02, 1, 0.96],
    ink: "#1b2a7a", paper: "#f5ecd9", red: "#ff4f1f", brass: "#ffd800", hl: "#ff4f1f",
  };

  const N = (es, en, fr, pt, de, it) => ({ es, en, fr, pt, de, it });
  A.SKINS = {
    expedicion: { name: N("Expedición", "Expedition", "Expédition", "Expedição", "Expedition", "Spedizione"), swatch: ["#14232b", "#f2e9d6", "#e0492b"], theme: "#0b2530", music: { bpm: 86, sw: 0.3, shift: 0, mod: 1, idx: 2.2 } },
    casino: { name: N("Casino", "Casino", "Casino", "Cassino", "Casino", "Casinò"), swatch: ["#1f7a63", "#fe5f55", "#f8b449"], theme: "#0f3b3a", music: { bpm: 92, sw: 0.34, shift: 0, mod: 1, idx: 2.6 } },
    plano: { name: N("Plano", "Blueprint", "Plan", "Planta", "Bauplan", "Progetto"), swatch: ["#0f4fc0", "#e6f0ff", "#ff7a1a"], theme: "#072f7e", music: { bpm: 104, sw: 0.1, shift: -2, mod: 3, idx: 3.4 } },
    riso: { name: N("Serigrafía", "Riso print", "Sérigraphie", "Serigrafia", "Siebdruck", "Serigrafia"), swatch: ["#2b3fd6", "#ffd800", "#ff4f1f"], theme: "#1c2aa6", music: { bpm: 114, sw: 0.22, shift: 2, mod: 2, idx: 1.0 } },
  };
  A.SKIN_ORDER = ["expedicion", "casino", "plano", "riso"];
  A.skin = "expedicion";

  /* aplica un skin a toda la aplicacion */
  A.applySkin = (id, map) => {
    if (!A.SKINS[id]) id = "expedicion";
    A.skin = id;
    document.documentElement.dataset.skin = id;
    const mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.content = A.SKINS[id].theme;
    if (map && map.setStyle) map.setStyle(A.MAPSTYLES[id] || A.MAPSTYLES.expedicion);
    if (A.audio && A.audio.setSkin) A.audio.setSkin(A.SKINS[id].music);
  };
})(window.AIQ);
