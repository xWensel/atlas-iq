/* Solo para desarrollo: detecta solapes entre paneles del HUD/dialogos y elementos que se salen de la pantalla. Uso (consola): ovCheck() */
window.ovCheck = function (extra = []) {
  const sel = ["#plate", "#ledger", "#advBar", "#toolBar", "#note", "#dock", "#rail", ".dealer", "#streakChip", ".brand", "#dlg .sheet", "#np", ".cx-toast:not(.hidden)", ".v-actions", ".v-lines", ".v-stats", ".v-side", ".tb-head", ".tb-tray", ".offers", ...extra];
  const rects = {};
  for (const s of sel) {
    const e = document.querySelector(s); if (!e) continue;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width && r.height && cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05 && !e.closest(".hidden")) rects[s] = [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
  }
  const ov = [], k = Object.keys(rects);
  for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) {
    const a = rects[k[i]], b = rects[k[j]], w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
    if (w > 4 && h > 4 && !(document.querySelector(k[i]).contains(document.querySelector(k[j])) || document.querySelector(k[j]).contains(document.querySelector(k[i])))) ov.push(`${k[i]} x ${k[j]} ${w}x${h}`);
  }
  const off = Object.entries(rects).filter(([, r]) => r[0] < -2 || r[1] < -2 || r[2] > innerWidth + 2 || r[3] > innerHeight + 2).map(([s, r]) => s + ":" + r);
  return { vw: [innerWidth, innerHeight], ov, off, rects };
};
