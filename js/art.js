/*
 * Atlas IQ - ilustraciones propias (v0.6): escenas grandes de jefes, actos, campamento, cofre y finales.
 * Mismo estilo "pin esmaltado" que los iconos, pero a escala de escena (240x150). Se componen con las piezas de js/icons.js.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const { K, C, col, p, q, l, t, c, e, h, dot, star } = A._g, I = A.ICONS;
  /* incrusta un icono en la escena: posicion, escala y giro */
  const use = (id, x, y, s = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r} ${24 * s} ${24 * s}) scale(${s})">${I[id]}</g>`;
  const band = (y, hh, f, o = 1) => `<rect x="0" y="${y}" width="240" height="${hh}" fill="${col(f)}" opacity="${o}"/>`;
  const waves = (y, f, n = 8, amp = 5, w = 3) => { let d = `M-4 ${y}`; for (let i = 0; i < n; i++) d += `q${240 / n / 2} ${-amp} ${240 / n} 0`; return l(d, f, w); };
  const wavesFill = (y, f, f2) => p(`M0 ${y}q15-8 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0V150H0Z`, f) + l(`M0 ${y + 1}q15-8 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0`, f2, 3);
  const rays = (cx, cy, n, r1, r2, f, o = 0.35) => { let d = ""; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = a + Math.PI / n * 0.9; d += `M${cx} ${cy}L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}L${(cx + Math.cos(b) * r2).toFixed(1)} ${(cy + Math.sin(b) * r2).toFixed(1)}Z`; } return `<path d="${d}" fill="${col(f)}" opacity="${o}"/>`; };
  const sparkles = pts => pts.map(([x, y, r]) => star(x, y, r, r * 0.38, "w", 4)).join("");
  const frame = inner => `<svg class="art" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><clipPath id="artc"><rect x="3" y="3" width="234" height="144" rx="14"/></clipPath></defs><g clip-path="url(#artc)">${inner}</g><rect class="art-b" x="3" y="3" width="234" height="144" rx="14" fill="none" stroke="${K}" stroke-width="5"/><rect class="art-b" x="7.5" y="7.5" width="225" height="135" rx="10" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.5"/></svg>`;
  const S = {};

  /* ------------------------------- jefes ------------------------------- */
  S.boss_wind = frame(band(0, 150, "#3aa0c8") + band(0, 60, "#66c3e8") + band(0, 24, "#9edcf2") + c(196, 30, 18, "y") + rays(196, 30, 12, 20, 60, "y", 0.25) + wavesFill(112, "#1f6fae", "#63aef5") +
    use("columbus", 84, 62, 1.7, -12) +
    t("M-6 40h92a16 16 0 1 0-16-16", "w", 5) + t("M-6 74h150a14 14 0 1 1-14 14", "w", 5) + t("M150 48h96", "w", 4.4) + t("M-6 104h60a10 10 0 1 1-10 10", "w", 4) +
    p("M150 30q8-8 16-2-6 8-16 2Z", "L") + p("M188 66q10-4 14 4-9 4-14-4Z", "l") + p("M40 8l16 6-4 12-14-4Z", "w2") + p("M206 96l14 2-2 12-14-2Z", "w2") + sparkles([[30, 60, 4], [220, 60, 3]]));

  S.boss_storm = frame(band(0, 150, "#1c1a33") + band(0, 70, "#2a2647") + band(50, 30, "#3a3560") + rays(120, 20, 14, 30, 130, "#7a6b9c", 0.1) +
    use("storm", 52, -4, 5) + wavesFill(122, "#153a6b", "#3b76c4") + use("columbus", 168, 84, 1.3, 10) +
    p("M120 78l-18 26h12l-8 24 30-34h-14l12-16Z", "g") + q("M118 86l-10 16h9l-4 12 15-19h-9Z", "y") +
    l("M30 80l-6 16M56 92l-6 16M180 76l-6 16M206 88l-6 16M220 60l-5 14M14 66l-5 14", "b", 3.2) + sparkles([[206, 30, 3.4], [24, 30, 3]]));

  S.boss_strict = frame(band(0, 150, "#f0d9a0") + band(100, 50, "#d9b872") + rays(120, 70, 18, 20, 160, "#fff4d1", 0.5) +
    use("strict", 68, 8, 2.9) +
    p("M14 116h212v14H14Z", "#f6efdc") + l("M26 116v9M40 116v6M54 116v9M68 116v6M82 116v9M96 116v6M110 116v9M124 116v6M138 116v9M152 116v6M166 116v9M180 116v6M194 116v9M208 116v6", "k", 2) +
    t("M190 30l-16 50", "s", 4) + t("M190 30l16 50", "s", 4) + c(190, 28, 6, "g") + t("M180 62h20", "S", 3) +
    p("M22 20a12 12 0 1 1 0 .1Z", "r", 'opacity="0"') + c(30, 30, 12, "r") + l("M24 24l12 12M36 24L24 36", "w", 3.6));

  S.boss_silence = frame(band(0, 150, "#231a44") + band(70, 80, "#33275e") + c(190, 34, 20, "y") + c(198, 28, 18, "#231a44", 0) + sparkles([[30, 26, 5], [60, 14, 3], [210, 92, 4], [24, 110, 3.4], [96, 24, 2.6]]) +
    use("silence", 60, 10, 2.9) +
    l("M28 70c-10 8-10 20 0 28M16 62c-16 14-16 34 0 48", "#8b78c6", 3.6) + l("M212 70c10 8 10 20 0 28M224 62c16 14 16 34 0 48", "#8b78c6", 3.6) +
    p("M0 126q40-14 80-4t80 0 80 6v22H0Z", "#1a1233") + use("hourglass", 20, 92, 1.1, -10));

  S.boss_fog = frame(band(0, 150, "#7f93a6") + band(0, 50, "#a6b8c8") + band(90, 60, "#5f7488") + c(58, 30, 16, "#eef6ff") + rays(58, 30, 10, 16, 50, "#fff", 0.35) +
    p("M92 128l8-72h20l8 72Z", "w") + p("M97 96h26l-1.6 12H98.6ZM101 64h18l-1 10h-16Z", "r") + p("M96 46h28l-4 10h-20Z", "#3a3560") + p("M100 34h20v12h-20Z", "y") + rays(110, 40, 8, 10, 100, "y", 0.35) + p("M104 30l6-8 6 8Z", "r") +
    p("M70 128q40-14 80 0v10H70Z", "S") +
    p("M-10 88q30-20 60-6t60-4 60 6 70-6v40H-10Z", "w", 'opacity=".78"') + p("M-10 112q40-16 80-4t80 0 90-6v44H-10Z", "w", 'opacity=".9"') + p("M-10 132q50-10 100 0t150-4v22H-10Z", "#eef6ff") +
    l("M20 70q20-8 40 0M170 60q22-8 44 0M30 100q20-6 40 0", "w", 4, 'opacity=".8"'));

  /* ------------------------------- actos ------------------------------- */
  S.act_0 = frame(band(0, 150, "#ffb36b") + band(0, 70, "#ffd28a") + band(0, 30, "#ffe6b0") + c(170, 74, 28, "y") + rays(170, 74, 16, 28, 120, "#fff2c2", 0.5) +
    p("M-10 96q40-40 90-18t100-12 70 20v64H-10Z", "L") + p("M-10 112q60-30 130-8t130-4v50H-10Z", "l") +
    l("M40 150q40-40 90-30t70-40", "#f3d8a0", 12) + l("M40 150q40-40 90-30t70-40", "n", 2.4, 'stroke-dasharray="1 8"') +
    use("compass", 18, 62, 1.6, -8) + use("mapper", 176, 22, 1.5, 8) + use("boots", 96, 98, 1.1) + sparkles([[214, 18, 5], [120, 20, 3]]));

  S.act_1 = frame(band(0, 150, "#2b3f8f") + band(0, 62, "#4a5fb8") + band(0, 24, "#7489d8") + c(196, 30, 14, "#fff2c2") + sparkles([[30, 22, 4], [80, 40, 3], [150, 16, 3.4], [220, 60, 3]]) +
    wavesFill(96, "#1c2f70", "#5a78d8") + p("M0 122q30-10 60 0t60 0 60 0 60 0v28H0Z", "#14224f") +
    use("columbus", 84, 44, 2.2, -6) +
    t("M14 96q-4-30 10-44 6 16-2 30", "#3f9b62", 7) + t("M24 52q10-8 8-20", "#3f9b62", 5) + c(30, 34, 4, "r") +
    p("M196 60l18-8 10 14-8 12 10 12-16 8Z", "w2", 'opacity=".95"') + l("M204 70l10-2M208 84l8-2", "N", 1.6));

  S.act_2 = frame(band(0, 150, "#173a35") + band(0, 60, "#1f5a52") + c(190, 30, 20, "#f6efdc") + c(198, 26, 18, "#1f5a52", 0) + sparkles([[30, 20, 4], [90, 12, 3], [150, 26, 3]]) +
    p("M-10 118q30-30 60-14t60-6 60 8 70-12v56H-10Z", "#0f2f2b") +
    use("a_moai", 92, 34, 2.4) + use("a_moai", 30, 66, 1.5) + use("a_moai", 172, 62, 1.7) +
    t("M8 150q10-40 30-50M232 150q-6-30-24-46", "#2fb08a", 7) + p("M40 70q-12-20-32-14 14 4 20 16Z", "l") + p("M206 76q14-22 32-16-16 6-22 18Z", "l") + dot(112, 30, 0.1, "k"));

  S.act_3 = frame(band(0, 150, "#120e26") + band(0, 90, "#1c1640") + rays(120, 150, 24, 30, 200, "#a878e8", 0.18) +
    star(40, 30, 5, 2, "w", 4) + star(200, 22, 4, 1.6, "w", 4) + star(120, 14, 5, 2, "y", 4) + star(76, 56, 3.4, 1.4, "w", 4) + star(170, 50, 3.4, 1.4, "w", 4) +
    l("M40 30L76 56L120 14L170 50L200 22", "#a878e8", 2, 'stroke-dasharray="2 5"') +
    use("a_globe", 90, 52, 2.5) + use("crown", 100, 16, 1.0, 0) + p("M0 134q60-24 120-8t120-2v26H0Z", "#0a0818") + waves(140, "#3b2f6b", 8, 4, 2.4));

  /* --------------------------- campamento, cofre, finales --------------------------- */
  S.camp = frame(band(0, 150, "#1b2350") + band(0, 70, "#26306a") + star(30, 22, 4, 1.6, "w", 4) + star(90, 14, 3, 1.2, "w", 4) + star(210, 30, 4, 1.6, "w", 4) + star(170, 12, 3, 1.2, "y", 4) + c(200, 40, 12, "#f6efdc") +
    p("M0 96l30-34 26 24 30-40 40 50v54H0Z", "#151b40") + p("M120 100l40-44 38 36 42-24v82H120Z", "#1a2350") +
    p("M0 122q60-14 120-4t120-6v38H0Z", "L") + p("M0 134q80-12 160-2t80-2v20H0Z", "#2b6b3c") +
    p("M70 128l32-58 32 58Z", "r") + p("M102 70l32 58h-12l-20-40-4 40h-8Z", "R", 'opacity=".85"') + p("M92 128l10-24 10 24Z", "#2b1a1a") + l("M102 70V56", "k", 2.4) + p("M102 56l14 4-14 5Z", "y") +
    use("a_flame", 150, 88, 1.2) + t("M144 132l24-6M146 126l22 6", "N", 4.4) + use("journal", 20, 98, 1, -8));

  S.chest = frame(band(0, 150, "#2a1a4a") + rays(120, 92, 22, 20, 190, "#f8b449", 0.28) + rays(120, 92, 22, 10, 120, "#ffe08a", 0.22) + sparkles([[36, 30, 6], [200, 24, 5], [60, 100, 4], [188, 108, 5], [120, 14, 4]]) +
    use("chest", 66, 24, 2.5) + use("coin", 24, 84, 1, -10) + use("coin", 190, 76, 1.1, 12) + use("crown", 162, 20, 1, 10) + use("flash", 30, 20, 0.9, -12));

  S.win = frame(band(0, 150, "#173a35") + rays(120, 80, 24, 20, 190, "#f8b449", 0.3) + c(120, 84, 48, "#f8b449", 3) + c(120, 84, 40, "#1f5a52", 2) +
    (() => { let d = ""; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.62 + i * 0.095), x = 120 + Math.cos(a) * 46, y = 84 + Math.sin(a) * 46; d += p(`M${x.toFixed(1)} ${y.toFixed(1)}q-8-5-4-14 8 3 4 14Z`, "l"); const x2 = 240 - x; d += p(`M${x2.toFixed(1)} ${y.toFixed(1)}q8-5 4-14-8 3-4 14Z`, "l"); } return d; })() +
    use("a_globe", 92, 56, 1.2) + use("crown", 98, 8, 1.1) + sparkles([[36, 32, 6], [206, 40, 5], [24, 110, 4], [216, 108, 4]]));

  S.lose = frame(band(0, 150, "#2b2340") + band(90, 60, "#1c1633") + waves(120, "#3b2f6b", 8, 5, 3) + l("M20 30l-6 18M60 20l-6 18M120 26l-6 18M180 20l-6 18M214 34l-6 18", "#6a86c4", 3, 'opacity=".6"') +
    use("compass", 76, 26, 2.4, 22) + l("M112 44l10 14-8 6 10 12", "k", 3.4) + use("mapper", 20, 84, 1.4, -14) + use("skull", 176, 86, 1.1, 8));

  /* ------------------------------- API ------------------------------- */
  A.ART = S;
  /* ilustraciones generadas (tools/gen-art.mjs): solo se usan las que existen en assets/gen/manifest.json; debajo siempre va la version vectorial */
  A.GEN = new Set();
  A.genReady = fetch("assets/gen/manifest.json").then(r => (r.ok ? r.json() : [])).then(l => { A.GEN = new Set(l); }).catch(() => {});
  A.genFill = (root = document) => A.genReady.then(() => root.querySelectorAll("img[data-gen]:not([src])").forEach(im => {
    if (!A.GEN.has(im.dataset.gen)) return;
    im.onload = () => { im.classList.add("on"); if (im.parentElement) im.parentElement.classList.add("has-gen"); };
    im.src = "assets/gen/" + im.dataset.gen + ".jpg";
  }));
  A.pic = (id, cls = "", vec) => { setTimeout(() => A.genFill(), 0); return `<span class="pic ${cls}">${A.art(vec || id, "bare")}<img class="pic-img" alt="" data-gen="${id}" decoding="async"><i class="pic-frame"></i></span>`; };
  A.art = (id, cls = "") => (S[id] ? S[id].replace('class="art"', `class="art ${cls}"`).replace(/id="artc"/g, `id="artc-${id}"`).replace(/url\(#artc\)/g, `url(#artc-${id})`).replace(/clip-path="url\(#artc\)"/g, `clip-path="url(#artc-${id})"`) : "");
})(window.AIQ);
