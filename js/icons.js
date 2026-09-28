/*
 * Geolite - iconos (v0.15): ilustraciones pixel art casino generadas con un unico libro de estilo (tools/gen_art.py) en assets/icons/.
 * Uso: A.icon("sonar") -> <img class="ic">. Ya no queda ningun dibujo vectorial antiguo.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  A.blind = (kind, inner) => `<span class="ic blindchip">${A.icon("blank_" + kind, "bc-base")}${A.icon(inner, "bc-in")}</span>`;
  /* Los iconos son ilustraciones pixel-art generadas con un unico libro de estilo (tools/gen_art.py) en assets/icons/.
     Si falta alguno, simplemente no se pinta. */
  const ALIAS = { steadyhand: "steady", a_globe: "globe", a_cal: "t_event", a_boots: "boots", a_flag: "t_country", a_bolt: "flash", a_night: "a_moon", roulette_r: "roulette_r" };
  A.icon = (id, cls = "") => {
    id = ALIAS[id] || id;
    return `<img class="ic ic-${id} ${cls}" src="assets/icons/${id}.webp" alt="" draggable="false" decoding="async" onerror="AIQ._icErr(this)">`;
  };
  A._icErr = im => { im.style.visibility = "hidden"; };

  /* pinta los iconos declarados en el HTML: <i data-ic="u_plus"></i> */
  A.iconize = (root = document) => root.querySelectorAll("[data-ic]").forEach(el => { if (!el.firstChild) el.innerHTML = A.icon(el.dataset.ic); });
  /* logro -> icono */
  A.ACH_ICON = {
    first_pin: "a_pin", bull_1: "a_target", bull_25: "a_target", bull_100: "eagle", bull_500: "crown", pixel: "a_lens", inside: "t_country",
    streak_5: "a_flame", streak_10: "a_comet", streak_20: "a_volcano", speed: "flash", last_second: "a_stopwatch", q_100: "compass", q_1000: "mapper", q_5000: "a_globe",
    perfect: "a_hundred", classic_win: "m_classic", classic_all: "m_compete", codex_10: "a_book", codex_50: "a_book", codex_100: "t_landmark", codex_250: "a_cap", codex_500: "a_medal",
    codex_all: "crown", codex_people: "t_person", codex_capitals: "t_capital", codex_events: "t_battle", adv_start: "m_adv", adv_clear1: "boots", adv_boss: "skull",
    adv_act1: "a_sun", adv_act2: "a_peak", adv_win: "a_moai", adv_endless: "a_inf", adv_rich: "hoard", adv_build: "a_pack", adv_flawless: "a_shield", adv_blind: "blindperk", adv_asc: "a_peak",
    daily_1: "t_event", daily_7: "t_event", night: "a_moon", marathon: "boots",
    codex_nature: "naturalist", codex_water: "t_water", codex_strait: "t_strait", codex_curio: "t_curio", codex_city: "t_city", codex_country: "passport", codex_place: "t_place",
    classic_world: "globe", classic_capitals: "compass", classic_usa: "k_na", classic_asia: "k_as", classic_latam: "k_sa", classic_oceania: "k_oc",
    classic_gold1: "medal_gold", classic_goldall: "crown",
    adv_asc2: "a_peak", adv_ascmax: "a_moai", adv_flawless2: "a_shield", adv_flawless3: "a_shield", adv_rich2: "highroller",
    adv_boss5: "skull", adv_runs10: "boots", adv_wins3: "lucky7", adv_wins10: "crown",
    daily_30: "t_event", bull_1000: "royalflush", q_10000: "atlasbook", inside_100: "sail", plays_50: "hourglass",
    perfect_5: "a_hundred", streak_50: "storm", speed_master: "flash", early_bird: "earlybird", weekend: "tour",
  };
  /* insignia de logro: marco por categoria + icono dentro */
  const ACH_FRAME = { q: "blank_boss", level: "blank_boss", classic: "blank_small", codex: "blank_teal", adv: "blank_big", daily: "blank_gold" };
  A.badge = (achId, cls = "") => {
    const a = A.ACH.find(x => x.id === achId);
    return `<span class="ic badge ${cls}">${A.icon(ACH_FRAME[a && a.ev] || "blank_boss", "bd-base")}${A.icon(A.ACH_ICON[achId] || "a_medal", "bd-in")}</span>`;
  };
  /* iconos como imagen CSS (--ic-nombre) para decorar con ::before/::after */
  A.iconVars = () => {};
  A.iconVars(); A.iconize();
})(window.AIQ);
