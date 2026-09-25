/* Atlas IQ - textos ES/EN, calculo de IQ e insignia. */
window.AIQ = window.AIQ || {};
(function (A) {
  A.VERSION = "0.9.3";
  A.lang = "es";
  A.t = (key, p) => {
    let s = (A.STR[A.lang] && A.STR[A.lang][key]) || A.STR.en[key] || key;
    if (p) for (const k in p) s = s.replaceAll("{" + k + "}", p[k]);
    return s;
  };
  const locOf = () => (A.LANGS.find(l => l.code === A.lang) || A.LANGS[0]).loc;
  A.fmt = n => Math.round(n).toLocaleString(locOf());
  /* texto multilingue: objeto {en,es,...} o cadena. Si falta el idioma, ingles y luego espanol */
  /* texto {es, en, ...}: idioma propio -> traduccion del ingles (js/i18n2.js) -> ingles -> espanol */
  const TRI = { fr: 0, pt: 1, de: 2, it: 3 };
  const trOf = en => { const t = A.TR && A.TR[en], i = TRI[A.lang]; return t && i != null ? t[i] : undefined; };
  A.tx = v => (v && typeof v === "object" ? v[A.lang] || (v.en && trOf(v.en)) || (A.lang === "es" ? v.es : v.en) || v.en || v.es || "" : v || "");
  A.L = (es, en) => ({ es, en });                                    // texto perezoso: se resuelve al pintar (sigue el idioma activo)
  A.T = (es, en) => A.tx({ es, en });                                // texto inmediato
  A.tf = (es, en, params) => A.T(es, en).replace(/\{(\w+)\}/g, (m, k) => (params && params[k] != null ? params[k] : m));

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
    c.fillText(new Date().toLocaleDateString(locOf(), { year: "numeric", month: "long", day: "numeric" }).toUpperCase(), 400, 430);
    // sello
    c.save(); c.translate(760, 150); c.rotate(-0.22); c.strokeStyle = RED; c.fillStyle = RED; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 62, 0, 7); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 54, 0, 7); c.stroke();
    c.font = "800 22px 'DM Mono', monospace"; c.textAlign = "center"; c.fillText("ATLAS", 0, -6); c.fillText("IQ", 0, 20); c.restore();
    return cv;
  };
})(window.AIQ);
