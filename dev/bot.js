/* Solo para desarrollo: jugador automatico de la Aventura para equilibrar dificultad. Uso (consola): bot2(errKm, deck, asc, seed) -> luego leer window.botLog / window.botDone */
window.bot2 = function (errKm, deck = "explorer", asc = 0, seed, buyN = 6) {
  window.botLog = []; window.botDone = false; window.botStop = false;
  const A = window.AIQ, D = A._debug; A.core.prepareRun(); A.adv.begin({ deck, asc, seed: seed || ("bot-" + errKm + Math.random()) });
  const dest = (lat, lon, brg, km) => { const R = Math.PI / 180, d = km / 6371, la = lat * R, lo = lon * R, b = brg * R; const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b)); const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2)); return { lat: la2 / R, lon: ((lo2 / R + 540) % 360) - 180 }; };
  let lastKey = "", buys = 0, lastShop = "";
  const tick = () => {
    if (window.botStop || window.botDone) return; const S = D.S, run = A.adv.run;
    if (!run) { window.botDone = true; return; }
    try {
      if (S.phase === "intro") { S.skipIntro && S.skipIntro(); }
      else if (S.phase === "asking") {
        const o = S.qs[S.qi], err = errKm * (0.3 + Math.random() * 1.4);
        if (o.t === "c") { const f = D.world.byName[o.key], b = f.polys.reduce((a, c) => ((c.bbox[2] - c.bbox[0]) > (a.bbox[2] - a.bbox[0]) ? c : a)).bbox; D.reveal({ lon: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2 }, S.limit * 0.6); }
        else { let g = dest(o.lat, o.lon, Math.random() * 360, err); D.reveal(g, S.limit * 0.6); }
      }
      else if (S.phase === "reveal") { const nb = document.getElementById("nextBtn"); nb && nb.click(); }
      else if (S.phase === "levelEnd") {
        const t = document.querySelector(".vd h2")?.textContent, key = t + run.act + run.round + run.attempt + run.lives;
        if (key !== lastKey) { window.botLog.push(`A${run.act + 1}R${run.round + 1} ${t} | lives ${run.lives} coins ${run.coins} score ${run.score} perks ${run.perks.join(",")}`); lastKey = key; }
        if (document.getElementById("endBtn")) document.getElementById("endBtn").click();
        else if (document.getElementById("nrBtn")) { window.botLog.push("END " + t + " | " + document.querySelector(".v-stats")?.innerText.replace(/\s+/g, " ")); window.botDone = true; return; }
        else (document.getElementById("nlBtn") || document.getElementById("rtBtn"))?.click();
      }
      else if (S.phase === "shop") {
        const sk = run.act + ":" + run.round + ":" + run.attempt + ":" + run.phase; if (sk !== lastShop) { lastShop = sk; buys = 0; }
        let done = false;
        if (buys < buyN) for (const of of document.querySelectorAll(".offer:not(.sold):not(.life)")) { const btn = of.querySelector(".buy:not(:disabled)"); if (!btn) continue; const c = parseInt((btn.textContent.match(/\d+/) || [0])[0]); if (run.phase === "chest" || run.coins >= c) { buys++; btn.click(); done = true; break; } }
        if (!done) document.getElementById("goRound")?.click();
      }
      else if (S.phase === "title") { window.botDone = true; return; }
    } catch (e) { window.botLog.push("ERR " + e.message); window.botDone = true; return; }
    setTimeout(tick, 30);
  };
  tick(); return "started";
};
