/* Atlas IQ - geometria: proyeccion Miller, distancias y construccion del mundo. */
window.AIQ = window.AIQ || {};
(function (A) {
  const D2R = Math.PI / 180;
  const R_KM = 6371.0088;

  /* Proyeccion cilindrica de Miller (invertible, finita en los polos) */
  function project(lon, lat) {
    return [lon * D2R, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * D2R))];
  }
  function unproject(x, y) {
    return [x / D2R, (2.5 * (Math.atan(Math.exp(0.8 * y)) - Math.PI / 4)) / D2R];
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * D2R, dLon = (lon2 - lon1) * D2R;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(dLon / 2) ** 2;
    return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  const wrap = d => (d > 180 ? d - 360 : d < -180 ? d + 360 : d);

  /* ---------- punto dentro de poligono (lon/lat planos) ---------- */
  function inRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function inPoly(lon, lat, poly) {
    const b = poly.bbox;
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) return false;
    if (!inRing(lon, lat, poly.rings[0])) return false;
    for (let i = 1; i < poly.rings.length; i++) if (inRing(lon, lat, poly.rings[i])) return false;
    return true;
  }
  function inFeature(lon, lat, f) {
    for (const p of f.polys) {
      if (inPoly(lon, lat, p) || inPoly(lon + 360, lat, p) || inPoly(lon - 360, lat, p)) return true;
    }
    return false;
  }

  /* ---------- distancia (km) de un punto al borde de un pais ---------- */
  function segDistKm(lon, lat, a, b) {
    const midLat = (a[1] + b[1]) / 2;
    const kx = 111.32 * Math.cos(((lat + midLat) / 2) * D2R), ky = 110.574;
    const ax = wrap(a[0] - lon) * kx, ay = (a[1] - lat) * ky;
    const bx = wrap(b[0] - lon) * kx, by = (b[1] - lat) * ky;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? -(ax * dx + ay * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(ax + t * dx, ay + t * dy);
  }
  function distToFeature(lon, lat, f) {
    if (inFeature(lon, lat, f)) return 0;
    let best = Infinity;
    for (const p of f.polys) {
      // descarte rapido por caja: distancia minima posible a la bbox
      const b = p.bbox;
      const cx = Math.max(b[0], Math.min(lon, b[2])), cy = Math.max(b[1], Math.min(lat, b[3]));
      if (haversine(lat, lon, cy, cx) > best) continue;
      const ring = p.rings[0];
      for (let i = 0; i < ring.length - 1; i++) {
        const d = segDistKm(lon, lat, ring[i], ring[i + 1]);
        if (d < best) best = d;
      }
    }
    return best;
  }

  /* ---------- construccion del mundo a partir del TopoJSON ---------- */
  const PALETTE = ["#efe5cc", "#e3d4ac", "#d5dbb7", "#e9c3a5", "#dbcdb8", "#cdd9c6"];

  function buildWorld() {
    const topo = window.ATLAS_TOPO;
    const obj = topo.objects.countries;
    const fc = window.topojson.feature(topo, obj);
    const nb = window.topojson.neighbors(obj.geometries);

    // coloreado voraz: dos paises vecinos nunca comparten color
    const colorIdx = new Array(fc.features.length).fill(-1);
    const order = fc.features.map((_, i) => i).sort((a, b) => nb[b].length - nb[a].length);
    for (const i of order) {
      const used = new Set(nb[i].map(j => colorIdx[j]));
      let c = 0;
      while (used.has(c)) c++;
      colorIdx[i] = c % PALETTE.length;
    }

    // Los anillos que cruzan la linea de fecha (+-180) se "desenrollan" para no dibujar rayas
    const unwrap = ring => {
      const out = []; let off = 0, prev = null;
      for (const [lo, la] of ring) {
        let x = lo + off;
        if (prev !== null) {
          if (x - prev > 180) { off -= 360; x -= 360; } else if (x - prev < -180) { off += 360; x += 360; }
        }
        out.push([x, la]); prev = x;
      }
      return out;
    };
    const TWO_PI = 2 * Math.PI;

    const features = fc.features.map((ft, i) => {
      const g = ft.geometry;
      const polysRaw = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      const path = new Path2D();
      const polys = polysRaw.map(rawRings => {
        const rings = rawRings.map(unwrap);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const [lo, la] of rings[0]) {
          if (lo < x0) x0 = lo; if (lo > x1) x1 = lo;
          if (la < y0) y0 = la; if (la > y1) y1 = la;
        }
        const pp = new Path2D();
        for (const ring of rings) {
          ring.forEach(([lo, la], k) => {
            const [x, y] = project(lo, la);
            if (k === 0) pp.moveTo(x, y); else pp.lineTo(x, y);
          });
          pp.closePath();
        }
        path.addPath(pp);
        if (x1 > 180) path.addPath(pp, new DOMMatrix().translate(-TWO_PI, 0));
        if (x0 < -180) path.addPath(pp, new DOMMatrix().translate(TWO_PI, 0));
        return { rings, bbox: [x0, y0, x1, y1] };
      });
      const name = ft.properties.name;
      return {
        name, polys, path,
        color: name === "Antarctica" ? "#f4efe3" : PALETTE[colorIdx[i]],
      };
    });

    const byName = {};
    features.forEach(f => (byName[f.name] = f));
    const all = new Path2D();
    features.forEach(f => all.addPath(f.path));
    return { features, byName, all };
  }

  A.geo = { D2R, R_KM, project, unproject, haversine, inFeature, distToFeature, buildWorld };
})(window.AIQ);
