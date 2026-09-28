/*
 * Geolite - perfil del jugador (v0.6): estadisticas, records, progreso de la Aventura y logros.
 * Todo vive en localStorage; la capa `A.steam` (si existe) recibe los logros para Steamworks.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const KEY = "atlasiq.profile.v1";

  const defaults = () => ({
    v: 1, id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), name: "", created: Date.now(),
    stats: { plays: 0, questions: 0, km: 0, hits: 0, bulls: 0, bestStreak: 0, perfectRounds: 0, timeouts: 0, seconds: 0, inside: 0 },
    records: {}, ach: {}, boards: {}, daily: {},
    adv: { runs: 0, wins: 0, bestScore: 0, bestRound: 0, coins: 0, asc: 0, boss: 0, decks: { explorer: 1 }, seen: {} },
    medals: {},
  });
  let P = defaults();
  try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && d.v === 1) { P = Object.assign(defaults(), d); P.stats = Object.assign(defaults().stats, d.stats); P.adv = Object.assign(defaults().adv, d.adv); } } catch (e) { /* perfil nuevo */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* sin almacenamiento */ } };

  A.profile = {
    get: () => P, save,
    setName(n) { P.name = String(n || "").replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16); save(); return P.name; },
    /* records[board] = mejor puntuacion; devuelve true si es nuevo record */
    record(board, score) { const old = P.records[board] || 0; if (score > old) { P.records[board] = score; save(); return true; } return false; },
    medal(id, m) { const rank = { bronze: 1, silver: 2, gold: 3 }; if ((rank[m] || 0) > (rank[P.medals[id]] || 0)) { P.medals[id] = m; save(); } },
  };

  /* ---------------------------------------------------------------- logros */
  const AD = (id, ico, es, en, de, dn, ev, test, secret) => ({ id, ico, name: { es, en }, desc: { es: de, en: dn }, ev, test, secret: !!secret });
  const S = () => P.stats, ADV = () => P.adv;
  const won = id => !!P.records["classic:" + id + ":win"];
  const classicIds = () => (A.CAMPAIGNS || []).filter(c => c.mode === "classic").map(c => c.id);
  /* Ordenados de menos a mas dificil y de menos a mas horas de juego (asi salen en el perfil y en docs/steam/achievements.csv);
   * los secretos, al final. El orden no importa a Steam: el "API name" es el id. Todos comprobados como alcanzables (v0.34). */
  A.ACH = [
    /* ---- I. primeros pasos (minutos) ---- */
    AD("first_pin", "📍", "Primer pin", "First pin", "Responde tu primera pregunta.", "Answer your first question.", "q", () => S().questions >= 1),
    AD("adv_start", "🧳", "Salir de casa", "Setting out", "Empieza una Aventura.", "Start an Adventure.", "adv", c => c.kind === "start"),
    AD("bull_1", "🎯", "Diana", "Bullseye", "Acierta a menos de 25 km (o dentro del país).", "Land within 25 km (or inside the country).", "q", c => c.bull),
    AD("codex_10", "📖", "Primeras páginas", "First pages", "10 tarjetas en la Enciclopedia.", "10 Encyclopedia cards.", "codex", c => c.u >= 10),
    AD("adv_clear1", "🥾", "Primer campamento", "First camp", "Supera una ronda de la Aventura.", "Clear an Adventure round.", "adv", c => c.kind === "clear"),
    AD("adv_blind", "🕶️", "A ciegas", "Blindfolded", "Supera una ronda sin usar herramientas.", "Clear a round without using tools.", "adv", c => c.kind === "clear" && c.tools === 0),
    AD("streak_5", "🔥", "En racha", "On a roll", "Racha de 5 aciertos.", "5-hit streak.", "q", () => S().bestStreak >= 5),
    AD("speed", "⚡", "Relámpago", "Lightning", "Acierta bien en menos de 2 segundos.", "Nail it in under 2 seconds.", "q", c => c.ratio >= 0.75 && c.used != null && c.used <= 2),
    /* ---- II. primera sesion (menos de 1 h) ---- */
    AD("codex_50", "📚", "Rata de biblioteca", "Bookworm", "50 tarjetas.", "50 cards.", "codex", c => c.u >= 50),
    AD("perfect", "💯", "Ronda perfecta", "Perfect round", "Acierta bien todas las preguntas de un nivel del Clásico.", "Nail every question in a Classic level.", "level", c => c.perfect),
    AD("q_100", "🧭", "Aprendiz", "Apprentice", "100 preguntas respondidas.", "100 questions answered.", "q", () => S().questions >= 100),
    AD("adv_boss", "🐉", "Cazajefes", "Boss slayer", "Derrota a un jefe.", "Defeat a boss.", "adv", c => c.kind === "boss"),
    AD("adv_act1", "🌅", "Las rutas conocidas", "The known roads", "Completa el Acto I.", "Complete Act I.", "adv", c => c.kind === "act" && c.act >= 1),
    AD("codex_100", "🏛️", "Erudito", "Scholar", "100 tarjetas.", "100 cards.", "codex", c => c.u >= 100),
    AD("streak_10", "☄️", "Imparable", "Unstoppable", "Racha de 10 aciertos.", "10-hit streak.", "q", () => S().bestStreak >= 10),
    AD("daily_1", "📅", "Reto del día", "Daily challenge", "Completa un Reto diario.", "Complete a Daily challenge.", "daily", () => true),
    AD("classic_world", "🌍", "Vuelta al mundo", "Round the world", "Termina la campaña Mundo.", "Finish the World campaign.", "classic", () => won("c-game1")),
    /* ---- III. unas horas (1-5 h) ---- */
    AD("last_second", "⏱️", "Por los pelos", "By a whisker", "Acierta bien con menos de 1 segundo restante.", "Nail it with under 1 second left.", "q", c => c.ratio >= 0.75 && c.left != null && c.left < 1 && c.left > 0),
    AD("codex_capitals", "🏙️", "Diplomático", "Diplomat", "40 capitales.", "40 capitals.", "codex", c => (c.by.capital || [0])[0] >= 40),
    AD("codex_water", "🌊", "Aguas tranquilas", "Calm waters", "15 mares, lagos o islas.", "15 seas, lakes or islands.", "codex", c => (c.by.water || [0])[0] >= 15),
    AD("codex_nature", "🌋", "Naturalista", "Naturalist", "30 lugares de naturaleza en la Enciclopedia.", "30 nature entries in the Encyclopedia.", "codex", c => (c.by.nature || [0])[0] >= 30),
    AD("codex_people", "🧑‍🎨", "Historiador", "Historian", "25 personajes históricos.", "25 historical figures.", "codex", c => (c.by.person || [0])[0] >= 25),
    AD("codex_events", "⚔️", "Cronista", "Chronicler", "20 batallas y sucesos.", "20 battles and events.", "codex", c => ((c.by.battle || [0])[0] + (c.by.event || [0])[0]) >= 20),
    AD("codex_place", "🧭", "Rincones perdidos", "Hidden corners", "10 lugares sin categoría propia.", "10 uncategorized places.", "codex", c => (c.by.place || [0])[0] >= 10),
    AD("inside", "🏳️", "Bienvenido a casa", "Welcome home", "Haz clic dentro de 25 países.", "Click inside 25 countries.", "q", () => S().inside >= 25),
    AD("bull_25", "🎯", "Pulso de cirujano", "Surgeon's aim", "25 dianas en total.", "25 bullseyes in total.", "q", () => S().bulls >= 25),
    AD("adv_rich", "💰", "Tesoro de dragón", "Dragon's hoard", "Ten 40 doblones a la vez.", "Hold 40 doubloons at once.", "adv", c => c.coins >= 40),
    AD("adv_flawless", "🛡️", "Sin un rasguño", "Not a scratch", "Completa un acto sin perder provisiones.", "Complete an act without losing a life.", "adv", c => c.kind === "act" && c.flawless),
    AD("adv_build", "🧰", "Mochila llena", "Full pack", "Ten 5 reliquias a la vez.", "Hold 5 relics at once.", "adv", c => c.perks >= 5),
    AD("codex_250", "🎓", "Catedrático", "Professor", "250 tarjetas.", "250 cards.", "codex", c => c.u >= 250),
    /* Clasico: un logro por campana (las 11), todas, primer oro y oro en todas. Sin "termina una cualquiera":
     * se desbloqueaba siempre a la vez que el de la campana terminada. */
    AD("classic_capitals", "🏛️", "Gira de capitales", "Capital tour", "Termina Capitales del mundo.", "Finish World Capitals.", "classic", () => won("c-worldcapitals")),
    AD("classic_europe", "🏰", "Grand Tour", "Grand Tour", "Termina Europa.", "Finish Europe.", "classic", () => won("c-europe")),
    AD("classic_latam", "💃", "Tierra latina", "Latin spirit", "Termina Latinoamérica.", "Finish Latin America.", "classic", () => won("c-centralsouthamerica")),
    AD("classic_usa", "🗽", "Sueño americano", "American dream", "Termina Estados Unidos.", "Finish USA.", "classic", () => won("c-usa")),
    AD("classic_asia", "🏯", "Ruta de la seda", "Silk road", "Termina Asia.", "Finish Asia.", "classic", () => won("c-asia")),
    AD("classic_oceania", "🏄", "Al fin del mundo", "Down under", "Termina Oceanía.", "Finish Oceania.", "classic", () => won("c-oceania")),
    AD("adv_act2", "🌄", "Más allá del mapa", "Beyond the map", "Completa el Acto II.", "Complete Act II.", "adv", c => c.kind === "act" && c.act >= 2),
    AD("perfect_5", "💯", "Racha perfecta", "Perfect streak", "5 rondas perfectas en total.", "5 perfect rounds in total.", "level", () => S().perfectRounds >= 5),
    AD("adv_boss5", "☠️", "Cazarrecompensas", "Bounty hunter", "Derrota a 5 jefes en total.", "Defeat 5 bosses in total.", "adv", () => ADV().boss >= 5),
    AD("codex_city", "🏙️", "Turista empedernido", "World traveler", "100 ciudades.", "100 cities.", "codex", c => (c.by.city || [0])[0] >= 100),
    AD("codex_curio", "🎲", "Culturilla general", "Trivia buff", "100 curiosidades.", "100 curiosities.", "codex", c => (c.by.curiosity || [0])[0] >= 100),
    AD("pixel", "🔬", "Al milímetro", "To the millimetre", "Acierta a menos de 5 km.", "Land within 5 km.", "q", c => c.km != null && c.km <= 5),
    AD("q_1000", "🗺️", "Cartógrafo", "Cartographer", "1.000 preguntas respondidas.", "1,000 questions answered.", "q", () => S().questions >= 1000),
    AD("daily_7", "🗓️", "Constancia", "Consistency", "Completa 7 Retos diarios.", "Complete 7 Daily challenges.", "daily", () => Object.keys(P.daily).length >= 7),
    /* ---- IV. jugador habitual (5-20 h) ---- */
    AD("adv_runs10", "👢", "Curtido", "Veteran", "Empieza 10 expediciones.", "Start 10 expeditions.", "adv", () => ADV().runs >= 10),
    AD("codex_500", "🌟", "Enciclopedista", "Encyclopedist", "500 tarjetas.", "500 cards.", "codex", c => c.u >= 500),
    AD("classic_flags", "🚩", "Abanderado", "Standard-bearer", "Termina Banderas.", "Finish Flags.", "classic", () => won("c-flags")),
    AD("classic_clues", "🕵️", "Detective", "Sleuth", "Termina Pistas.", "Finish Clues.", "classic", () => won("c-clues")),
    AD("classic_events", "📜", "Testigo de la historia", "Witness to history", "Termina Eventos históricos.", "Finish Historic Events.", "classic", () => won("c-events")),
    AD("classic_people", "🎭", "Biógrafo", "Biographer", "Termina Personajes históricos.", "Finish Historical Figures.", "classic", () => won("c-people")),
    AD("codex_strait", "⛵", "Paso estrecho", "Narrow passage", "8 estrechos o cabos.", "8 straits or capes.", "codex", c => (c.by.strait || [0])[0] >= 8),
    AD("streak_20", "🌋", "Erupción", "Eruption", "Racha de 20 aciertos.", "20-hit streak.", "q", () => S().bestStreak >= 20),
    AD("adv_win", "🗿", "Terra Incognita", "Terra Incognita", "Completa el Acto III y gana la expedición.", "Complete Act III and win the expedition.", "adv", c => c.kind === "act" && c.act >= 3),
    AD("adv_asc", "⛰️", "Ascensión", "Ascension", "Gana una expedición en Ascensión 1 o más.", "Win an expedition at Ascension 1 or higher.", "adv", c => c.kind === "act" && c.act >= 3 && c.asc >= 1),
    AD("classic_gold1", "🥇", "Oro a la vista", "First gold", "Consigue tu primera medalla de oro en el Clásico.", "Earn your first Classic gold medal.", "classic", () => Object.values(P.medals).some(m => m === "gold")),
    AD("bull_100", "🏹", "Ojo de halcón", "Hawk eye", "100 dianas en total.", "100 bullseyes in total.", "q", () => S().bulls >= 100),
    AD("inside_100", "⛴️", "Bien viajado", "Well-traveled", "Haz clic dentro de 100 países.", "Click inside 100 countries.", "q", () => S().inside >= 100),
    AD("adv_flawless2", "🛡️", "Impecable II", "Flawless II", "Completa el Acto II sin perder provisiones.", "Complete Act II without losing a life.", "adv", c => c.kind === "act" && c.flawless && c.act >= 2),
    /* tras ganar, el modo infinito no tiene actos: "Llega al Acto V" era imposible; ahora cuenta preguntas aguantadas (js/adventure.js, afterQuestion) */
    AD("adv_endless", "♾️", "Leyenda", "Legend", "Aguanta 25 preguntas en el modo infinito.", "Survive 25 questions in infinite mode.", "adv", c => c.kind === "hold" && c.inf >= 25),
    AD("adv_rich2", "💎", "Altas apuestas", "High roller", "Ten 100 doblones a la vez.", "Hold 100 doubloons at once.", "adv", c => c.kind === "hold" && c.coins >= 100),
    AD("speed_master", "🎩", "Reflejos de crupier", "Dealer reflexes", "Acierta muy bien en menos de 1 segundo.", "Nail it almost perfectly in under 1 second.", "q", c => c.ratio >= 0.9 && c.used != null && c.used <= 1),
    AD("adv_wins3", "🎰", "Triplete", "Hat trick", "Gana 3 expediciones.", "Win 3 expeditions.", "adv", () => ADV().wins >= 3),
    AD("classic_all", "🏆", "Maestro del Clásico", "Classic master", "Termina todas las campañas del Clásico.", "Finish every Classic campaign.", "classic", () => classicIds().every(won)),
    AD("plays_50", "🃏", "Cliente habitual", "Regular", "Juega 50 partidas.", "Play 50 games.", "q", () => S().plays >= 50),
    /* ---- V. maestria (20 h o mas) ---- */
    AD("q_5000", "🌍", "Geógrafo", "Geographer", "5.000 preguntas respondidas.", "5,000 questions answered.", "q", () => S().questions >= 5000),
    AD("adv_asc2", "⛰️", "Ascensión II", "Ascension II", "Gana una expedición en Ascensión 2 o más.", "Win an expedition at Ascension 2 or higher.", "adv", c => c.kind === "act" && c.act >= 3 && c.asc >= 2),
    AD("adv_flawless3", "🏵️", "Leyenda intachable", "Flawless legend", "Completa el Acto III sin perder provisiones.", "Complete Act III without losing a life.", "adv", c => c.kind === "act" && c.flawless && c.act >= 3),
    AD("daily_30", "🎟️", "Ritual diario", "Daily ritual", "Completa 30 Retos diarios.", "Complete 30 Daily challenges.", "daily", () => Object.keys(P.daily).length >= 30),
    AD("codex_country", "🛂", "Pasaporte completo", "Full passport", "190 países en la Enciclopedia.", "190 countries in the Encyclopedia.", "codex", c => (c.by.country || [0])[0] >= 190),
    AD("bull_500", "🦅", "Leyenda del mapa", "Map legend", "500 dianas en total.", "500 bullseyes in total.", "q", () => S().bulls >= 500),
    AD("streak_50", "🌪️", "Invencible", "Invincible", "Racha de 50 aciertos.", "50-hit streak.", "q", () => S().bestStreak >= 50),
    AD("adv_wins10", "🤵", "Habitual de la casa", "House regular", "Gana 10 expediciones.", "Win 10 expeditions.", "adv", () => ADV().wins >= 10),
    AD("q_10000", "📜", "Sabio de los mapas", "Map sage", "10.000 preguntas respondidas.", "10,000 questions answered.", "q", () => S().questions >= 10000),
    AD("bull_1000", "🏵️", "As de diana", "Ace shot", "1.000 dianas en total.", "1,000 bullseyes in total.", "q", () => S().bulls >= 1000),
    AD("classic_goldall", "👑", "Oro puro", "Solid gold", "Medalla de oro en todas las campañas del Clásico.", "Gold medal in every Classic campaign.", "classic", () => classicIds().every(id => P.medals[id] === "gold")),
    AD("adv_ascmax", "🗻", "La cumbre", "The summit", "Gana una expedición en la Ascensión máxima.", "Win an expedition at max Ascension.", "adv", c => c.kind === "act" && c.act >= 3 && c.asc >= 5),
    AD("codex_all", "👑", "Completista", "Completionist", "Desbloquea todas las tarjetas.", "Unlock every card.", "codex", c => c.u >= c.t),
    /* ---- secretos ---- */
    AD("marathon", "🏃", "Maratón", "Marathon", "50 preguntas en una sesión.", "50 questions in one session.", "q", () => A._sessionQ >= 50, true),
    AD("night", "🌙", "Búho", "Night owl", "Juega pasada la medianoche.", "Play past midnight.", "q", () => new Date().getHours() < 5, true),
    AD("early_bird", "🌅", "Madrugador", "Early bird", "Juega entre las 5 y las 7 de la mañana.", "Play between 5 and 7 AM.", "q", () => { const h = new Date().getHours(); return h >= 5 && h < 7; }, true),
    AD("weekend", "🎉", "Findesemanero", "Weekender", "Juega en fin de semana.", "Play on a weekend.", "q", () => [0, 6].includes(new Date().getDay()), true),
  ];
  A._sessionQ = 0;

  const queue = []; let showing = false;
  function toast() {
    if (showing || !queue.length) return; showing = true;
    const a = queue.shift(); let el = document.getElementById("achToast");
    if (!el) { el = document.createElement("div"); el.id = "achToast"; el.className = "ach-toast hidden"; (document.getElementById("leftCol") || document.getElementById("app")).appendChild(el); }
    el.innerHTML = `<span class="ach-ico">${A.badge(a.id)}</span><span class="ach-t"><em>${A.T("Logro desbloqueado", "Achievement unlocked")}</em><b>${A.tx(a.name)}</b><i>${A.tx(a.desc)}</i></span>`;
    el.classList.remove("hidden", "in"); void el.offsetWidth; el.classList.add("in"); A.sfx.ach();
    setTimeout(() => { el.classList.add("hidden"); showing = false; setTimeout(toast, 250); }, 4600);
  }
  A.ach = {
    emit(ev, ctx) {
      ctx = ctx || {}; let n = 0;
      for (const a of A.ACH) {
        if (a.ev !== ev || P.ach[a.id]) continue;
        let ok = false; try { ok = a.test(ctx); } catch (e) { ok = false; }
        if (!ok) continue;
        P.ach[a.id] = Date.now(); n++; queue.push(a); if (A.steam && A.steam.unlock) A.steam.unlock(a.id);
      }
      if (n) { save(); toast(); }
    },
    count: () => A.ACH.filter(a => P.ach[a.id]).length, total: () => A.ACH.length,          // un logro retirado (classic_win) no cuenta aunque siga en el perfil
  };

  /* ---------------------------------------------------------------- registro de una pregunta */
  const BULL_KM = 25;
  A.profile.question = ({ km, inside, ratio, streak, left, limit, timeout }) => {
    const s = P.stats; s.questions++; A._sessionQ++;
    if (timeout) { s.timeouts++; save(); A.ach.emit("q", { timeout: true }); return; }
    s.km += km || 0; s.seconds += Math.max(0, limit - left); if (ratio >= 0.4) s.hits++;
    const bull = inside || (km != null && km <= BULL_KM); if (bull) s.bulls++; if (inside) s.inside++;
    s.bestStreak = Math.max(s.bestStreak, streak);
    save(); A.ach.emit("q", { km, ratio, bull, used: limit - left, left, inside });
  };
})(window.AIQ);
