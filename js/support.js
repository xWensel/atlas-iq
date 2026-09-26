/* Atlas IQ - textos ES/EN, calculo de IQ e insignia. */
window.AIQ = window.AIQ || {};
(function (A) {
  A.VERSION = "0.12.0";
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

  /* ------------------------------------------------------------ insignia PNG (estilo casino, en el idioma del jugador) */
  const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  A.makeBadge = async (iq, tierName, subtitle) => {
    const W = 1200, H = 630, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), GOLD = "#f8b449", INK = "#191325", RED = "#fe5f55", PAPER = "#f3eddc", FELT = "#17553a";
    try { await Promise.all([document.fonts.load("400 40px 'Jersey 15'"), document.fonts.load("700 20px Silkscreen")]); } catch (e) { /* sin fuentes */ }
    const logo = await loadImg("assets/gen/logo.webp");
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    // fondo y tapete
    const g = c.createRadialGradient(W / 2, H * 0.45, 60, W / 2, H / 2, W * 0.7); g.addColorStop(0, "#2a1650"); g.addColorStop(1, "#0c0818"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    rr(34, 34, W - 68, H - 68, 28); c.fillStyle = FELT; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    rr(48, 48, W - 96, H - 96, 20); c.lineWidth = 4; c.strokeStyle = GOLD; c.stroke();
    c.save(); rr(48, 48, W - 96, H - 96, 20); c.clip(); c.globalAlpha = 0.07; c.fillStyle = "#fff"; for (let x = 0; x < W; x += 18) for (let y = 0; y < H; y += 18) if (((x + y) / 18) % 2 === 0) c.fillRect(x, y, 9, 9); c.restore();
    // ficha de casino con el IQ
    const cx = 290, cy = 330, R = 190;
    c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.arc(cx + 8, cy + 12, R, 0, 7); c.fill();
    c.fillStyle = RED; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    c.fillStyle = PAPER; for (let i = 0; i < 8; i++) { c.save(); c.translate(cx, cy); c.rotate(i * Math.PI / 4); c.fillRect(-22, -R + 6, 44, 46); c.restore(); }
    c.fillStyle = "#fff4f0"; c.beginPath(); c.arc(cx, cy, R * 0.66, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    c.setLineDash([12, 10]); c.lineWidth = 4; c.strokeStyle = RED; c.beginPath(); c.arc(cx, cy, R * 0.58, 0, 7); c.stroke(); c.setLineDash([]);
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = INK;
    c.font = "700 26px Silkscreen, monospace"; c.fillText("IQ", cx, cy - 70);
    c.font = "400 150px 'Jersey 15', sans-serif"; c.fillText(String(iq), cx, cy + 16);
    // textos
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    if (logo) { const lw = 300, lh = lw * (logo.height / logo.width); c.drawImage(logo, 540, 70, lw, lh); }
    const x0 = 540;
    c.font = "700 22px Silkscreen, monospace"; c.fillStyle = GOLD; c.fillText(A.t("badge.head").toUpperCase(), x0, 318);
    c.font = "400 78px 'Jersey 15', sans-serif"; c.fillStyle = "#000"; c.fillText(tierName, x0 + 4, 402); c.fillStyle = PAPER; c.fillText(tierName, x0, 398);
    c.font = "400 34px 'Jersey 15', sans-serif"; c.fillStyle = "#ffe08a"; c.fillText(subtitle, x0, 452, W - x0 - 80);
    c.font = "700 18px Silkscreen, monospace"; c.fillStyle = "rgba(243,237,220,.7)";
    c.fillText(new Date().toLocaleDateString(locOf(), { year: "numeric", month: "long", day: "numeric" }).toUpperCase(), x0, 500);
    c.fillText(location.host || "atlas-iq", x0, 540);
    return cv;
  };
})(window.AIQ);
