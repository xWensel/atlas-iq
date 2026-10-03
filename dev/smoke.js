/* Solo para desarrollo: recorre pantallas y modos en un idioma y apunta errores y textos sin traducir.
 * Uso (consola, con ?skipboot):  await smoke("fr")  ->  { errors, checks, missing, keys, long, leaks }
 *   missing: textos que caen al ingles o al espanol (fr, pt, de, it, zh, ko, ja, ru y pl; es-419 cae al espanol a proposito)
 *   keys:    claves A.t sin traducir
 *   long:    aviso (no fallo): cartas (reliquias, herramientas, suministros) con descripcion de mas de 90 caracteres en espanol o de 120 en otro idioma
 *   leaks:   textos de reto (ventanas de No responde, bateria), avisos del crupier y notas que dicen el nombre oculto de la pregunta
 *            (bandera, pista, Adivinanza) o el pais tapado por Sin pais; cada fuga tambien va a errors
 *   errors tambien avisa si cambiar de idioma en el Campamento o en una pregunta pisaria elementos [data-i] que no son textos */
window.smoke = async function (lang = "fr") {
  const A = window.AIQ, C = A.core, S = C.S, D = A._debug, wait = ms => new Promise(r => setTimeout(r, ms));
  const errors = [], checks = [], missing = new Set(), keys = new Set(), long = [], leaks = [];
  const onErr = e => errors.push(String(e.message || e.reason || e)); addEventListener("error", onErr); addEventListener("unhandledrejection", onErr);
  /* indice de cada idioma en A.TR (js/i18n2.js) y en las cadenas "es|en|fr|pt|de|it|es-419|zh|ko|ja|ru|pl" */
  const txOrig = A.tx, tOrig = A.t, p6Orig = A.pick6, TRI = { fr: 0, pt: 1, de: 2, it: 3, zh: 5, ko: 6, ja: 7, ru: 8, pl: 9 }, PIPE = ["es", "en", "fr", "pt", "de", "it", "es-419", "zh", "ko", "ja", "ru", "pl"];
  const trOk = en => { const t = en && A.TR && A.TR[en]; return !!(t && t[TRI[lang]]); };
  A.tx = v => { if (v && typeof v === "object" && TRI[lang] != null && !v[lang] && (v.en || v.es) && !trOk(v.en)) missing.add((v.en || v.es || "").slice(0, 90)); return txOrig(v); };
  A.pick6 = s => { const a = String(s).split("|"); if (TRI[lang] != null && !a[PIPE.indexOf(lang)]) missing.add((a[1] || a[0] || "").slice(0, 90)); return p6Orig(s); };
  A.t = (k, p) => { if (!(A.STR[lang] && A.STR[lang][k]) && !/^\d+$/.test(k)) keys.add(k); return tOrig(k, p); };   // "0", "1"...: indices pisados por setLang (lo cuenta clashAt)
  D.setLang(lang);
  /* cambiar de idioma reescribe todo [data-i] con A.t (js/game.js): si algo usa data-i para otra cosa (indice de carta o de letra), se queda en "0", "1"... */
  const clashSeen = new Set();
  const clashAt = where => { const els = [...document.querySelectorAll("[data-i]")].filter(el => !(el.dataset.i in A.STR.en) && el.offsetParent); const what = [...new Set(els.map(el => el.tagName.toLowerCase() + "." + el.className.split(" ")[0]))].join(", ");
    if (els.length && !clashSeen.has(where + what)) { clashSeen.add(where + what); errors.push(`cambiar de idioma en ${where} pisa ${els.length} elementos [data-i] que no son textos (${what})`); } };
  const step = async (name, fn, ms = 350) => { try { await fn(); } catch (e) { errors.push(name + ": " + e.message); } await wait(ms); };
  // menus
  for (const s of ["home", "classic", "adventure", "daily", "profile", "patch"]) await step("hub " + s, () => A.hub.screen(s));
  await step("codex", () => { A.codex.open(); }, 600); await step("codex close", () => A.codex.close());
  for (const t of ["general", "sound", "video", "data"]) await step("settings " + t, () => { C.openSettings(true); document.querySelector(`[data-seg=settab] [data-v=${t}]`).click(); });
  await step("settings close", () => C.openSettings(false));
  // clasico y extendido: un nivel con dos respuestas
  for (const mode of ["classic"]) {
    for (const camp of A.CAMPAIGNS.filter(x => x.mode === mode).slice(0, 3)) {
      await step(mode + " " + camp.id, async () => {
        S.mode = mode; S.campId = camp.id; S.startLevel = 0; C.newRun(); await wait(400); S.skipIntro && S.skipIntro(); await wait(700);
        for (let i = 0; i < 2 && S.phase === "asking"; i++) { const o = S.qs[S.qi]; D.reveal(o.t === "c" ? { lon: 0, lat: 0 } : { lon: o.lon + 1, lat: o.lat + 1 }, 3); await wait(250); document.getElementById("nextBtn") && document.getElementById("nextBtn").click(); await wait(700); }
      }, 200);
    }
  }
  // aventura: una ronda completa + campamento
  await step("adventure", async () => {
    C.prepareRun(); A.adv.begin({ deck: "explorer", seed: "smoke-" + lang }); await wait(500); S.skipIntro && S.skipIntro(); await wait(900);
    for (let i = 0; i < 12 && S.phase !== "shop" && S.phase !== "levelEnd"; i++) {
      if (S.phase === "asking") { const o = S.qs[S.qi]; if (o.t !== "c" && !checks.length) { const sub = (document.getElementById("askSub") || {}).textContent || ""; checks.push("askSub=" + sub); if (!sub.trim()) errors.push("regresion: la placa de la pregunta no muestra el pais"); } const f = o.t === "c" && D.world.byName[o.key]; D.reveal(f ? { lon: (f.polys[0].bbox[0] + f.polys[0].bbox[2]) / 2, lat: (f.polys[0].bbox[1] + f.polys[0].bbox[3]) / 2 } : { lon: o.lon, lat: o.lat }, 5); await wait(300); }
      const b = document.querySelector("#layer:not(.hidden) [data-primary]") || document.getElementById("nextBtn"); if (b) b.click(); await wait(900);   // en escritorio el ticket sale en el marcador, fuera de #layer
      if (S.phase === "intro") { S.skipIntro && S.skipIntro(); await wait(900); }
    }
  }, 900);
  await step("shop", async () => { const b = document.querySelector("#layer:not(.hidden) [data-primary]"); if (S.phase !== "shop" && b) b.click(); await wait(900); });
  // cartas: reliquias y herramientas de los catalogos; suministros, tal y como salen en el Campamento
  const cards = [];
  await step("cartas", () => {
    for (const id in A.RELICS) cards.push({ k: "perk", id, n: A.RELICS[id].n, d: A.RELICS[id].d });
    const T = (A.ADV && A.ADV.TOOLS) || {}; for (const id in T) cards.push({ k: "tool", id, n: T[id].n, d: T[id].d });
    const sups = [...document.querySelectorAll("#dlg [data-sup]")];
    if (!sups.length) checks.push("suministros: no se vio el Campamento (" + S.phase + ")");
    clashAt("Campamento");
    sups.forEach(b => cards.push({ k: "sup", id: b.dataset.sup, n: (b.querySelector(".sp-t b") || {}).textContent || "", d: (b.querySelector(".sp-t i") || {}).textContent || "" }));
    const max = /^es/.test(lang) ? 90 : 120;
    for (const c of cards) {
      const n = typeof c.n === "string" ? c.n : A.tx(c.n), d = typeof c.d === "string" ? c.d : A.tx(c.d), len = [...d].length;   // A.tx: tambien apunta las cartas sin traducir
      if (len > max) long.push({ k: c.k, id: c.id, n, len, max });
    }
    for (const id in A.CHAL) { A.tx(A.CHAL[id].n); A.tx(A.CHAL[id].d); }                  // las fichas de reto, aunque esta partida no las saque
    const DK = (A.ADV && A.ADV.DECKS) || {}; for (const id in DK) { A.tx(DK[id].n); A.tx(DK[id].d); }
    checks.push(`cartas: ${cards.length} (${cards.filter(c => c.k === "sup").length} suministros), ${long.length} largas (> ${max})`);
  }, 50);
  await step("run menu", async () => { C.runMenu(); await wait(300); });
  await step("leave", async () => { A.adv.leave(); C.showHub("home"); await wait(400); });
  /* fugas: con retos forzados (A.adv._force) y la ruta del Reto diario para empezar en la ronda que toca (banderas, pistas o una normal),
     el Libro de la casa y la Nota del crupier en la mano, se mira durante la pregunta todo lo que se puede leer: ventanas de No responde,
     la bateria, el bocadillo del crupier, la nota del pie y la placa. Nada puede decir el nombre que la pregunta esconde */
  /* sin tildes ni marcas, y recomponiendo el hangul (con NFD a secas el coreano quedaba en jamo y "무스카트는" no contaba como fuga) */
  const norm = s => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLowerCase().replace(/[’ʼ]/g, "'").replace(/\s+/g, " ");
  const CJK = /[\u1100-\u11ff\u3040-\u30ff\u3130-\u318f\u3400-\u9fff\uac00-\ud7af]/, DECL = /^(ru|pl|de|it|pt)/.test(lang), TAIL = A.chal.cjkTail || /$^/;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /* dice el nombre: entero o, en la placa y la nota de la Adivinanza (byWord, donde se tapa palabra a palabra), alguna de sus palabras. 3+ letras
     con limite de palabra (en ruso, polaco, aleman, italiano y portugues tambien la raiz con hasta 5 letras de cola: "Херонеи", "Londynie"); en
     chino, japones y coreano, 2+ caracteres por inclusion, partido por ・, ＝, ·, の y 之 y sin la cola generica (之战, の戦い, 전투...) */
  const says = (text, name, byWord) => {
    const t = norm(text), n = norm(name).trim(); if (!n || n.includes("▮")) return false;
    return (byWord ? n.split(/[\s,()'\-・＝·«»"“”„の之]+/) : [n]).some(w => {
      if (CJK.test(w)) { const c0 = w.replace(/^\d+年/, "").replace(TAIL, ""), c = [...c0].length >= 2 ? c0 : w; return [...c].length >= 2 && t.includes(c); }
      if (w.length < 3) return false;
      const r = DECL && w.length >= 5 && !/\s/.test(w) ? w.slice(0, Math.max(4, w.length - 2)) : w;
      return new RegExp("(^|[^\\p{L}\\p{N}])" + esc(r) + (r !== w ? "\\p{L}{0,5}" : "") + "($|[^\\p{L}\\p{N}])", "u").test(t);
    });
  };
  const SRC = { ventana: ".chx-win", bateria: "#chxBat", retos: "#chOv > :not(.chx-wins)", crupier: "#dealer .dl-bubble", nota: "#factText", placa: "#askName", pais: "#askSub" };
  const FUGAS = [{ tag: "banderas", slot: 2, force: ["hang", "battery", "flagblur"] }, { tag: "pistas", slot: 9, force: ["hang", "battery"] }, { tag: "adivinanza", slot: 0, force: ["hang", "riddle", "nocountry"] }];
  let nQ = 0; const nSrc = {};
  for (const F of FUGAS) await step("fugas " + F.tag, async () => {
    try {
      A.adv._force = F.force; C.prepareRun();
      A.adv.begin({ deck: "explorer", seed: "smoke-fuga-" + lang, route: [F.slot].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(x => x !== F.slot)) });
      const run = A.adv.run; if (!run.perks.includes("almanac")) run.perks.push("almanac"); run.tools.journal = { max: 2, left: 2 };
      await wait(500); S.skipIntro && S.skipIntro(); await wait(900);
      for (let i = 0; i < 2 && S.phase === "asking"; i++) {
        const o = S.qs[S.qi], flag = A.adv.isFlagRound && A.adv.isFlagRound(), riddle = F.force.includes("riddle") && !o.clue && o.t !== "c", hide = [];
        if (o.clue) hide.push([A.tx(o.answer), Object.keys(SRC)]);                                            // la respuesta de la pista
        else if (flag || riddle) hide.push([A.tx(o.name), Object.keys(SRC)]);                                 // el pais de la bandera, el lugar de la Adivinanza
        if (F.force.includes("nocountry") && !o.clue && o.t !== "c") A.tx(o.sub).split(" · ").forEach(c => hide.push([c, ["ventana", "bateria", "retos", "crupier", "pais"]]));   // Sin pais: el pais (las notas de las cartas pueden darlo)
        if (!hide.length) { checks.push(`fugas ${F.tag}: pregunta sin nombre oculto (${o.t === "c" ? "pais" : o.kind})`); }
        const seen = new Map();
        for (let k = 0; k < 10 && S.phase === "asking"; k++) {
          if (k === 4) { A.adv.useTool("journal"); clashAt("una pregunta"); }
          const early = performance.now() - S.t0 - S.pausedAcc < 2500;                  // el Libro de la casa resuelve la Adivinanza a los 3 s (es su efecto): la placa solo cuenta antes
          for (const src in SRC) if (src !== "placa" || early || !riddle) document.querySelectorAll(SRC[src]).forEach(el => { if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return; const t = (el.innerText || "").trim(); if (t) seen.set(src + ":" + t, [src, t]); });
          await wait(170);
        }
        nQ++; for (const [src] of seen.values()) nSrc[src] = (nSrc[src] || 0) + 1;
        for (const [name, srcs] of hide) for (const [src, t] of seen.values()) if (srcs.includes(src) && says(t, name, riddle && (src === "placa" || src === "nota"))) {
          leaks.push({ ronda: F.tag, src, name, text: t.slice(0, 220) }); errors.push(`fuga (${F.tag}, ${src}): "${name}" en "${t.slice(0, 80)}"`);
        }
        const f = o.t === "c" && D.world.byName[o.key]; D.reveal(f ? { lon: (f.polys[0].bbox[0] + f.polys[0].bbox[2]) / 2, lat: (f.polys[0].bbox[1] + f.polys[0].bbox[3]) / 2 } : { lon: o.lon, lat: o.lat }, 5); await wait(300);
        const b = document.getElementById("nextBtn"); if (b) b.click(); await wait(700);
      }
    } finally { A.adv._force = null; if (A.adv.run) A.adv.leave(); C.showHub("home"); await wait(300); }
  }, 300);
  checks.push(`fugas: ${nQ} preguntas; textos mirados: ${Object.entries(nSrc).map(([k, n]) => k + " " + n).join(", ")}`);
  if (!A.PCOUNTRY || Object.keys(A.PCOUNTRY).length < 200) errors.push("regresion: falta A.PCOUNTRY");
  A.tx = txOrig; A.t = tOrig; A.pick6 = p6Orig; removeEventListener("error", onErr); removeEventListener("unhandledrejection", onErr);
  return { errors, checks, missing: [...missing], keys: [...keys], long, leaks };
};
