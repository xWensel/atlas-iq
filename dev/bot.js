/* Solo para desarrollo: jugador automatico de la Aventura para medir dificultad y economia.
   Uso (consola, con ?skipboot): bot2(errKm, deck, asc, seed, buyN, bribe, opt) -> luego leer window.botLog, window.botStats y window.botDone
     errKm: error tipico en km (80 bueno, 300 normal, 600 flojo)   buyN: cartas que compra como mucho en cada visita al Campamento (0 = ninguna)
     bribe: en el Campamento soborna del reto mas barato al mas caro mientras le alcance (los que ya frena un perk suyo no).
       bot2(80, "explorer", 0, null, 0, true) es el jugador que solo soborna
     opt (todo opcional):
       w: 0.12      error extra por reto sin frenar (los dos supuestos: 0.12 y 0.25); un reto que frena un perk suyo pesa w * mit
       mit: 0.25    peso de un reto frenado (A.CHAL[id].counters contra run.perks)
       lvK: 0.25    el nivel del reto cuenta: nivel 1 x0.75, nivel 2 x1, nivel 3 x1.25 (0 = todos igual)
       tMed, tSd    segundos que tarda en responder: mediana (por defecto 6 + errKm / 100) y dispersion lognormal (0.45)
       tPen: 0.5    los retos tambien le frenan: tiempo x (1 + tPen * (error extra))
       late: 1.35, hurry: 1.4   si le falta tiempo responde a la desesperada (error x hurry); si le faltaria mas de late x el reloj, no llega
       cKm: 1200    paises y banderas: acierta dentro con p = exp(-errKm * retos / cKm); si falla, clica fuera a una distancia de su error
       sup: { seguro: 1, cafe: 14, kit: 0 }   Seguro de ronda con provisiones <= n; Cafe doble con >= n doblones o si viene la Tormenta;
                    Refuerzo con >= n doblones (0 = nunca: el bot no usa herramientas). sup: false = no compra suministros
       life: 1      compra la carta de provision con provisiones <= n (0 = nunca)
       keep: 0      doblones que no gasta en sobornos
       tools: false no compra herramientas (no las usa); true = compra la primera carta que pueda, como el bot de antes
       legacy: true el bot de antes (60 % del tiempo, +12 % por reto sin mirar perks, siempre dentro en paises, sin suministros, compra herramientas)
     tanda 17 (medir la curva, el jugador del plan):
       prof: "sabe" | "duda" | "experto" | "novato"   como el modelo de Mates: cada pregunta la SABE (p segun la franja facil/media/dificil, que baja un 1 % por ronda)
                    o no. Si la sabe falla por ~220 km (experto 140, duda 330); si no, por ~1000 (800, 1500). Los paises (banderas, paises) caen dentro con p 0,88 si los
                    sabe; si no, fuera a ~650 km. El novato solo sabe continentes: ~800 km siempre y casi nunca cae dentro de un pais. Con prof, errKm no se usa.
       build: true  compra como un jugador normal: UNA Ventaja (la primera), los amuletos de lo que viene (nivel 2 o mas en las 4 rondas siguientes), la provision y, con lo que
                    sobre, Sangre fria, Cortesia, Corazon, Red, Ficha, Hucha; legendarias (vitrina y cofre) siempre; nunca cambia de mochila (maxPerks, A5 incluida)
       ball: true   usa la Segunda bola (A.adv.reBall: repite si el clic no hace racha, con el error x0,85) y Dividir (#splitAlt: cambia la pregunta dificil si no la sabe y la otra si)
       bet: ["red","double","final","offer"]   las apuestas que acepta en la Barra (por defecto ninguna)
       Siempre: la Sangre fria apaga los retos de puntero y pantalla con racha >= 2.
       Perillas de la curva (A.KN, js/challenges.js): ruleSwap = la regla de A2 ocupa el sitio de un reto (por defecto 1), provAt = la Ascension desde la que se pierde una provision (por defecto 4).
         Para medir otra cosa, ponlas antes de empezar: AIQ.KN.provAt = 3. Modelo: Dividir y la Segunda bola, si; pistas gratis (Soplo, Libro), herramientas y la Hucha, no (el bot las compra pero no las usa).
       Medicion publicada: ver la memoria perks-revision-2026-10 (tabla de victorias por perfil y Ascension, 40-60 expediciones por celda).
     Ejemplos: bot2(300, "explorer", 1, "s1", 1, false, { w: 0.25 })   bot2(300, "explorer", 0, "s2", 2, true, { sup: { cafe: 10 } })   bot2(0, "explorer", 3, "s3", 3, false, { prof: "sabe", build: true, ball: true }) */
const BOT_PROFS = {
  sabe: { pk: [0.95, 0.8, 0.5], known: 220, unk: 1000, t: 6, decay: 0.01 },
  duda: { pk: [0.78, 0.5, 0.22], known: 330, unk: 1500, t: 8, decay: 0.012 },
  experto: { pk: [0.99, 0.92, 0.75], known: 140, unk: 800, t: 5, decay: 0.006 },
  novato: { pk: [1, 1, 1], known: 800, unk: 800, t: 7, decay: 0, ctryIn: 0.12, ctryOut: 800 },
};
window.BOT_PROFS = BOT_PROFS;
window.bot2 = function (errKm, deck = "explorer", asc = 0, seed, buyN = 6, bribe = false, opt = {}) {
  window.botLog = []; window.botDone = false; window.botStop = false;
  const O = Object.assign({ w: 0.12, mit: 0.25, lvK: 0.25, tMed: 6 + errKm / 100, tSd: 0.45, tPen: 0.5, late: 1.35, hurry: 1.4, cKm: 1200, life: 1, keep: 0, tools: false, legacy: false, tick: 30, prof: null, build: false, ball: false, bet: [] }, opt);
  const PR = O.prof ? BOT_PROFS[O.prof] : null;
  O.sup = opt.sup === false || O.legacy ? false : Object.assign({ seguro: 1, cafe: 14, kit: 0 }, opt.sup || {});
  if (O.legacy) { O.mit = 1; O.lvK = 0; O.life = 0; O.tools = true; }
  const A = window.AIQ, D = A._debug, log = s => window.botLog.push(s);
  seed = seed || ("bot-" + errKm + Math.random());
  A.core.prepareRun(); A.adv.begin({ deck, asc, seed });
  const B = window.botStats = { seed, errKm, deck, asc, buyN, bribe, w: O.w, legacy: O.legacy, prof: O.prof, rounds: [], q: 0, timeouts: 0, rushed: 0, cTot: 0, cIn: 0,
    bribes: 0, bribeCoins: 0, sups: { cafe: 0, kit: 0, seguro: 0 }, supCoins: 0, cards: 0, cardCoins: 0, lifeBuys: 0, cleared: 0, coinsEarned: 0, score: 0, won: false, end: null,
    balls: 0, splits: 0, bets: [], perks: [] };
  const dest = (lat, lon, brg, km) => { const R = Math.PI / 180, d = km / 6371, la = lat * R, lo = lon * R, b = brg * R; const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b)); const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2)); return { lat: la2 / R, lon: ((lo2 / R + 540) % 360) - 180 }; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const lognorm = (m, s) => m * Math.exp(s * gauss()), clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  /* precio de un boton: el de la carta de revancha es "<s>7</s>4" (antes se leia 74): cuenta el precio final, no el tachado */
  const num = el => { if (!el) return null; const c = el.cloneNode(true); c.querySelectorAll("s").forEach(s => s.remove()); const m = c.textContent.match(/\d+/g); return m ? +m[m.length - 1] : null; };
  const tag = run => `A${run.act + 1}R${run.round + 1}`;
  /* huecos de la mochila: A.ADV.maxPerks si el juego lo da (con A5 y el Pacto); si no, 5 y el hueco de cada reliquia con slot */
  const maxP = run => (A.ADV.maxPerks ? A.ADV.maxPerks() : 5 + run.perks.reduce((n, id) => n + ((A.RELICS[id] || {}).slot || 0), 0));
  /* retos activos: cada uno suma w (x mit si un perk suyo lo frena, x su nivel). La Tormenta no suma: ya le quita tiempo de verdad.
     El Silencio solo pesa si lleva herramientas (el bot no las usa, pero un jugador si). Sangre fria: con racha >= 2 se apagan los retos de su lista (puntero y pantalla) */
  const penOf = (run, list, S) => {
    let p = 0;
    const calmP = run.perks.map(id => A.RELICS[id]).find(q => q && q.calm), calm = calmP && S && S.streak >= 2 ? calmP.calm : null;
    for (const c of list) {
      const d = A.CHAL[c.id]; if (!d) continue;
      if (O.legacy) { p += O.w; continue; }
      if (c.id === "storm" || (c.id === "silence" && !Object.keys(run.tools).length)) continue;
      if (calm && calm.includes(d.fam)) continue;
      const fr = (d.counters || []).some(id => run.perks.includes(id));
      p += O.w * (fr ? O.mit : 1) * Math.max(0, 1 + O.lvK * ((c.lv || 1) - 2));
    }
    return 1 + p;
  };
  const bigPoly = f => f.polys.reduce((a, c) => ((c.bbox[2] - c.bbox[0]) * (c.bbox[3] - c.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? c : a));
  /* un punto de verdad dentro del pais (el centro de la caja de Chile o de Croacia cae fuera) */
  const inMemo = {};
  const inside = (key, f) => {
    if (inMemo[key]) return inMemo[key];
    const b = bigPoly(f).bbox; let p = { lon: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2 };
    for (let k = 0; k < 400 && !A.geo.inFeature(p.lon, p.lat, f); k++) p = { lon: b[0] + Math.random() * (b[2] - b[0]), lat: b[1] + Math.random() * (b[3] - b[1]) };
    return (inMemo[key] = p);
  };
  /* fuera: desde el centro, el radio del pais y la mitad de su error (el vecino de al lado o mas alla) */
  const outside = (f, err) => { const b = bigPoly(f).bbox, la = (b[1] + b[3]) / 2, r = Math.min((b[3] - b[1]) * 111, (b[2] - b[0]) * 111 * Math.cos(la * Math.PI / 180)) / 2; return dest(la, (b[0] + b[2]) / 2, Math.random() * 360, Math.max(0, r) + err * 0.5); };
  let lastKey = "", buys = 0, lastShop = "", tried = new Set(), last = null, forceKnown = false, swapT = 0;
  const chalIds = run => (run.chal || []).map(c => c.id + ((A.CHAL[c.id].counters || []).some(id => run.perks.includes(id)) ? "*" : ""));   // *: lo frena un perk suyo
  const record = (S, r, pass) => { const lv = S.camp && S.camp.levels && S.camp.levels[0], rn = r.act * 4 + r.round + 1; if (!lv || r.inf || B.rounds.some(x => x.rn === rn && x.att === r.attempt)) return;
    B.rounds.push({ rn, att: r.attempt, pass, score: S.levelScore, target: lv.advance, secs: lv.seconds, chal: r.chal, lives: r.lives, coins: r.coins }); };
  const finish = () => {
    if (last) {
      Object.assign(B, { cleared: last.cleared, coinsEarned: last.coinsEarned, score: last.score, won: last.won, act: last.act, round: last.round, final: last.score + last.cleared * 1000 + (last.won ? 2500 : 0), perks: last.perks });
      if (!last.won && last.phase === "round") record(D.S, { ...last, lives: 0 }, false);   // la ronda que acabo la expedicion (run ya no existe)
      B.end = `rondas ${B.cleared} | puntos ${B.final} | doblones ganados ${B.coinsEarned}${B.won ? " | VICTORIA" : ""}`; log("END " + B.end);
    }
    window.botDone = true;
  };
  /* build: lo que va a pedir la mesa en las proximas rondas, por familia de reto (nivel 2 o mas) */
  const upcoming = run => {
    const r0 = run.act * 4 + run.round, up = {};
    for (let r = r0; r <= Math.min(11, r0 + 3); r++) { try { A.ADV.chalFor(r).list.forEach(c => { const d = A.CHAL[c.id]; if (d && (c.lv || 1) >= 2) up[d.fam] = (up[d.fam] || 0) + 1; }); } catch (e) { /* sin plan */ } }
    return up;
  };
  const OTHER = { boots: 35, shield: 32, heartperk: 30, purse: 6, hoard: 5, almanac: 3, sextant: 3 };
  /* cuanto vale una carta para el jugador normal (0 = no la compra) */
  const worth = (x, run, up) => {
    if (x.s.k === "life") return run.lives < run.maxLives ? (run.lives <= 2 ? 45 : 12) : 0;
    if (x.s.k !== "perk") return 0;
    const p = A.RELICS[x.s.id]; if (!p) return 0;
    const own = run.perks.includes(x.s.id);
    if (p.r === 3) return own ? 0 : 60;
    if (p.ventaja) return run.perks.some(id => (A.RELICS[id] || {}).ventaja) ? 0 : 100;
    if (p.amulet) { const need = up[p.amulet] || 0; return own ? (need && (run.amu || {})[x.s.id] <= 1 ? 30 + need : 0) : need ? 50 + 10 * need : 0; }
    if (own) return 0;
    if (p.calm) return up.puntero || up.pantalla ? 40 : 0;
    if (p.pact) return 0;
    return OTHER[x.s.id] != null ? OTHER[x.s.id] : 2;
  };
  const tick = () => {
    if (window.botStop || window.botDone) return; const S = D.S, run = A.adv.run;
    if (!run) { finish(); return; }
    last = { cleared: run.cleared, coinsEarned: run.stats.coinsEarned, score: run.score, won: !!run.won, act: run.act, round: run.round, attempt: run.attempt, phase: run.phase, inf: run.inf, chal: chalIds(run), lives: run.lives, coins: run.coins, perks: run.perks.slice() };
    try {
      if (S.phase === "intro") { S.skipIntro && S.skipIntro(); }
      else if (S.phase === "asking") {
        const o = S.qs[S.qi], list = A.chal ? A.chal.active() : [], pen = penOf(run, list, S), limit = S.limit;
        let q = null, swapped = false;
        if (PR) {
          q = { known: false, ctry: o.t === "c" };
          const band = Math.max(0, A.adv._bandIdx ? A.adv._bandIdx(o.cid[0]) : 0), r = run.act * 4 + run.round, pk = clampN(PR.pk[band] * (1 - PR.decay * r), 0.02, 0.99);
          q.known = forceKnown || Math.random() < pk; forceKnown = false;
          /* Dividir: en la pregunta dificil, si no la sabe y la otra si, la cambia (un solo uso) */
          const alt = O.ball && A.adv.splitAlt && A.adv.splitAlt(), btn = alt && document.getElementById("splitAlt");
          if (btn && !q.known && Math.random() < clampN(PR.pk[2] * (1 - PR.decay * r), 0.02, 0.99)) { forceKnown = true; swapT = 0.8; B.splits++; btn.click(); swapped = true; }
        }
        if (!swapped) {
          /* cuanto tarda: lognormal alrededor de tMed, mas lento con retos; la Tormenta, el Cafe y los perks de tiempo mueven S.limit */
          let left = limit * 0.6, hurry = 1;
          if (!O.legacy) {
            const need = (PR ? Math.max(1.5, PR.t * (q.known ? 1 : 1.4) + gauss() * 2 + swapT) : O.tMed * Math.exp(O.tSd * gauss())) * (1 + O.tPen * (pen - 1)); swapT = 0;
            if (need <= limit) left = limit - need;
            else if (need <= limit * O.late) { left = Math.min(limit, 0.3); hurry = O.hurry; B.rushed++; }
            else left = null;
          }
          B.q++;
          if (left == null) { B.timeouts++; D.reveal(null, 0); }
          else if (PR) {
            /* un clic: gain < 1 = segundo intento de la Segunda bola (ya sabe donde no) */
            const shot = gain => {
              if (q.ctry) {
                const f = D.world.byName[o.key], pIn = q.known ? (PR.ctryIn != null ? PR.ctryIn : 0.88) : 0;
                if (Math.random() < pIn) return inside(o.key, f);
                return outside(f, 2 * (q.known ? lognorm(150, 0.6) : lognorm(PR.ctryOut || 650, 0.7)) * pen * hurry * gain);
              }
              return dest(o.lat, o.lon, Math.random() * 360, (q.known ? lognorm(PR.known, 0.6) : lognorm(PR.unk, 0.7)) * pen * hurry * gain);
            };
            let pt = shot(1);
            if (q.ctry) { B.cTot++; }
            if (O.ball && A.adv.reBall && run.perks.includes("reball")) {
              for (let k = 0; k < 3; k++) { if (!A.adv.reBall(pt.lon, pt.lat)) break; B.balls++; left = Math.max(0.3, left - Math.max(1, 3 + gauss())); pt = shot(0.85); }
            }
            D.reveal(pt, left);
          }
          else {
            const err = errKm * pen * hurry * (0.3 + Math.random() * 1.4);
            if (o.t === "c") {
              const f = D.world.byName[o.key], pIn = O.legacy ? 1 : Math.exp(-errKm * pen * hurry / O.cKm), hit = Math.random() < pIn;
              B.cTot++; if (hit) B.cIn++;
              D.reveal(hit ? inside(o.key, f) : outside(f, err), left);
            }
            else D.reveal(dest(o.lat, o.lon, Math.random() * 360, err), left);
          }
        }
      }
      else if (S.phase === "reveal") { const nb = document.getElementById("nextBtn"); nb && nb.click(); }
      else if (S.phase === "levelEnd") {
        const t = document.querySelector(".vd h2")?.textContent, key = t + run.act + run.round + run.attempt + run.lives;
        if (key !== lastKey) {
          lastKey = key; log(`${tag(run)} ${t} | lives ${run.lives} coins ${run.coins} score ${run.score} perks ${run.perks.join(",")}`);
          const lv = S.camp && S.camp.levels && S.camp.levels[0], pass = !!lv && S.levelScore >= lv.advance;
          record(S, { act: run.act, round: run.round, attempt: run.attempt - (pass ? 0 : 1), inf: run.inf, chal: chalIds(run), lives: run.lives, coins: run.coins }, pass);   // al fallar, run.attempt ya cuenta la revancha
        }
        if (document.getElementById("endBtn")) document.getElementById("endBtn").click();
        else if (document.getElementById("nrBtn")) { finish(); return; }
        else (document.getElementById("nlBtn") || document.getElementById("rtBtn"))?.click();
      }
      else if (S.phase === "shop") {
        const chest = run.phase === "chest", sk = run.act + ":" + run.round + ":" + run.attempt + ":" + run.phase;
        if (sk !== lastShop) { lastShop = sk; buys = 0; tried = new Set(); }
        const go = (k, el, line) => { tried.add(k); log(`${tag(run)} ${line}`); el.click(); return true; };
        const supBtn = id => { const b = document.querySelector(`[data-sup="${id}"]`); return b && !b.classList.contains("on") ? { b, c: num(b.querySelector(".sp-p")) } : null; };
        const buySup = id => { const s = supBtn(id); if (!s || s.c == null || s.c > run.coins || tried.has("sup:" + id)) return false; B.sups[id]++; B.supCoins += s.c; return go("sup:" + id, s.b, `suministro ${id} ${s.c}`); };
        const offers = [...document.querySelectorAll(".offer:not(.sold)")].map(el => { const s = run.stock && run.stock[+el.dataset.ix], btn = el.querySelector(".buy"); return { el, s, btn, c: chest ? 0 : num(btn) }; })
          .filter(x => x.s && x.btn && !x.btn.disabled && !tried.has("card:" + x.el.dataset.ix));
        const canTake = x => x.s.k === "life" ? run.lives < run.maxLives : x.s.k === "perk" ? (run.perks.length < maxP(run) || (!!A.RELICS[x.s.id].amulet && run.perks.includes(x.s.id))) : O.tools && (!!run.tools[x.s.id] || Object.keys(run.tools).length < 4);
        const buyCard = x => { const k = x.s.k === "life" ? "life" : x.s.k + ":" + x.s.id; if (x.s.k === "life") B.lifeBuys++; else { buys++; B.cards++; } B.cardCoins += x.c || 0; return go("card:" + x.el.dataset.ix, x.btn, `compra ${k}${x.s.fix ? " (revancha)" : ""}${x.s.vit ? " (vitrina)" : ""} ${x.c || 0}`); };
        let done = false;
        /* 1) Seguro de ronda si va justo de provisiones; 2) sobornos; 3) provision; 4) cartas; 5) Cafe y Refuerzo con lo que sobre */
        if (!chest && O.sup && O.sup.seguro && run.lives <= O.sup.seguro) done = buySup("seguro");
        if (!done && !chest && bribe) {
          const own = run.perks, b = [...document.querySelectorAll(".nr-buy")].map(el => ({ el, id: el.dataset.id, c: num(el.querySelector(".nr-p")) }))
            .filter(x => x.c != null && x.c <= run.coins - O.keep && !tried.has("bribe:" + x.id) && !((A.CHAL[x.id] || {}).counters || []).some(p => own.includes(p))).sort((x, y) => x.c - y.c)[0];
          if (b) { B.bribes++; B.bribeCoins += b.c; done = go("bribe:" + b.id, b.el, `soborno ${b.id} ${b.c}`); }
        }
        if (!done && !chest && O.life && run.lives <= O.life) { const x = offers.find(o => o.s.k === "life" && canTake(o) && o.c <= run.coins); if (x) done = buyCard(x); }
        if (!done && buys < buyN) {
          const c = offers.filter(o => o.s.k !== "life" && canTake(o) && (chest || o.c <= run.coins));
          let x;
          if (O.build) { const up = upcoming(run); x = c.map(o => ({ o, v: worth(o, run, up) + (chest || o.s.vit ? 0 : 0) })).filter(e => e.v > 0).sort((a, b) => b.v - a.v)[0]; x = x && x.o; }
          else x = chest ? c.sort((a, b) => ((b.s.k === "perk" ? A.RELICS[b.s.id].r : -1) - (a.s.k === "perk" ? A.RELICS[a.s.id].r : -1)))[0] : c[0];   // en el cofre, la de mas rareza
          if (x) done = buyCard(x);
        }
        if (!done && !chest && O.sup) {
          const next = A.ADV && A.ADV.chalFor ? A.ADV.chalFor(run.act * 4 + run.round).list : [];
          if (O.sup.cafe && (run.coins >= O.sup.cafe || next.some(c => c.id === "storm"))) done = buySup("cafe");
          if (!done && O.sup.kit && Object.keys(run.tools).length && run.coins >= O.sup.kit) done = buySup("kit");
        }
        /* apuestas de la Barra: solo las que acepta (opt.bet). Una sola vez por visita */
        if (!done && !chest && O.bet && O.bet.length && !tried.has("bet")) {
          const el = document.querySelector("#dlg .sup.bet");
          if (el && !el.classList.contains("on") && !el.classList.contains("done") && O.bet.includes(el.dataset.bet)) {
            const k = el.dataset.bet;
            if (k === "red") { const btn = el.querySelector("[data-pick]"), c = num(el.querySelector(".sp-p")); if (btn && c != null && run.coins >= c + 2) { B.bets.push(k); done = go("bet", btn, "apuesta rojo " + c); } else tried.add("bet"); }
            else if (k === "offer") { const btn = el.querySelector("[data-n]"); if (btn) { B.bets.push(k); done = go("bet", btn, "oferta de la casa"); } else tried.add("bet"); }
            else { B.bets.push(k); done = go("bet", el, "apuesta " + k); }
          } else tried.add("bet");
        }
        if (!done) document.getElementById("goRound")?.click();
      }
      else if (S.phase === "title") { finish(); return; }
    } catch (e) { log("ERR " + e.message); finish(); return; }
    setTimeout(tick, O.tick);
  };
  tick(); return "started";
};
