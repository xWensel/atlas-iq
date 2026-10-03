/* Solo para desarrollo: comprueba los retos que mueven continentes (Pangea, Big bang, Continentes torcidos, Continentes barajados y Gigantes y enanos) en sus tres niveles. Uso (consola, con el
 * mapa cargado): mapTest() -> { worstPx, rejected, tripPx, hiddenExtra, ringJumpPx, maxMs, rows }
 *  - worstPx: pixeles donde se pisan dos continentes, dibujando TODAS sus copias como la GPU (la propia y las de +-2pi, que la siguen a una vuelta)
 *  - rejected: clics de una rejilla que caen fuera del mundo (antes el juego los tiraba); tripPx: ida y vuelta pantalla -> lon/lat -> pantalla con el
 *    mismo marco (debe ser ~0)
 *  - hiddenExtra: la parte de tierra visible en su sitio que se tapa al moverlo (HUD o fuera de la vista de inicio; tope: 0,04)
 *  - ringJumpPx: el mayor salto entre puntos seguidos de un anillo del Sonar de 2.500 km (sin contar el corte del antimeridiano) */
window.mapTest = function (seeds = ["a", "b", "c", "d", "e", "f"]) {
  const A = window.AIQ, m = A.core.map, TAU = Math.PI * 2, P = A.geo.project;
  const RW = 1200, RH = 700, cv = document.createElement("canvas"); cv.width = RW; cv.height = RH;
  const c2 = cv.getContext("2d", { willReadFrequently: true }), sx = RW / (TAU * 1.1), sy = RH / 3.7, X = x => (x + Math.PI * 1.1) * sx, Y = y => (2.15 - y) * sy;
  const Z = A.chal.hudZones(m);
  /* copias de cada poligono como en _initGL: la propia (la del lado de su continente) y las que caen dentro del mundo */
  const polys = []; for (const f of m.world.features) for (const p of f.polys) {
    const pc = p.ct, own = pc < 6 ? TAU * Math.round((m.contCen[pc][0] - (p.bbox[0] + p.bbox[2]) / 2 * Math.PI / 180) / TAU) : 0, sh = [0];
    if (p.bbox[2] > 180) sh.push(-TAU); if (p.bbox[0] < -180) sh.push(TAU); if (!sh.includes(own)) sh.push(own);
    polys.push({ p, pc, own, sh });
  }
  const layers = (spec) => {
    const T = c => { const cc = m.contCen[c], a = (spec.rot && spec.rot[c]) || 0, s = spec.scale[c], t = spec.shift[c]; return (x, y) => { const dx = x - cc[0], dy = y - cc[1]; return [cc[0] + s * (Math.cos(a) * dx - Math.sin(a) * dy) + t[0], cc[1] + s * (Math.sin(a) * dx + Math.cos(a) * dy) + t[1]]; }; };
    const out = [];
    for (let ct = 0; ct < 7; ct++) {
      const tf = T(ct); c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, RW, RH); c2.fillStyle = "#fff"; c2.beginPath();
      for (const q of polys) if (q.pc === ct) for (const shift of q.sh) {
        const w = ct < 6 ? Math.round((shift - q.own) / TAU) * TAU : 0;       // la copia = la propia movida + w (como el shader)
        for (const ring of q.p.rings) { ring.forEach(([lo, la], i) => { let [x, y] = P(lo, Math.max(-89.99, Math.min(89.99, la))); [x, y] = tf(x + shift - w, y); x += w; i ? c2.lineTo(X(x), Y(y)) : c2.moveTo(X(x), Y(y)); }); c2.closePath(); }
      }
      c2.fill("evenodd"); out.push(c2.getImageData(0, 0, RW, RH).data);
    }
    return out;
  };
  const overlap = spec => { const L = layers(spec); let n = 0; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 7; j++) for (let q = 3; q < L[i].length; q += 4) if (L[i][q] > 200 && L[j][q] > 200) n++; return n; };
  const save = { spec: m.dist.spec, k: m.dist.k, kk: m.dist.kk, kl: m.dist.kl, ko: m.dist.ko, ct: m.dist.ct };
  const rest = [0, 1, 2, 3, 4, 5].map(c => m._hidden(c, { x: 0, y: 0, s: 1, c: 1, n: 0 }, Z));   // celdas tapadas en su sitio
  const rows = []; let worst = 0, rej = 0, trip = 0, hidEx = 0, jump = 0, maxMs = 0;
  const KS = { pangea: [0.6, 0.8, 1], spread: [0.5, 0.8, 1], hold: [1, 1, 1], mix: [0.6, 0.85, 1], giants: [1, 1, 1] }, TILT = [0.4, 0.65, 0.9];
  Object.assign(KS, window.mapTestKs || {});   // tanda 16: los k de los jefes (Un solo continente: de 0,45 a 1; Falsa alarma: 0,8 y 0,9 y barajados de 0,85 a 1)
  try {
    for (const kind of ["pangea", "spread", "hold", "mix", "giants"]) for (let lv = 0; lv < KS[kind].length; lv++) for (const seed of kind === "hold" || kind === "mix" || kind === "giants" ? seeds : seeds.slice(0, 1)) {
      const rr = A.rng(seed + ":m:" + lv), rot = kind === "hold" ? [0, 1, 2, 3, 4, 5].map(() => (rr() < 0.5 ? -1 : 1) * (0.3 + rr() * 0.45) * TILT[lv]).concat([0]) : [0, 0, 0, 0, 0, 0, 0];
      const t0 = performance.now(), scl = kind === "giants" ? A.chal.giantScales(lv + 1, seed + ":gd:" + lv) : undefined, L = m.layout(kind, KS[kind][lv], rr, rot, Z, scl), ms = Math.round(performance.now() - t0), spec = { shift: L.shift, scale: L.scale, rot };
      const px = overlap(spec); worst = Math.max(worst, px); maxMs = Math.max(maxMs, ms);
      const he = Math.max(...[0, 1, 2, 3, 4, 5].map(c => m._hidden(c, { x: L.shift[c][0], y: L.shift[c][1], s: L.scale[c], c: Math.cos(rot[c]), n: Math.sin(rot[c]) }, Z, rest[c]))); hidEx = Math.max(hidEx, he);   // parte que se tapa de nuevo
      let r0 = 0, t = 0, j = 0;
      for (let q = 0; q < 6; q++) {                                        // una pregunta en cada continente: cambia el que se prefiere para el mar
        Object.assign(m.dist, { spec: { ...spec, ct: q }, k: 1, kk: 1, kl: 1, ko: 0, ct: q });
        for (let y = 20; y < m.H; y += 40) for (let x = 20; x < m.W; x += 40) {
          const ll = m.screenToLonLat(x, y), ct = m.lastCt; if (!(ll[0] >= -180 && ll[0] <= 180 && ll[1] >= -90 && ll[1] <= 90)) { r0++; continue; }
          if (Math.abs(ll[1]) < 89) { const s = m.lonLatToScreen(ll[0], ll[1], ct); t = Math.max(t, Math.hypot(s[0] - x, s[1] - y)); }
          if (q === 0 && x % 200 === 20 && y % 200 === 20 && Math.abs(ll[1]) < 50) {   // anillo de 2.500 km alrededor del punto, en su marco (lejos de los polos: alli el anillo recorre el mapa de lado a lado)
            let prev = null; for (let i = 0; i <= 96; i++) { const b = i / 96 * TAU, d = 2500 / 6371, la = ll[1] * Math.PI / 180, lo = ll[0] * Math.PI / 180, la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b)), lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2)); const s = m.lonLatToScreen(((lo2 * 180 / Math.PI + 540) % 360) - 180, la2 * 180 / Math.PI, ct); if (prev) { const dd = Math.hypot(s[0] - prev[0], s[1] - prev[1]); if (Math.abs(s[0] - prev[0]) < m.W * 0.6) j = Math.max(j, dd); } prev = s; }
          }
        }
      }
      rej += r0; trip = Math.max(trip, t); jump = Math.max(jump, j);
      rows.push(`${kind}:${lv + 1}:${seed} ok=${L.ok} ${ms}ms s=${L.scale.slice(0, 6).map(v => v.toFixed(2)).join("/")} solape=${px}px rechazados=${r0} idaVuelta=${t.toFixed(1)}px tapadoExtra=${he.toFixed(2)} saltoAnillo=${j.toFixed(0)}px`);
    }
  } finally { Object.assign(m.dist, save); m.dirty = m.fxDirty = true; }
  const fails = rows.filter(r => /ok=false/.test(r)).length;
  return { fails, worstPx: worst, rejected: rej, tripPx: +trip.toFixed(1), hiddenExtra: +hidEx.toFixed(2), ringJumpPx: Math.round(jump), maxMs, rows };
};
