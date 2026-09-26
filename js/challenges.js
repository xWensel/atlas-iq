/*
 * Atlas IQ - RETOS de la Aventura (v0.10). El crupier "toca la mesa": cada ronda trae retos que cambian el nombre del lugar (letras que tiemblan,
 * faltan, se cambian...) o el propio mapa (borroso, apagon, fronteras falsas, continentes movidos, mundo del reves...). No tocan la puntuacion:
 * solo hacen mas dificil encontrar el sitio. Las reliquias/herramientas los mitigan (ver `fx` en js/relics.js).
 *
 *   A.chal.plan(seed, roundNo, asc)      -> { list:[{id,lv}], boss, combo }   (determinista: la tienda puede anunciar la ronda siguiente)
 *   A.chal.begin(list, fx, opts)         -> activa los retos de la ronda      A.chal.question(o)  -> aplica los retos a la pregunta actual
 *   A.chal.reveal() / A.chal.suspend()   -> el mapa vuelve a la verdad       A.chal.end()        -> limpia todo
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id);
  const L6 = s => { const [es, en, fr, pt, de, it] = s.split("|"); return { es, en, fr, pt, de, it: it || en }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------ catalogo */
  const D = {};
  const def = (id, kind, ico, n, d, counters) => { D[id] = { id, kind, ico, n: L6(n), d: L6(d), counters: counters || [] }; };
  def("shaky", "text", "ch_shaky", "Letras temblorosas|Shaky letters|Lettres tremblantes|Letras trêmulas|Zitternde Buchstaben|Lettere tremanti", "El nombre tiembla y cuesta leerlo.|The name trembles and is hard to read.|Le nom tremble et se lit mal.|O nome treme e é difícil de ler.|Der Name zittert und ist schwer lesbar.|Il nome trema ed è difficile da leggere.", ["steadyhand", "spectacles"]);
  def("missing", "text", "ch_missing", "Tinta borrada|Faded ink|Encre effacée|Tinta apagada|Verblasste Tinte|Inchiostro sbiadito", "Faltan letras del nombre.|Some letters of the name are missing.|Il manque des lettres du nom.|Faltam letras do nome.|Im Namen fehlen Buchstaben.|Mancano lettere del nome.", ["dictionary", "spectacles"]);
  def("swap", "text", "ch_swap", "Letras cambiadas|Swapped letters|Lettres échangées|Letras trocadas|Vertauschte Buchstaben|Lettere scambiate", "Algunas letras están intercambiadas.|Some letters are swapped around.|Certaines lettres sont échangées.|Algumas letras estão trocadas.|Manche Buchstaben sind vertauscht.|Alcune lettere sono scambiate.", ["corrector", "spectacles"]);
  def("mirror", "text", "ch_mirror", "Espejo|Mirror|Miroir|Espelho|Spiegel|Specchio", "El nombre está escrito del revés.|The name is written in mirror image.|Le nom est écrit en miroir.|O nome aparece espelhado.|Der Name ist gespiegelt.|Il nome è scritto a specchio.", ["handmirror"]);
  def("memory", "text", "ch_memory", "Memoria de pez|Goldfish memory|Mémoire de poisson|Memória de peixe|Fischgedächtnis|Memoria di pesce", "El nombre se desvanece: recuérdalo.|The name fades away: remember it.|Le nom s'efface : retiens-le.|O nome desaparece: memorize-o.|Der Name verblasst: merk ihn dir.|Il nome svanisce: ricordalo.", ["sticky", "spectacles"]);
  def("blur", "map", "ch_blur", "Mapa borroso|Blurry map|Carte floue|Mapa desfocado|Verschwommene Karte|Mappa sfocata", "El mapa está desenfocado.|The map is out of focus.|La carte est floue.|O mapa está fora de foco.|Die Karte ist unscharf.|La mappa è sfocata.", ["lens", "divingmask"]);
  def("dark", "map", "ch_dark", "Apagón|Blackout|Panne de courant|Apagão|Stromausfall|Blackout", "El casino se queda a oscuras: solo ves cerca del puntero.|The casino goes dark: you only see near your pointer.|Le casino s'éteint : tu ne vois qu'autour du pointeur.|O cassino fica às escuras: só se vê perto do ponteiro.|Das Casino wird dunkel: du siehst nur um den Zeiger.|Il casinò si spegne: vedi solo vicino al puntatore.", ["miner", "neon"]);
  def("flicker", "map", "ch_flicker", "Luces parpadeantes|Flickering lights|Lumières clignotantes|Luzes piscando|Flackerndes Licht|Luci intermittenti", "Las luces se apagan a ratos y el mapa desaparece.|The lights cut out and the map vanishes for a moment.|Les lumières s'éteignent et la carte disparaît un instant.|As luzes apagam e o mapa some por um instante.|Das Licht fällt aus und die Karte verschwindet kurz.|Le luci si spengono e la mappa sparisce per un attimo.", ["generator"]);
  def("wrongborders", "map", "ch_wrongborders", "Fronteras falsas|False borders|Fausses frontières|Fronteiras falsas|Falsche Grenzen|Confini falsi", "Las fronteras dibujadas mienten.|The drawn borders are lying.|Les frontières dessinées mentent.|As fronteiras desenhadas mentem.|Die gezeichneten Grenzen lügen.|I confini disegnati mentono.", ["customs"]);
  def("noborders", "map", "ch_noborders", "Mapa mudo|Blank map|Carte muette|Mapa mudo|Stumme Karte|Mappa muta", "Sin fronteras en el mapa.|No borders on the map.|Pas de frontières sur la carte.|Sem fronteiras no mapa.|Keine Grenzen auf der Karte.|Nessun confine sulla mappa.", ["theodolite"]);
  def("pangea", "map", "ch_pangea", "Pangea|Pangaea|Pangée|Pangeia|Pangaea|Pangea", "Los continentes se han juntado.|The continents have drifted together.|Les continents se sont rapprochés.|Os continentes se juntaram.|Die Kontinente sind zusammengerückt.|I continenti si sono uniti.", ["plates"]);
  def("shuffle", "map", "ch_shuffle", "Continentes cambiados|Continents swapped|Continents échangés|Continentes trocados|Kontinente vertauscht|Continenti scambiati", "Los continentes han cambiado de sitio.|The continents have changed places.|Les continents ont changé de place.|Os continentes mudaram de lugar.|Die Kontinente haben die Plätze getauscht.|I continenti hanno cambiato posto.", ["plates"]);
  def("flip", "map", "ch_flip", "Mundo del revés|Upside-down world|Monde à l'envers|Mundo de cabeça para baixo|Welt auf dem Kopf|Mondo capovolto", "El Sur está arriba.|South is up.|Le Sud est en haut.|O Sul está em cima.|Der Süden ist oben.|Il Sud è in alto.", ["astrolabe"]);
  def("clouds", "map", "ch_clouds", "Humo de sala|Smoky room|Salle enfumée|Sala esfumaçada|Verrauchter Saal|Sala fumosa", "El humo tapa partes del mapa.|Smoke covers parts of the map.|La fumée cache des parties de la carte.|A fumaça cobre partes do mapa.|Rauch verdeckt Teile der Karte.|Il fumo copre parti della mappa.", ["fan"]);
  def("wind", "rule", "wind", "Vendaval|Gale|Rafale|Vendaval|Sturm|Bufera", "El viento desvía tu pin.|The wind pushes your pin.|Le vent dévie ton épingle.|O vento desvia seu pino.|Der Wind lenkt deinen Pin ab.|Il vento sposta il tuo pin.", ["weathervane"]);
  def("storm", "rule", "storm", "Tormenta|Storm|Tempête|Tempestade|Gewitter|Tempesta", "Solo tienes el 55 % del tiempo.|You only get 55% of the time.|Tu n'as que 55 % du temps.|Você só tem 55% do tempo.|Du hast nur 55 % der Zeit.|Hai solo il 55% del tempo.", ["earplugs"]);
  def("silence", "rule", "silence", "Silencio|Silence|Silence|Silêncio|Stille|Silenzio", "Tus herramientas no funcionan.|Your tools don't work.|Tes outils ne marchent pas.|Suas ferramentas não funcionam.|Deine Werkzeuge funktionieren nicht.|I tuoi strumenti non funzionano.", ["earplugs"]);
  A.CHAL = D;

  const TEXT = ["shaky", "missing", "swap", "mirror", "memory"], MAPC = ["blur", "dark", "flicker", "wrongborders", "noborders", "pangea", "shuffle", "flip", "clouds"], RULE = ["wind", "storm", "silence"];
  const FAMILY = { wrongborders: "b", noborders: "b", pangea: "p", shuffle: "p", blur: "v", dark: "v", flicker: "l", clouds: "v" };
  const BOSS = [
    [{ n: "El Apagón|The Blackout|La panne|O Apagão|Der Stromausfall|Il Blackout", ids: ["dark", "flicker"] }, { n: "Ronda ciega|Blind round|Manche aveugle|Rodada cega|Blinde Runde|Round cieco", ids: ["blur", "missing"] }, { n: "Un solo continente|One continent|Un seul continent|Um só continente|Ein Kontinent|Un solo continente", ids: ["pangea", "swap"] }],
    [{ n: "Falsa alarma|False alarm|Fausse alerte|Falso alarme|Fehlalarm|Falso allarme", ids: ["shuffle", "wrongborders"] }, { n: "Mala visión|Bad eyesight|Mauvaise vue|Vista turva|Schlechte Sicht|Vista offuscata", ids: ["flip", "swap"] }, { n: "Noche cerrada|Dead of night|Nuit noire|Noite fechada|Tiefste Nacht|Notte fonda", ids: ["dark", "shaky", "wind"] }],
    [{ n: "El gran espejo|The great mirror|Le grand miroir|O grande espelho|Der große Spiegel|Il grande specchio", ids: ["flip", "shaky", "blur"] }, { n: "Baraja revuelta|Shuffled deck|Jeu mélangé|Baralho embaralhado|Gemischtes Deck|Mazzo mescolato", ids: ["shuffle", "dark", "missing"] }, { n: "Todo o nada|All or nothing|Quitte ou double|Tudo ou nada|Alles oder nichts|Tutto o niente", ids: ["wrongborders", "flicker", "storm"] }],
  ].map(a => a.map(c => ({ n: L6(c.n), ids: c.ids })));

  /* ------------------------------------------------------------------ plan (determinista por semilla y ronda) */
  const pickFrom = (seed, tag, list, r, per) => A.rng(`${seed}:${tag}:${Math.floor(r / per)}`).shuffle(list.slice())[r % per % list.length];
  A.chal = {
    DEFS: D, TEXT, MAPC, RULE,
    plan(seed, r, asc = 0) {
      const act = Math.floor(r / 4), pos = r % 4, boss = pos === 3, a = Math.min(act, 2);
      const lv = clamp(a + 1 + (asc >= 3 ? 1 : 0), 1, 3);
      let list = [], combo = null;
      if (boss) {
        combo = A.rng(`${seed}:boss:${act}`).pick(BOSS[a]);
        list = combo.ids.map((id, i) => ({ id, lv: clamp(lv + (i === 0 ? 1 : 0), 1, 3) }));
        if (act >= 3) { const rr = A.rng(`${seed}:legend:${r}`), all = rr.shuffle([...TEXT, ...MAPC, ...RULE]); combo = { n: L6("La apuesta final|The final bet|La mise finale|A aposta final|Der letzte Einsatz|La puntata finale"), ids: [] }; list = []; const fam = new Set(); for (const id of all) { const f = FAMILY[id] || id; if (fam.has(f)) continue; fam.add(f); list.push({ id, lv: 3 }); combo.ids.push(id); if (list.length === 3) break; } }
        return { list, boss, combo };
      }
      if (act === 0) { if (pos === 1) list = [{ id: pickFrom(seed, "tx", TEXT.slice(0, 3), r, 3), lv: 1 }]; else if (pos === 2) list = [{ id: pickFrom(seed, "mp", ["blur", "dark", "noborders", "wrongborders", "clouds"], r, 5), lv: 1 }]; }
      else {
        const tx = pickFrom(seed, "tx", TEXT, r, 5), mp = pickFrom(seed, "mp", MAPC, r, 9);
        list = [{ id: tx, lv }, { id: mp, lv }];
        if (act >= 2) { const used = new Set(list.map(c => FAMILY[c.id] || c.id)), pool = A.rng(`${seed}:x:${r}`).shuffle([...MAPC, ...RULE]).filter(id => !used.has(FAMILY[id] || id) && id !== mp); list.push({ id: pool[0], lv }); }
        else if (asc >= 2 && act >= 1) { const pool = A.rng(`${seed}:x:${r}`).shuffle(RULE.slice()); list.push({ id: pool[0], lv: 1 }); }
      }
      return { list, boss, combo };
    },
    info: id => D[id],
    chip(c, small) { const d = D[c.id]; return `<span class="ch-chip k-${d.kind}${small ? " sm" : ""}" title="${A.tx(d.d)}">${A.icon(d.ico, "sm")}<b>${A.tx(d.n)}</b><i class="ch-lv">${"●".repeat(c.lv || 1)}</i></span>`; },
  };

  /* ------------------------------------------------------------------ mitigaciones (suma de los `fx` de las reliquias) */
  A.chal.fx = perks => {
    const fx = { shakeMul: 1, textMul: 1, blurMul: 1, plateMul: 1, blackoutMul: 1, cloudMul: 1, darkR: 1, darkDim: 0, lensR: 0, trueR: 0, peekR: 0, missingRate: 0, unswapMs: 0, unmirror: false, keepName: false, halo: false, flickerWarn: false, windPreview: false, coords: false, guides: false, mag: false, country: false, cloudClear: 0 };
    for (const p of perks) {
      const f = p.fx; if (!f) continue;
      for (const k in f) {
        if (/Mul$/.test(k)) fx[k] *= f[k];                                    // multiplicadores: se acumulan
        else if (k === "missingRate") fx[k] += f[k];                          // letras por segundo: se suman
        else if (k === "unswapMs") fx[k] = fx[k] ? Math.min(fx[k], f[k]) : f[k];
        else if (typeof f[k] === "number") fx[k] = Math.max(fx[k], f[k]);     // radios: el mayor
        else fx[k] = fx[k] || f[k];                                           // indicadores: basta uno
      }
    }
    return fx;
  };

  /* ------------------------------------------------------------------ estado y capas */
  const S = A.chal.state = { list: [], fx: A.chal.fx([]), halve: 1, on: false, suspended: false, timers: [], ov: null, map: null };
  const say = (k, ...a) => { try { A.sfx[k] && A.sfx[k](...a); } catch (e) { /* audio no listo */ } };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); S.timers.push(t); return t; };
  const clearTimers = () => { S.timers.forEach(clearTimeout); S.timers = []; };
  const phaseOk = () => { const g = A.core && A.core.S; return g && g.phase === "asking" && !g.paused; };
  const lvi = c => clamp((c.lv || 1) - 1, 0, 2);
  const par = c => { const i = lvi(c), h = S.halve, fx = S.fx; switch (c.id) {
    case "shaky": return { amp: [1.4, 2.6, 4.2][i] * fx.shakeMul * fx.textMul * h };
    case "missing": return { frac: [0.25, 0.4, 0.55][i] * fx.textMul * h };
    case "swap": return { pairs: Math.max(1, Math.round([1, 2, 3][i] * fx.textMul * h)) };
    case "memory": return { ms: [2600, 1800, 1200][i] / Math.max(0.3, fx.textMul * h) };
    case "blur": return { px: [3.5, 6, 9][i] * fx.blurMul * h };
    case "dark": return { r: [230, 170, 120][i] * fx.darkR / Math.max(0.5, h), a: [0.93, 0.96, 0.98][i] * (1 - fx.darkDim) };
    case "flicker": return { iv: [[5.5, 8.5], [3.8, 6], [2.5, 4.2]][i], len: [250, 450, 700][i] * fx.blackoutMul * h };
    case "wrongborders": return { amp: [0.03, 0.05, 0.075][i] * h };
    case "pangea": return { k: [0.45, 0.65, 0.85][i] * fx.plateMul * h };
    case "shuffle": return { k: [0.5, 0.8, 1][i] * fx.plateMul * h };
    case "clouds": return { cover: [0.18, 0.28, 0.4][i] * fx.cloudMul * h };
    default: return {};
  } };
  const has = id => S.list.some(c => c.id === id);
  const get = id => S.list.find(c => c.id === id);

  /* capas del mapa: desenfoque, oscuridad, halo de luz, apagon y humo. Todo en DOM/CSS con mascaras que siguen al puntero. */
  function ensureOverlay(map) {
    if (S.ov && S.ov.isConnected) return S.ov;
    const ov = document.createElement("div"); ov.id = "chOv";
    ov.innerHTML = `<div class="ch-blur"></div><div class="ch-dark"></div><div class="ch-halo"></div><canvas class="ch-clouds" width="256" height="144"></canvas><div class="ch-flick"></div>`;
    (map && map.fx ? map.fx : $("map")).after(ov); S.ov = ov; return ov;
  }
  const layer = c => (S.ov ? S.ov.querySelector(".ch-" + c) : null);

  /* ------------------------------------------------------------------ humo (canvas de pocos pixeles, escalado sin suavizar) */
  const Smoke = { raf: 0, puffs: [], t: 0 };
  function smokeStart(cover) {
    const cv = layer("clouds"); if (!cv) return; const c = cv.getContext("2d"); Smoke.t = 0; const n = Math.round(6 + cover * 34);
    Smoke.puffs = Array.from({ length: n }, (_, i) => ({ x: Math.random() * 256, y: 10 + Math.random() * 124, r: 14 + Math.random() * 26, vx: (0.6 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1), ph: Math.random() * 6 }));
    cv.classList.add("on");
    const loop = now => {
      Smoke.raf = requestAnimationFrame(loop); if (now - Smoke.t < 55) return; Smoke.t = now;
      c.clearRect(0, 0, 256, 144);
      const px = S.px, hole = S.fx.cloudClear ? { x: (px.x / innerWidth) * 256, y: (px.y / innerHeight) * 144, r: S.fx.cloudClear / innerWidth * 256 } : null;
      for (const p of Smoke.puffs) {
        p.x += p.vx * 0.55; if (p.x < -40) p.x = 296; if (p.x > 296) p.x = -40;
        for (let k = 0; k < 5; k++) {
          const a = p.ph + k * 1.26 + now / 4000 * (k % 2 ? 1 : -1), rx = p.x + Math.cos(a) * p.r * 0.5, ry = p.y + Math.sin(a) * p.r * 0.3, rr = p.r * (0.5 + 0.12 * k);
          c.fillStyle = k % 2 ? "rgba(214,196,235,.55)" : "rgba(160,132,190,.6)"; c.beginPath(); c.arc(Math.round(rx), Math.round(ry), rr, 0, 6.3); c.fill();
        }
      }
      if (hole) { c.save(); c.globalCompositeOperation = "destination-out"; const g = c.createRadialGradient(hole.x, hole.y, 2, hole.x, hole.y, hole.r); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, 256, 144); c.restore(); }
    };
    Smoke.raf = requestAnimationFrame(loop);
  }
  function smokeStop() { cancelAnimationFrame(Smoke.raf); const cv = layer("clouds"); if (cv) { cv.classList.remove("on"); cv.getContext("2d").clearRect(0, 0, 256, 144); } }

  /* ------------------------------------------------------------------ puntero compartido con las capas */
  S.px = { x: innerWidth / 2, y: innerHeight / 2 };
  A.chal.pointer = (x, y) => {
    S.px.x = x; S.px.y = y; const app = $("app"); if (!app) return;
    app.style.setProperty("--px", x + "px"); app.style.setProperty("--py", y + "px");
  };

  /* ------------------------------------------------------------------ texto del nombre */
  const isLetter = ch => /\p{L}/u.test(ch);
  function decorate(o) {
    const el = $("askName"); if (!el || !o) return; clearText();
    const text = A.tx(o.name), tx = S.list.filter(c => D[c.id].kind === "text"), fx = S.fx;
    if (S.suspended || !tx.length) { el.textContent = text; return; }
    let chars = [...text]; const rnd = A.rng(`${S.seed}:t:${S.q}:${text}`), letters = chars.map((c, i) => (isLetter(c) ? i : -1)).filter(i => i >= 0);
    const orig = chars.slice(), gaps = new Set();
    const sw = get("swap");
    if (sw && letters.length >= 3) {
      const p = par(sw); let done = 0, tries = 0;
      while (done < p.pairs && tries++ < 20) { const k = letters[Math.floor(rnd() * (letters.length - 1))]; if (isLetter(chars[k + 1] || " ") && chars[k] !== chars[k + 1] && !gaps.has(k)) { [chars[k], chars[k + 1]] = [chars[k + 1], chars[k]]; gaps.add(k); gaps.add(k + 1); done++; } }
    }
    const miss = get("missing"), hidden = [];
    if (miss && letters.length >= 3) {
      const p = par(miss), n = clamp(Math.round(letters.length * p.frac), 1, Math.max(1, Math.floor(letters.length * 0.6)));
      const pool = rnd.shuffle ? rnd.shuffle(letters.slice()) : letters.slice().sort(() => rnd() - 0.5);
      for (const k of pool) { if (hidden.length >= n) break; hidden.push(k); }
    }
    const sh = get("shaky"), amp = sh ? par(sh).amp : 0;
    el.innerHTML = chars.map((ch, i) => {
      if (ch === " ") return " ";
      const cls = ["lt"]; if (hidden.includes(i)) cls.push("gap");
      const dur = (0.07 + rnd() * 0.09).toFixed(3), del = (-rnd() * 0.3).toFixed(3), ax = ((rnd() - 0.5) * 2 * amp).toFixed(2), ay = ((rnd() - 0.5) * 2 * amp).toFixed(2), ar = ((rnd() - 0.5) * amp * 1.6).toFixed(2);
      return `<b class="${cls.join(" ")}" data-i="${i}" style="${amp ? `--dur:${dur}s;--del:${del}s;--ax:${ax}px;--ay:${ay}px;--ar:${ar}deg;` : ""}"${amp ? ' data-sh="1"' : ""}>${ch}</b>`;
    }).join("");
    if (amp) el.classList.add("ch-shaky");
    if (has("mirror") && !fx.unmirror) el.classList.add("ch-mirror");
    // ayudas: Diccionario (recupera letras una a una) y Corrector (vuelve a colocar las letras)
    if (hidden.length && fx.missingRate > 0) hidden.forEach((k, j) => later(() => { const b = el.querySelector(`.lt[data-i="${k}"]`); if (b) { b.classList.remove("gap"); b.classList.add("fix"); say("chip", 1 + j * 0.3); } }, 900 + (j * 1000) / fx.missingRate));
    if (sw && fx.unswapMs) later(() => { const spans = [...el.querySelectorAll(".lt")]; spans.forEach(b => { const i = +b.dataset.i; if (b.textContent !== orig[i] && !b.classList.contains("gap")) { b.textContent = orig[i]; b.classList.add("fix"); } }); say("chip", 2); }, fx.unswapMs);
    const mem = get("memory");
    if (mem) later(() => { el.classList.add(fx.keepName ? "ch-dim" : "ch-fade"); }, par(mem).ms);
  }
  function clearText() { const el = $("askName"); if (el) el.classList.remove("ch-shaky", "ch-mirror", "ch-fade", "ch-dim"); }

  /* ------------------------------------------------------------------ mapa: deformaciones */
  const CT_NAMES = ["af", "na", "sa", "as", "eu", "oc"];
  function mapSpec(map, o) {
    const spec = { shift: [0, 1, 2, 3, 4, 5, 6].map(() => [0, 0]), rot: [0, 0, 0, 0, 0, 0, 0], wob: 0, lineA: 1, orient: null, ct: 6 }; let any = false;
    const cen = map.contCen, rr = A.rng(`${S.seed}:m:${S.round}`);
    const pg = get("pangea"), sf = get("shuffle");
    if (pg) { const k = par(pg).k; for (let c = 0; c < 6; c++) spec.shift[c] = [(0.05 - cen[c][0]) * k, (0.25 - cen[c][1]) * k]; any = true; }
    else if (sf) {
      const k = par(sf).k, ord = rr.shuffle([0, 1, 2, 3, 4, 5]), perm = []; ord.forEach((c, i) => { perm[c] = ord[(i + 1) % 6]; });
      for (let c = 0; c < 6; c++) { spec.shift[c] = [(cen[perm[c]][0] - cen[c][0]) * k, (cen[perm[c]][1] - cen[c][1]) * k]; spec.rot[c] = (rr() - 0.5) * 0.9 * k; } any = true;
    }
    const wb = get("wrongborders"); if (wb) { spec.wob = par(wb).amp; any = true; }
    if (has("noborders")) { spec.lineA = 0; any = true; }
    const fl = get("flip"); if (fl) { spec.orient = { rot: Math.PI, mx: fl.lv >= 3 ? 1 : 0 }; any = true; }
    if (o) { const f = o.t === "c" ? map.world.byName[o.key] : null; spec.ct = f ? f.ct : map._ctOf(o.lon, o.lat); }
    return any ? spec : null;
  }

  /* ------------------------------------------------------------------ apagon (luces que fallan) */
  function flickerLoop() {
    const fl = get("flicker"); if (!fl || S.suspended || !S.on) return; const p = par(fl), el = layer("flick"); if (!el) return;
    const wait = (p.iv[0] + Math.random() * (p.iv[1] - p.iv[0])) * 1000;
    later(function fire() {
      if (!phaseOk()) return later(fire, 800);
      const dim = S.fx.blackoutMul < 0.9, on = dim ? 0.6 : 0.98, seq = [[on, 70], [0, 90], [on, 60], [0, 110], [on, p.len]];
      const go = i => { if (i >= seq.length || !S.on) { el.style.opacity = 0; say("restore"); return flickerLoop(); } el.style.opacity = seq[i][0]; if (seq[i][0]) say("buzz", i); later(() => go(i + 1), seq[i][1]); };
      if (S.fx.flickerWarn) { const h = layer("halo"); if (h) { h.classList.add("warn"); later(() => h.classList.remove("warn"), 420); } say("warn"); later(() => go(0), 420); } else go(0);
    }, wait);
  }

  /* ------------------------------------------------------------------ API */
  Object.assign(A.chal, {
    /* activa los retos de una ronda; ctx: {seed, round, halve} */
    begin(list, fx, ctx = {}) {
      this.end(); S.list = list.slice(); S.fx = fx || A.chal.fx([]); S.halve = ctx.halve || 1; S.seed = ctx.seed || "s"; S.round = ctx.round || 0; S.on = true; S.suspended = false; S.q = 0;
      S.map = A.core && A.core.map; if (S.map) ensureOverlay(S.map);
    },
    active: () => S.list.slice(),
    has,
    lens() { if (S.suspended) return 0; return has("wrongborders") ? S.fx.trueR : has("noborders") ? S.fx.peekR : 0; },
    /* a cada pregunta: reaplica texto, deformacion del mapa, oscuridad, desenfoque, humo y apagones */
    question(o, qi = 0) {
      const map = S.map = (A.core && A.core.map) || S.map; if (!map || !S.on) return; S.q = qi; S.suspended = false; clearTimers(); ensureOverlay(map);
      decorate(o);
      const spec = map.setDistort ? mapSpec(map, o) : null;
      if (spec) { map.setDistort(spec, 900); say("chal"); } else if (map.clearDistort) map.clearDistort(300);
      if (spec || S.list.some(c => D[c.id].kind === "map")) { const ap = $("app"); ap.classList.remove("ch-glitch"); void ap.offsetWidth; ap.classList.add("ch-glitch"); later(() => ap.classList.remove("ch-glitch"), 600); }
      const ov = S.ov, bl = get("blur"), dk = get("dark"), cl = get("clouds"), app = $("app");
      ov.classList.add("on");
      if (bl) { const p = par(bl); layer("blur").style.setProperty("--bl", p.px.toFixed(1) + "px"); layer("blur").style.setProperty("--lr", (S.fx.lensR ? S.fx.lensR : -60) + "px"); layer("blur").classList.add("on"); } else layer("blur").classList.remove("on");
      if (dk) { const p = par(dk); app.style.setProperty("--dr", p.r + "px"); app.style.setProperty("--da", p.a.toFixed(3)); layer("dark").classList.add("on"); layer("halo").classList.toggle("on", true); layer("halo").classList.toggle("warm", !!S.fx.halo); say("dark"); } else { layer("dark").classList.remove("on"); layer("halo").classList.remove("on"); }
      if (cl) smokeStart(par(cl).cover); else smokeStop();
      layer("flick").style.opacity = 0; flickerLoop();
    },
    /* al revelar: la mesa vuelve a la verdad */
    reveal(ms = 750) {
      const map = S.map; clearTimers(); smokeStop();
      if (map && map.clearDistort) map.clearDistort(ms);
      if (S.ov) { S.ov.classList.remove("on"); for (const c of ["blur", "dark", "halo"]) layer(c).classList.remove("on"); layer("flick").style.opacity = 0; }
      const el = $("askName"); if (el) { el.classList.remove("ch-fade", "ch-dim"); el.querySelectorAll(".gap").forEach(b => b.classList.remove("gap")); }
    },
    /* Interruptor: apaga todo durante esta pregunta */
    suspend() { S.suspended = true; this.reveal(500); const o = A.core && A.core.S.qs[A.core.S.qi]; if (o) decorate(o); },
    /* Astrolabio: endereza el mapa */
    upright() { const map = S.map; if (map && map.setOrient) map.setOrient(false, 900); },
    end() { clearTimers(); smokeStop(); S.on = false; S.list = []; const map = S.map || (A.core && A.core.map); if (map && map.clearDistort) { map.clearDistort(300); map.setLens && map.setLens(null); } if (S.ov) { S.ov.classList.remove("on"); for (const c of ["blur", "dark", "halo"]) layer(c).classList.remove("on"); layer("flick").style.opacity = 0; } clearText(); },
    decorate,
    par, get, lensRadius: () => (S.suspended ? 0 : has("wrongborders") ? S.fx.trueR : has("noborders") ? S.fx.peekR : 0), fxNow: () => S.fx, suspended: () => S.suspended,
  });
})(window.AIQ);
