/*
 * Atlas IQ - visor del mapa.
 *  - Capa base (#map): oceano, retícula con coordenadas, paises. Solo se redibuja al mover la camara.
 *  - Capa de efectos (#fx): pais resaltado, chinchetas, linea, etiquetas, cursor de precision. Se redibuja cada frame si hace falta.
 *  - Todo es vectorial: se ve nitido a cualquier zoom y densidad de pixeles.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const { project, unproject, D2R } = A.geo;
  const BX0 = -Math.PI, BX1 = Math.PI, BY0 = -1.5, BY1 = 2.1;      // limites del mundo (Miller)

  const INK = "#14232b", PAPER = "#f2e9d6", RED = "#e0492b", BRASS = "#c8963e";
  const OCEAN_TOP = "#12414f", OCEAN_BOT = "#092632";
  const LAND = ["#efe5cc", "#e3d4ac", "#d5dbb7", "#e9c3a5", "#dbcdb8", "#cdd9c6"];

  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBounce = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  const fmtCoord = (v, pos, neg) => Math.abs(v).toFixed(2) + "°" + (v >= 0 ? pos : neg);

  class MapView {
    constructor(canvas, world, onPick) {
      this.cv = canvas; this.ctx = canvas.getContext("2d");
      this.fx = document.createElement("canvas"); this.fx.id = "fx";
      canvas.after(this.fx); this.fctx = this.fx.getContext("2d");
      this.world = world; this.onPick = onPick || (() => {});
      this.view = { cx: 0, cy: 0.3, s: 100 };
      this.homeSpec = { lat: 0, lon: 0, zoom: 1 };
      this.anim = null; this.drift = null;
      this.marks = this._emptyMarks();
      this.pickEnabled = false; this.mouse = null;
      this.dirty = true; this.fxDirty = true;
      this.pointers = new Map();
      this._bind(); this.resize();
      // patron rayado para el pais resaltado
      const p = document.createElement("canvas"); p.width = p.height = 20;
      const pc = p.getContext("2d"); pc.strokeStyle = "rgba(224,73,43,.85)"; pc.lineWidth = 3;
      pc.beginPath(); pc.moveTo(-2, 22); pc.lineTo(22, -2); pc.moveTo(-12, 12); pc.lineTo(12, -12); pc.moveTo(8, 32); pc.lineTo(32, 8); pc.stroke();
      this.hatch = this.fctx.createPattern(p, "repeat");
      if (document.fonts) document.fonts.ready.then(() => { this.dirty = this.fxDirty = true; });
      const loop = t => { this._frame(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    _emptyMarks() { return { guess: null, answer: null, highlight: null, label: null, labelAt: null, dist: "", pop: null, t0: 0 }; }
    setMarks(m) { this.marks = { ...this._emptyMarks(), ...m, t0: performance.now() }; this.fxDirty = true; }
    clearMarks() { this.marks = this._emptyMarks(); this.fxDirty = true; }
    setPick(on) {
      this.pickEnabled = on; this.fxDirty = true;
      this.fx.classList.toggle("aiming", on);
      this.cv.classList.toggle("aiming", on);
    }

    /* ---------- tamano / camara ---------- */
    resize() {
      const r = this.cv.getBoundingClientRect();
      this.dpr = Math.min(3, window.devicePixelRatio || 1);
      this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
      for (const c of [this.cv, this.fx]) { c.width = Math.round(this.W * this.dpr); c.height = Math.round(this.H * this.dpr); }
      this.minS = Math.max(this.W / (BX1 - BX0), this.H / (BY1 - BY0));
      this.maxS = this.minS * 120;
      this.view.s = Math.max(this.minS, Math.min(this.maxS, this.view.s));
      this._clamp(this.view); this.dirty = this.fxDirty = true;
    }
    _clamp(v) {
      const hw = this.W / (2 * v.s), hh = this.H / (2 * v.s);
      v.cx = hw * 2 >= BX1 - BX0 ? 0 : Math.max(BX0 + hw, Math.min(BX1 - hw, v.cx));
      v.cy = hh * 2 >= BY1 - BY0 ? (BY0 + BY1) / 2 : Math.max(BY0 + hh, Math.min(BY1 - hh, v.cy));
      return v;
    }
    setHome(spec) { this.homeSpec = { lat: spec.lat, lon: spec.lon, zoom: spec.zoom || 1 }; }
    home() {
      const h = this.homeSpec;
      if (h.zoom <= 1.001 && h.lat === 0 && h.lon === 0) return { cx: 0, cy: 0.35, s: this.minS };
      const [x, y] = project(h.lon, h.lat);
      return { cx: x, cy: y, s: this.minS * h.zoom };
    }
    animateTo(target, ms = 800) {
      const t = this._clamp({ ...target, s: Math.max(this.minS, Math.min(this.maxS, target.s)) });
      this.drift = null;
      if (ms <= 0) { this.view = t; this.anim = null; this.dirty = this.fxDirty = true; return; }
      const from = { ...this.view };
      // trayectos largos: la camara se aleja un poco a mitad de camino ("vuelo")
      const far = Math.min(1, Math.hypot(t.cx - from.cx, t.cy - from.cy) * Math.min(from.s, t.s) / Math.max(this.W, this.H));
      this.anim = { from, to: t, t0: performance.now(), ms, dip: 0.55 * far };
    }
    fitPoints(pts, pad = { l: 60, r: 60, t: 160, b: 120 }, ms = 900) {
      const ps = pts.map(([lo, la]) => project(lo, la));
      let x0 = Math.min(...ps.map(p => p[0])), x1 = Math.max(...ps.map(p => p[0]));
      let y0 = Math.min(...ps.map(p => p[1])), y1 = Math.max(...ps.map(p => p[1]));
      const MIN_SPAN = 0.3;
      if (x1 - x0 < MIN_SPAN) { const m = (x0 + x1) / 2; x0 = m - MIN_SPAN / 2; x1 = m + MIN_SPAN / 2; }
      if (y1 - y0 < MIN_SPAN) { const m = (y0 + y1) / 2; y0 = m - MIN_SPAN / 2; y1 = m + MIN_SPAN / 2; }
      const aw = this.W - pad.l - pad.r, ah = this.H - pad.t - pad.b;
      const s = Math.max(this.minS, Math.min(this.maxS, Math.min(aw / (x1 - x0), ah / (y1 - y0))));
      this.animateTo({ cx: (x0 + x1) / 2 - (pad.l - pad.r) / (2 * s), cy: (y0 + y1) / 2 + (pad.t - pad.b) / (2 * s), s }, ms);
    }
    /* deriva lenta para el menu principal */
    startDrift() {
      const v = this._clamp({ cx: 0.3, cy: 0.9, s: this.minS * 1.7 });
      this.animateTo(v, 1400); setTimeout(() => { if (!this.anim) this.drift = { base: { ...this.view }, t0: performance.now() }; }, 1500);
    }
    zoomBy(f, px = this.W / 2, py = this.H / 2, animate = true) {
      const v = this.anim ? this.anim.to : this.view;
      const [wx, wy] = this._toWorld(px, py, v);
      const s = Math.max(this.minS, Math.min(this.maxS, v.s * f));
      const t = { s, cx: wx - (px - this.W / 2) / s, cy: wy + (py - this.H / 2) / s };
      if (animate) this.animateTo(t, 240); else { this.drift = null; this.view = this._clamp(t); this.anim = null; this.dirty = this.fxDirty = true; }
    }
    _toWorld(px, py, v = this.view) { return [v.cx + (px - this.W / 2) / v.s, v.cy - (py - this.H / 2) / v.s]; }
    toScreen(x, y, v = this.view) { return [this.W / 2 + (x - v.cx) * v.s, this.H / 2 - (y - v.cy) * v.s]; }
    lonLatToScreen(lon, lat) { const [x, y] = project(lon, lat); return this.toScreen(x, y); }

    /* ---------- interaccion ---------- */
    _bind() {
      const cv = this.cv; cv.style.touchAction = "none";
      cv.addEventListener("pointerdown", e => {
        cv.setPointerCapture(e.pointerId); this.drift = null;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
        if (this.pointers.size === 2) this._pinch = this._pinchState();
      });
      cv.addEventListener("pointermove", e => {
        if (e.pointerType === "mouse") { const r = cv.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; this.fxDirty = true; }
        const p = this.pointers.get(e.pointerId); if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
        if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > (e.pointerType === "touch" ? 10 : 5)) p.moved = true;
        if (this.pointers.size === 1 && p.moved) {
          this.anim = null; this.view.cx -= dx / this.view.s; this.view.cy += dy / this.view.s;
          this._clamp(this.view); this.dirty = this.fxDirty = true; cv.classList.add("grabbing"); this.fx.classList.add("grabbing");
        } else if (this.pointers.size === 2) {
          const st = this._pinchState();
          if (this._pinch && this._pinch.d > 0) { this.anim = null; const r = cv.getBoundingClientRect(); this.zoomBy(st.d / this._pinch.d, st.mx - r.left, st.my - r.top, false); }
          this._pinch = st;
        }
      });
      cv.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { this.mouse = null; this.fxDirty = true; } });
      const up = e => {
        const p = this.pointers.get(e.pointerId); if (!p) return;
        this.pointers.delete(e.pointerId); cv.classList.remove("grabbing"); this.fx.classList.remove("grabbing");
        if (!p.moved && this.pointers.size === 0 && !this._wasPinch && e.type === "pointerup") {
          const r = cv.getBoundingClientRect(); this._tap(e.clientX - r.left, e.clientY - r.top);
        }
        this._wasPinch = this.pointers.size > 0; if (this.pointers.size === 0) this._wasPinch = false;
      };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      cv.addEventListener("wheel", e => {
        e.preventDefault(); const r = cv.getBoundingClientRect();
        this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX - r.left, e.clientY - r.top, false);
      }, { passive: false });
      new ResizeObserver(() => this.resize()).observe(cv);
    }
    _pinchState() { const [a, b] = [...this.pointers.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
    _tap(px, py) {
      if (!this.pickEnabled) return;
      const [x, y] = this._toWorld(px, py); const [lon, lat] = unproject(x, y);
      if (lon < -180 || lon > 180 || lat > 90 || lat < -90) return;
      this.onPick(lon, lat);
    }

    /* ---------- bucle ---------- */
    _frame(now) {
      if (this.anim) {
        const a = this.anim, k = Math.min(1, (now - a.t0) / a.ms), e = easeIO(k);
        const dip = 1 - a.dip * Math.sin(Math.PI * e);
        this.view = {
          cx: a.from.cx + (a.to.cx - a.from.cx) * e, cy: a.from.cy + (a.to.cy - a.from.cy) * e,
          s: Math.max(this.minS, a.from.s * Math.pow(a.to.s / a.from.s, e) * dip),
        };
        if (k >= 1) this.anim = null; this.dirty = this.fxDirty = true;
      } else if (this.drift) {
        const t = (now - this.drift.t0) / 1000, b = this.drift.base;
        this.view = this._clamp({ cx: b.cx + Math.sin(t * 0.09) * 1.1, cy: b.cy + Math.sin(t * 0.07 + 1) * 0.16, s: b.s });
        this.dirty = this.fxDirty = true;
      }
      const m = this.marks;
      if (m.guess || m.answer || m.highlight || (this.pickEnabled && this.mouse)) this.fxDirty = true;
      if (this.dirty) { this.dirty = false; this._drawBase(); }
      if (this.fxDirty) { this.fxDirty = false; this._drawFx(now); }
    }

    /* ---------- capa base ---------- */
    _grid(ctx) {
      const { W, H, view: v } = this;
      const pxDeg = (v.s * Math.PI) / 180;
      const step = [30, 15, 10, 5, 2, 1, 0.5, 0.25].find(s => s * pxDeg >= 84) || 0.25;
      ctx.lineWidth = 1; ctx.font = "500 10px 'DM Mono', monospace"; ctx.textBaseline = "top";
      const [wx0] = this._toWorld(0, 0), [wx1] = this._toWorld(W, 0);
      const [, wyTop] = this._toWorld(0, 0), [, wyBot] = this._toWorld(0, H);
      const lon0 = Math.max(-180, Math.floor((wx0 / D2R) / step) * step), lon1 = Math.min(180, Math.ceil((wx1 / D2R) / step) * step);
      const latTop = unproject(0, wyTop)[1], latBot = unproject(0, wyBot)[1];
      const lat0 = Math.max(-90, Math.floor(latBot / step) * step), lat1 = Math.min(90, Math.ceil(latTop / step) * step);
      for (let lo = lon0; lo <= lon1 + 1e-9; lo += step) {
        const x = this.toScreen(lo * D2R, 0)[0], major = Math.abs(lo % 30) < 1e-9;
        ctx.strokeStyle = major ? "rgba(190,225,230,.20)" : "rgba(190,225,230,.09)";
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        if (major || step < 30) { ctx.fillStyle = "rgba(190,225,230,.55)"; ctx.fillText(fmtCoord(lo, "E", "W").replace(".00", ""), x + 4, H - 16); }
      }
      for (let la = lat0; la <= lat1 + 1e-9; la += step) {
        const y = this.lonLatToScreen(0, la)[1], major = Math.abs(la % 30) < 1e-9;
        ctx.strokeStyle = major ? "rgba(190,225,230,.20)" : "rgba(190,225,230,.09)";
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        if (major || step < 30) { ctx.fillStyle = "rgba(190,225,230,.55)"; ctx.fillText(fmtCoord(la, "N", "S").replace(".00", ""), 8, y + 3); }
      }
      // ecuador y tropicos, punteados
      ctx.setLineDash([3, 7]); ctx.strokeStyle = "rgba(255,214,140,.32)";
      for (const la of [0, 23.4366, -23.4366]) { const y = this.lonLatToScreen(0, la)[1]; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.setLineDash([]);
    }

    _drawBase() {
      const { ctx, W, H, dpr, view: v } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, OCEAN_TOP); g.addColorStop(1, OCEAN_BOT);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const rg = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7);
      rg.addColorStop(0, "rgba(60,140,150,.20)"); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      this._grid(ctx);

      const s = v.s;
      ctx.setTransform(s * dpr, 0, 0, -s * dpr, (W / 2 - v.cx * s) * dpr, (H / 2 + v.cy * s) * dpr);
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      // aguas someras: lineas concentricas junto a la costa
      for (const [w, a] of [[26, 0.05], [16, 0.07], [8, 0.10], [3.5, 0.16]]) {
        ctx.strokeStyle = `rgba(120,205,205,${a})`; ctx.lineWidth = w / s; ctx.stroke(this.world.all);
      }
      for (const f of this.world.features) { ctx.fillStyle = f.color; ctx.fill(f.path); }
      ctx.strokeStyle = "rgba(38,52,58,.42)"; ctx.lineWidth = Math.max(0.5, Math.min(1.5, s / 300)) / s; ctx.stroke(this.world.all);
    }

    /* ---------- capa de efectos ---------- */
    _drawFx(now) {
      const { fctx: c, W, H, dpr, view: v } = this, m = this.marks;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      const age = now - m.t0;

      // pais resaltado (rayado + contorno), aparece con fundido
      const hl = m.highlight && this.world.byName[m.highlight];
      if (hl) {
        const k = Math.min(1, age / 500), s = v.s;
        c.setTransform(s * dpr, 0, 0, -s * dpr, (W / 2 - v.cx * s) * dpr, (H / 2 + v.cy * s) * dpr);
        c.globalAlpha = k;
        c.fillStyle = "rgba(224,73,43,.22)"; c.fill(hl.path);
        this.hatch.setTransform(new DOMMatrix().scale(1 / (s * dpr), -1 / (s * dpr)));
        c.fillStyle = this.hatch; c.fill(hl.path);
        c.lineJoin = "round"; c.strokeStyle = RED; c.lineWidth = 2.6 / s; c.stroke(hl.path);
        c.strokeStyle = PAPER; c.lineWidth = 0.9 / s; c.stroke(hl.path);
        c.globalAlpha = 1; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // linea, chinchetas y etiquetas
      if (m.guess || m.answer || m.labelAt) {
        const G = m.guess && this.lonLatToScreen(m.guess[0], m.guess[1]);
        const Aa = m.answer && this.lonLatToScreen(m.answer[0], m.answer[1]);
        if (G && Aa) this._line(c, m, G, Aa, age);
        if (Aa) {
          const k = Math.max(0, Math.min(1, (age - 480) / 600));
          if (age > 480) {
            const t = ((age - 480) % 1900) / 1900;
            c.strokeStyle = `rgba(242,233,214,${0.85 * (1 - t)})`; c.lineWidth = 2.5; c.beginPath(); c.arc(Aa[0], Aa[1], 10 + t * 48, 0, Math.PI * 2); c.stroke();
            c.strokeStyle = `rgba(224,73,43,${0.6 * (1 - t)})`; c.lineWidth = 2; c.beginPath(); c.arc(Aa[0], Aa[1], 8 + t * 30, 0, Math.PI * 2); c.stroke();
          }
          this._pin(c, Aa[0], Aa[1], RED, PAPER, age - 480, k);
        }
        if (G) this._pin(c, G[0], G[1], INK, PAPER, age, 1);
        // etiqueta de la respuesta
        const at = Aa || (m.labelAt && this.lonLatToScreen(m.labelAt[0], m.labelAt[1]));
        if (at && m.label && age > 520) this._chip(c, m.label, at[0], at[1] - (Aa ? 66 : 10), { center: true, font: "italic 700 17px Fraunces, Georgia, serif", alpha: Math.min(1, (age - 520) / 300) });
        // puntos flotantes
        if (G && m.pop && age > 700) {
          const t = Math.min(1, (age - 700) / 1700), y = G[1] - 52 - easeIO(t) * 46;
          c.save(); c.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
          c.font = "900 34px Fraunces, Georgia, serif"; c.textAlign = "center"; c.lineJoin = "round";
          c.lineWidth = 7; c.strokeStyle = INK; c.strokeText(m.pop, G[0], y); c.fillStyle = PAPER; c.fillText(m.pop, G[0], y); c.restore();
        }
      }

      // cursor de precision (solo con raton, mientras se puede responder)
      if (this.pickEnabled && this.mouse && !this.pointers.size) this._reticle(c, this.mouse.x, this.mouse.y);
    }

    _line(c, m, G, Aa, age) {
      const k = Math.max(0, Math.min(1, (age - 300) / 500)), e = easeIO(k);
      if (k <= 0) return;
      c.save(); c.setLineDash([1, 9]); c.lineCap = "round"; c.lineWidth = 4; c.strokeStyle = "rgba(20,35,43,.9)";
      const segs = [];
      for (const s of [-360, 0, 360]) {
        if (Math.abs(m.guess[0] + s - m.answer[0]) <= 180) segs.push([this.lonLatToScreen(m.guess[0] + s, m.guess[1]), Aa]);
        if (s !== 0 && Math.abs(m.answer[0] + s - m.guess[0]) <= 180) segs.push([G, this.lonLatToScreen(m.answer[0] + s, m.answer[1])]);
      }
      c.beginPath();
      for (const [a, b] of segs) { c.moveTo(a[0], a[1]); c.lineTo(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e); }
      c.stroke();
      c.setLineDash([]); c.lineWidth = 1.5; c.strokeStyle = "rgba(242,233,214,.7)"; c.setLineDash([1, 9]); c.lineDashOffset = 5;
      c.beginPath();
      for (const [a, b] of segs) { c.moveTo(a[0], a[1]); c.lineTo(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e); }
      c.stroke(); c.restore();
      if (m.dist && k >= 1) {
        const [a, b] = segs[0]; this._chip(c, m.dist, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { font: "500 12px 'DM Mono', monospace", center: true, alpha: Math.min(1, (age - 800) / 250) });
      }
    }

    /* etiqueta de papel con texto de tinta */
    _chip(c, text, x, y, o = {}) {
      c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.font = o.font || "600 14px sans-serif";
      const w = c.measureText(text).width + 20, h = 28;
      let rx = o.center ? x - w / 2 : x, ry = y - h / 2;
      rx = Math.max(8, Math.min(this.W - w - 8, rx)); ry = Math.max(8, Math.min(this.H - h - 8, ry));
      c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = PAPER; c.beginPath(); c.roundRect(rx, ry, w, h, 6); c.fill();
      c.shadowColor = "transparent"; c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = INK; c.textBaseline = "middle"; c.fillText(text, rx + 10, ry + h / 2 + 1); c.restore();
    }

    _pin(c, x, y, fill, ring, age, alpha) {
      if (age < 0 || alpha <= 0) return;
      const k = Math.min(1, age / 520), drop = (1 - easeOutBounce(k)) * -90;
      c.save(); c.globalAlpha = alpha;
      c.fillStyle = "rgba(0,0,0,.32)"; c.beginPath(); c.ellipse(x, y + 1, 9 * (0.4 + 0.6 * k), 3.6 * (0.4 + 0.6 * k), 0, 0, Math.PI * 2); c.fill();
      c.translate(x, y + drop);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-4, -10, -13, -15, -13, -26); c.arc(0, -26, 13, Math.PI, 0); c.bezierCurveTo(13, -15, 4, -10, 0, 0); c.closePath();
      c.fillStyle = fill; c.fill(); c.lineWidth = 2.5; c.strokeStyle = ring; c.stroke();
      c.beginPath(); c.arc(0, -26, 4.6, 0, Math.PI * 2); c.fillStyle = ring; c.fill(); c.restore();
    }

    _reticle(c, x, y) {
      c.save(); c.lineWidth = 1; c.setLineDash([2, 6]); c.strokeStyle = "rgba(242,233,214,.28)";
      c.beginPath(); c.moveTo(0, y); c.lineTo(x - 22, y); c.moveTo(x + 22, y); c.lineTo(this.W, y); c.moveTo(x, 0); c.lineTo(x, y - 22); c.moveTo(x, y + 22); c.lineTo(x, this.H); c.stroke();
      c.setLineDash([]); c.strokeStyle = PAPER; c.lineWidth = 1.6;
      c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x - 8, y); c.moveTo(x + 8, y); c.lineTo(x + 22, y); c.moveTo(x, y - 22); c.lineTo(x, y - 8); c.moveTo(x, y + 8); c.lineTo(x, y + 22); c.stroke();
      c.fillStyle = RED; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
      // marcas en los bordes, como una regla
      c.fillStyle = BRASS; c.beginPath(); c.moveTo(x - 5, 0); c.lineTo(x + 5, 0); c.lineTo(x, 8); c.fill();
      c.beginPath(); c.moveTo(0, y - 5); c.lineTo(0, y + 5); c.lineTo(8, y); c.fill();
      // coordenadas
      const [wx, wy] = this._toWorld(x, y), [lon, lat] = unproject(wx, wy);
      if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
        const txt = fmtCoord(lat, "N", "S") + "  " + fmtCoord(lon, "E", "W");
        c.font = "500 11px 'DM Mono', monospace"; const w = c.measureText(txt).width + 14;
        let bx = x + 20, by = y + 18; if (bx + w > this.W - 6) bx = x - 20 - w; if (by + 22 > this.H - 6) by = y - 40;
        c.fillStyle = "rgba(20,35,43,.88)"; c.beginPath(); c.roundRect(bx, by, w, 22, 4); c.fill();
        c.fillStyle = PAPER; c.textBaseline = "middle"; c.fillText(txt, bx + 7, by + 12);
      }
      c.restore();
    }
  }
  A.MapView = MapView;
  A.MAP_COLORS = LAND;
})(window.AIQ);
