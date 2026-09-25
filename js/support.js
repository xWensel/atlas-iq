/* Atlas IQ - textos ES/EN, calculo de IQ e insignia. */
window.AIQ = window.AIQ || {};
(function (A) {
  const STR = {
    es: {
      "brand.sub": "Desafío de geografía",
      "title.tag": "¿Sabes dónde queda?",
      "title.p": "Haz clic lo más cerca posible del lugar que te pidan. Cuanto más rápido, más puntos.",
      "mode.classic": "Clásico", "mode.extended": "Extendido",
      "mode.classic.d": "Las preguntas, los tiempos y los puntos exactos del juego original.",
      "mode.extended.d": "Contenido nuevo hecho para Atlas IQ.",
      "mode.classic.note": "Los textos del modo Clásico están en inglés, como en el original.",
      "camp.levels": "{n} niveles", "camp.best": "Mejor {s}", "camp.new": "Sin jugar",
      "title.from": "Empezar en el nivel", "title.pick": "Elige tu expedición",
      "btn.start": "Empezar", "btn.next": "Siguiente", "btn.finish": "Terminar nivel", "btn.go": "¡Vamos!",
      "btn.nextLevel": "Siguiente nivel", "btn.retry": "Reintentar nivel", "btn.newGame": "Menú principal",
      "btn.badge": "Descargar insignia", "btn.resume": "Continuar",
      "intro.level": "Nivel", "intro.q": "{n} lugares", "intro.t": "{s} s por pregunta", "intro.goal": "Meta: {a} pts", "intro.bonus": "Ronda bonus",
      "ask.no": "Nº {n} / {m}",
      "score.level": "Puntos del nivel", "score.need": "Meta", "score.total": "Total", "streak": "Racha ×{n}",
      "lvl": "Nivel {n}/{m} · {name}",
      "diff.easy": "Fácil", "diff.medium": "Medio", "diff.hard": "Difícil", "diff.expert": "Experto",
      "kind.city": "Ciudad", "kind.country": "País", "kind.landmark": "Lugar famoso", "kind.nature": "Naturaleza",
      "kind.water": "Mar, lago o isla", "kind.capital": "Capital", "kind.strait": "Estrecho o cabo", "kind.place": "Lugar",
      "kind.clue": "Pista", "kind.battle": "Batalla", "kind.event": "Suceso",
      "res.timeout": "¡Tiempo!", "res.inside": "¡Dentro!",
      "res.t1": "¡Diana!", "res.t2": "¡Casi!", "res.t3": "Bien apuntado", "res.t4": "Lejos…", "res.t5": "Muy lejos",
      "res.from": "de {name}", "res.border": "del borde de {name}", "res.clicked": "en {t} s",
      "res.dist": "Distancia", "res.speed": "Velocidad", "res.streak": "Racha", "res.total": "Total", "res.was": "Era",
      "stamp.ok": "NIVEL SUPERADO", "stamp.no": "CASI", "stamp.win": "EXPEDICIÓN COMPLETA",
      "lc.p": "{s} pts. Necesitabas {a}.", "lf.p": "Necesitabas {a} pts y conseguiste {s}.", "win.p": "Completaste todos los niveles con {s} pts.",
      "iq.label": "Tu Atlas IQ", "pts": "pts", "km": "km",
      "pause.h": "En pausa", "pause.p": "El mapa se oculta mientras dura la pausa.",
      "tip.in": "Acercar (+)", "tip.out": "Alejar (−)", "tip.home": "Vista inicial (0)", "tip.fs": "Pantalla completa (F)",
      "tip.snd": "Efectos (M)", "tip.mus": "Música (N)", "tip.pause": "Pausa (P)", "tip.lang": "Idioma",
      "tier.0": "Turista despistado", "tier.1": "Viajero novato", "tier.2": "Mochilero", "tier.3": "Explorador",
      "tier.4": "Navegante", "tier.5": "Trotamundos", "tier.6": "Cartógrafo", "tier.7": "Leyenda",
    },
    en: {
      "brand.sub": "Geography challenge",
      "title.tag": "Do you know where it is?",
      "title.p": "Click as close as you can to the place you're asked for. The faster you are, the more you score.",
      "mode.classic": "Classic", "mode.extended": "Extended",
      "mode.classic.d": "The original game's exact questions, timings and scoring.",
      "mode.extended.d": "New content made for Atlas IQ.",
      "mode.classic.note": "",
      "camp.levels": "{n} levels", "camp.best": "Best {s}", "camp.new": "Not played",
      "title.from": "Start at level", "title.pick": "Choose your expedition",
      "btn.start": "Start", "btn.next": "Next", "btn.finish": "Finish level", "btn.go": "Let's go!",
      "btn.nextLevel": "Next level", "btn.retry": "Retry level", "btn.newGame": "Main menu",
      "btn.badge": "Download badge", "btn.resume": "Resume",
      "intro.level": "Level", "intro.q": "{n} places", "intro.t": "{s} s per question", "intro.goal": "Goal: {a} pts", "intro.bonus": "Bonus round",
      "ask.no": "No. {n} / {m}",
      "score.level": "Level score", "score.need": "Goal", "score.total": "Total", "streak": "Streak ×{n}",
      "lvl": "Level {n}/{m} · {name}",
      "diff.easy": "Easy", "diff.medium": "Medium", "diff.hard": "Hard", "diff.expert": "Expert",
      "kind.city": "City", "kind.country": "Country", "kind.landmark": "Famous place", "kind.nature": "Nature",
      "kind.water": "Sea, lake or island", "kind.capital": "Capital", "kind.strait": "Strait or cape", "kind.place": "Place",
      "kind.clue": "Clue", "kind.battle": "Battle", "kind.event": "Event",
      "res.timeout": "Time's up!", "res.inside": "Inside!",
      "res.t1": "Bullseye!", "res.t2": "So close!", "res.t3": "Good aim", "res.t4": "Far off…", "res.t5": "Way off",
      "res.from": "from {name}", "res.border": "from the border of {name}", "res.clicked": "in {t} s",
      "res.dist": "Distance", "res.speed": "Speed", "res.streak": "Streak", "res.total": "Total", "res.was": "It was",
      "stamp.ok": "LEVEL CLEARED", "stamp.no": "SO CLOSE", "stamp.win": "EXPEDITION COMPLETE",
      "lc.p": "{s} pts. You needed {a}.", "lf.p": "You needed {a} pts and scored {s}.", "win.p": "You cleared every level with {s} pts.",
      "iq.label": "Your Atlas IQ", "pts": "pts", "km": "km",
      "pause.h": "Paused", "pause.p": "The map is hidden while the game is paused.",
      "tip.in": "Zoom in (+)", "tip.out": "Zoom out (−)", "tip.home": "Home view (0)", "tip.fs": "Fullscreen (F)",
      "tip.snd": "Effects (M)", "tip.mus": "Music (N)", "tip.pause": "Pause (P)", "tip.lang": "Language",
      "tier.0": "Lost Tourist", "tier.1": "Rookie Traveler", "tier.2": "Backpacker", "tier.3": "Explorer",
      "tier.4": "Navigator", "tier.5": "Globetrotter", "tier.6": "Cartographer", "tier.7": "Legend",
    },
  };
  A.VERSION = "0.1";
  A.lang = "es";
  A.t = (key, p) => {
    let s = (STR[A.lang] && STR[A.lang][key]) || STR.en[key] || key;
    if (p) for (const k in p) s = s.replaceAll("{" + k + "}", p[k]);
    return s;
  };
  A.fmt = n => Math.round(n).toLocaleString(A.lang === "es" ? "es-ES" : "en-US");
  /* texto multilingue: objeto {en,es} o cadena */
  A.tx = v => (v && typeof v === "object" ? v[A.lang] || v.en || "" : v || "");

  /* ------------------------------------------------------------ IQ */
  A.iqTier = iq => (iq < 80 ? 0 : iq < 95 ? 1 : iq < 110 ? 2 : iq < 125 ? 3 : iq < 140 ? 4 : iq < 155 ? 5 : iq < 175 ? 6 : 7);
  /* eff = puntos / maximo posible de lo jugado; prog = niveles superados / niveles totales */
  A.computeIQ = (eff, completed, totalLevels) => {
    const prog = totalLevels ? completed / totalLevels : 0;
    return Math.max(60, Math.min(200, 60 + Math.round(140 * (0.35 * Math.min(1, eff) + 0.65 * prog))));
  };

  /* ------------------------------------------------------------ insignia PNG (estilo pasaporte) */
  A.makeBadge = (iq, tierName, subtitle) => {
    const W = 900, H = 500, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    const INK = "#14232b", PAPER = "#f2e9d6", RED = "#d9432a", BRASS = "#b98a35";
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    // trama de puntos
    c.fillStyle = "rgba(20,35,43,.07)";
    for (let x = 18; x < W; x += 22) for (let y = 18; y < H; y += 22) { c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(22, 22, W - 44, H - 44);
    c.lineWidth = 1; c.strokeRect(32, 32, W - 64, H - 64);
    // rosa de los vientos
    const cx = 230, cy = 250;
    c.save(); c.translate(cx, cy);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 118, 0, 7); c.stroke();
    c.beginPath(); c.arc(0, 0, 104, 0, 7); c.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8, long = i % 4 === 0, mid = i % 2 === 0, r = long ? 118 : mid ? 84 : 62, w = long ? 15 : 8;
      c.fillStyle = long ? (i === 0 ? RED : INK) : mid ? BRASS : INK;
      c.beginPath(); c.moveTo(Math.sin(a) * r, -Math.cos(a) * r);
      c.lineTo(Math.sin(a + 0.28) * w, -Math.cos(a + 0.28) * w); c.lineTo(0, 0); c.lineTo(Math.sin(a - 0.28) * w, -Math.cos(a - 0.28) * w);
      c.closePath(); c.fill();
    }
    c.fillStyle = PAPER; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); c.strokeStyle = INK; c.stroke();
    c.restore();
    // textos
    c.fillStyle = INK; c.textAlign = "left";
    c.font = "500 20px 'DM Mono', monospace"; c.fillText("ATLAS IQ · CARNET DE EXPEDICIÓN", 400, 100);
    c.font = "900 190px 'Fraunces', Georgia, serif"; c.fillText(String(iq), 392, 285);
    c.font = "italic 700 44px 'Fraunces', Georgia, serif"; c.fillStyle = RED; c.fillText(tierName, 400, 345);
    c.font = "500 22px 'DM Mono', monospace"; c.fillStyle = INK; c.fillText(subtitle, 400, 395);
    c.fillStyle = "rgba(20,35,43,.55)"; c.font = "500 16px 'DM Mono', monospace";
    c.fillText(new Date().toLocaleDateString(A.lang === "es" ? "es-ES" : "en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase(), 400, 430);
    // sello
    c.save(); c.translate(760, 150); c.rotate(-0.22); c.strokeStyle = RED; c.fillStyle = RED; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 62, 0, 7); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 54, 0, 7); c.stroke();
    c.font = "800 22px 'DM Mono', monospace"; c.textAlign = "center"; c.fillText("ATLAS", 0, -6); c.fillText("IQ", 0, 20); c.restore();
    return cv;
  };
})(window.AIQ);
