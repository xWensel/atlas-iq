/* Solo para desarrollo: comprueba que los continentes NUNCA se pisan. Uso (consola): layoutTest() -> { worstPx, maxMs, minScale, rows }.
 * Dibuja cada continente por separado con las deformaciones del reto (poligonos reales, no mascaras) y cuenta los pixeles donde dos continentes coinciden. */
window.layoutTest = function (seeds = ["a", "b", "c", "d", "e", "f", "g", "h"]) {
  const m = window.AIQ.core.map, RW = 1200, RH = 700, cv = document.createElement("canvas"); cv.width = RW; cv.height = RH;
  const c2 = cv.getContext("2d", { willReadFrequently: true });
  const PJ = (lo, la) => { const l = Math.max(-84, Math.min(84, la)); return [lo * Math.PI / 180, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * l * Math.PI / 180))]; };
  const layers = spec => {
    m.dist.spec = spec; m.dist.kk = 1; const sx = RW / (2 * Math.PI * 1.1), sy = RH / 3.7, X = x => (x + Math.PI * 1.1) * sx, Y = y => (2.15 - y) * sy, out = [];
    for (let ct = 0; ct < 7; ct++) {
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, RW, RH); c2.fillStyle = "#fff"; c2.beginPath();
      for (const f of m.contFeat[ct]) for (const p of f.polys) for (const ring of p.rings) { ring.forEach(([lo, la], i) => { let [x, y] = PJ(lo, la); [x, y] = m._dispFwd(x, y, ct); i ? c2.lineTo(X(x), Y(y)) : c2.moveTo(X(x), Y(y)); }); c2.closePath(); }
      c2.fill("evenodd"); out.push(c2.getImageData(0, 0, RW, RH).data);
    }
    m.dist.spec = null; m.dist.kk = 0; return out;
  };
  const pairs = spec => { const L = layers(spec), res = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 7; j++) { let n = 0; for (let q = 3; q < L[i].length; q += 4) if (L[i][q] > 200 && L[j][q] > 200) n++; if (n > 3) res.push(i + "-" + j + ":" + n); } return res; };
  const rows = []; let worst = 0, maxMs = 0, minScale = 1;
  for (const kind of ["shuffle", "pangea", "spread", "hold"]) for (const seed of seeds) {
    const rot = kind === "hold" ? [0.5, -0.5, 0.6, -0.4, 0.5, -0.6, 0].map(v => v * (seed.charCodeAt(0) % 2 ? 1 : -1)) : [0, 0, 0, 0, 0, 0, 0];
    const t0 = performance.now(), L = m.layout(kind, kind === "pangea" ? 0.8 : 1, window.AIQ.rng(seed), rot), ms = Math.round(performance.now() - t0);
    const pr = pairs({ shift: L.shift, rot, scale: L.scale }), px = pr.reduce((a, s) => a + +s.split(":")[1], 0);
    worst = Math.max(worst, px); maxMs = Math.max(maxMs, ms); minScale = Math.min(minScale, L.scale[0]);
    rows.push(`${kind}:${seed} ok=${L.ok} s=${L.scale[0].toFixed(2)} ${ms}ms ${pr.join(",") || "libre"}`);
  }
  return { worstPx: worst, maxMs, minScale, rows };
};
