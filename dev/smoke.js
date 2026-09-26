/* Solo para desarrollo: recorre pantallas y modos en un idioma y apunta errores y textos sin traducir.
 * Uso (consola, con ?skipboot):  await smoke("fr")  ->  { errors, missing: [textos en ingles/espanol que se colaron], keys: [claves A.t sin traducir] } */
window.smoke = async function (lang = "fr") {
  const A = window.AIQ, C = A.core, S = C.S, D = A._debug, wait = ms => new Promise(r => setTimeout(r, ms));
  const errors = [], missing = new Set(), keys = new Set();
  const onErr = e => errors.push(String(e.message || e.reason || e)); addEventListener("error", onErr); addEventListener("unhandledrejection", onErr);
  const txOrig = A.tx, tOrig = A.t, TRI = { fr: 0, pt: 1, de: 2, it: 3 };
  A.tx = v => { if (v && typeof v === "object" && !v[lang] && TRI[lang] != null && !(v.en && A.TR[v.en])) missing.add((v.en || v.es || "").slice(0, 90)); return txOrig(v); };
  A.t = (k, p) => { if (!(A.STR[lang] && A.STR[lang][k])) keys.add(k); return tOrig(k, p); };
  D.setLang(lang);
  const step = async (name, fn, ms = 350) => { try { await fn(); } catch (e) { errors.push(name + ": " + e.message); } await wait(ms); };
  // menus
  for (const s of ["home", "classic", "extended", "adventure", "compete", "profile"]) await step("hub " + s, () => A.hub.screen(s));
  await step("codex", () => { A.codex.open(); }, 600); await step("codex close", () => A.codex.close());
  for (const t of ["general", "sound", "video", "data"]) await step("settings " + t, () => { C.openSettings(true); document.querySelector(`[data-seg=settab] [data-v=${t}]`).click(); });
  await step("settings close", () => C.openSettings(false));
  // clasico y extendido: un nivel con dos respuestas
  for (const mode of ["classic", "extended"]) {
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
      if (S.phase === "asking") { const o = S.qs[S.qi]; const f = o.t === "c" && D.world.byName[o.key]; D.reveal(f ? { lon: (f.polys[0].bbox[0] + f.polys[0].bbox[2]) / 2, lat: (f.polys[0].bbox[1] + f.polys[0].bbox[3]) / 2 } : { lon: o.lon, lat: o.lat }, 5); await wait(300); }
      const b = document.querySelector("#layer:not(.hidden) [data-primary]"); if (b) b.click(); await wait(900);
      if (S.phase === "intro") { S.skipIntro && S.skipIntro(); await wait(900); }
    }
  }, 900);
  await step("shop", async () => { const b = document.querySelector("#layer:not(.hidden) [data-primary]"); if (b) b.click(); await wait(900); });
  await step("run menu", async () => { C.runMenu(); await wait(300); });
  await step("leave", async () => { A.adv.leave(); C.showHub("home"); await wait(400); });
  A.tx = txOrig; A.t = tOrig; removeEventListener("error", onErr); removeEventListener("unhandledrejection", onErr);
  return { errors, missing: [...missing], keys: [...keys] };
};
