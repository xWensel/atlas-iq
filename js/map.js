/*
 * Atlas IQ - visor del mapa (v0.3, WebGL2).
 *
 *  El mapa se dibuja SIEMPRE como vector puro en la GPU, en cada frame y a la resolucion real de la pantalla:
 *    - Los paises se trianguian una sola vez (earcut) y viven en buffers de la GPU.
 *    - Las fronteras son segmentos instanciados con ancho constante en pixeles (nitidos a cualquier zoom).
 *    - El resplandor de costas y el sombreado de litoral salen de una silueta desenfocada en la GPU (ancho constante en pantalla).
 *    - La retícula (grados) se calcula en el shader con antialiasing exacto y fundido entre niveles de detalle.
 *    - Post-proceso "sensorial": desenfoque radial + aberracion cromatica segun la velocidad de zoom, viñeta y grano.
 *  Camara con fisica: zoom suavizado hacia el cursor, inercia al soltar y velocidades para efectos y sonido.
 *  Si no hay WebGL2 se usa MapView2D (map2d.js).
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const { project, unproject, D2R } = A.geo;
  const BX0 = -Math.PI, BX1 = Math.PI, BY0 = -1.5, BY1 = 2.1;
  const TWO_PI = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBounce = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  const fmtCoord = (v, pos, neg) => Math.abs(v).toFixed(2) + "°" + (v >= 0 ? pos : neg);
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

  /* ------------------------------------------------------------------ estilos de mapa (lo eligen los skins) */
  A.MAPSTYLES = A.MAPSTYLES || {};
  A.MAPSTYLES.expedicion = {
    style: 0, oceanTop: "#15495a", oceanBot: "#082330", shallow: "#3a97a0",
    land: ["#efe5cc", "#e3d4ac", "#d5dbb7", "#e9c3a5", "#dbcdb8", "#cdd9c6", "#f4efe3"],
    line: [0.15, 0.2, 0.23, 0.5], lineW: 1.15, lineOff: [0, 0], lineOffCol: [0, 0, 0, 0],
    grid: "#bee1e6", gridA: 0.2, tropic: "#ffd68c",
    ao: 0.16, grain: 0.03, vignette: 0.42, postGrain: 0.035, tint: [1, 1, 1],
    ink: "#14232b", paper: "#f2e9d6", red: "#e0492b", brass: "#c8963e", hl: "#e0492b",
  };

  /* ------------------------------------------------------------------ shaders */
  const VS_FILL = `#version 300 es
layout(location=0) in vec2 a_pos; layout(location=1) in float a_ci;
uniform vec2 u_center; uniform float u_scale; uniform vec2 u_res;
flat out float v_ci;
void main(){ vec2 p=(a_pos-u_center)*u_scale; gl_Position=vec4(p/(0.5*u_res),0.0,1.0); v_ci=a_ci; }`;

  const FS_SIL = `#version 300 es
precision mediump float; out vec4 o; void main(){ o=vec4(1.0); }`;

  const NOISE = `
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }`;

  const FS_LAND = `#version 300 es
precision highp float;
flat in float v_ci;
uniform vec3 u_pal[8]; uniform vec2 u_res; uniform sampler2D u_blurN; uniform vec4 u_fx; // ao, grain
out vec4 o;
${NOISE}
void main(){
  vec3 c=u_pal[int(v_ci+0.5)];
  vec2 uv=gl_FragCoord.xy/u_res;
  float n=texture(u_blurN,uv).r;
  float ao=smoothstep(0.60,0.97,n);
  c*=mix(1.0-u_fx.x,1.0,ao);
  c+=(hash(gl_FragCoord.xy)-0.5)*u_fx.y;
  o=vec4(c,1.0);
}`;

  const FS_HATCH = `#version 300 es
precision highp float;
flat in float v_ci; uniform vec3 u_col; uniform float u_dpr; uniform float u_alpha;
out vec4 o;
void main(){
  float s=step(0.5,fract((gl_FragCoord.x+gl_FragCoord.y)/(9.0*u_dpr)));
  float a=(0.22+0.55*s)*u_alpha;
  o=vec4(u_col*a,a);
}`;

  const VS_LINE = `#version 300 es
layout(location=0) in vec2 a_q; layout(location=1) in vec4 a_seg;
uniform vec2 u_center; uniform float u_scale; uniform vec2 u_res; uniform float u_width; uniform vec2 u_off;
out float v_d; out float v_hw;
void main(){
  vec2 p0=(a_seg.xy-u_center)*u_scale+u_off, p1=(a_seg.zw-u_center)*u_scale+u_off;
  vec2 dir=p1-p0; float len=length(dir); dir=len>0.0001?dir/len:vec2(1.0,0.0);
  vec2 nrm=vec2(-dir.y,dir.x);
  float hw=u_width*0.5+1.0;
  vec2 p=mix(p0,p1,a_q.x)+dir*(a_q.x*2.0-1.0)*hw+nrm*a_q.y*hw;
  v_d=a_q.y*hw; v_hw=u_width*0.5;
  gl_Position=vec4(p/(0.5*u_res),0.0,1.0);
}`;
  const FS_LINE = `#version 300 es
precision highp float; in float v_d; in float v_hw; uniform vec4 u_col; out vec4 o;
void main(){ float a=clamp(v_hw-abs(v_d)+0.5,0.0,1.0); o=vec4(u_col.rgb,u_col.a*a); }`;

  const VS_FULL = `#version 300 es
void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(p*2.0-1.0,0.0,1.0); }`;

  const FS_BLUR = `#version 300 es
precision mediump float; uniform sampler2D u_tex; uniform vec2 u_dir; uniform vec2 u_res; out vec4 o;
void main(){
  vec2 uv=gl_FragCoord.xy/u_res; float w[5]=float[5](0.2270,0.1945,0.1216,0.0540,0.0162); float s=texture(u_tex,uv).r*w[0];
  for(int i=1;i<5;i++){ s+=texture(u_tex,uv+u_dir*float(i)).r*w[i]; s+=texture(u_tex,uv-u_dir*float(i)).r*w[i]; }
  o=vec4(s,s,s,1.0);
}`;

  const FS_OCEAN = `#version 300 es
precision highp float;
uniform vec2 u_center; uniform float u_scale; uniform vec2 u_res; uniform float u_dpr;
uniform sampler2D u_blurN; uniform sampler2D u_blurW;
uniform vec3 u_oTop; uniform vec3 u_oBot; uniform vec3 u_shallow; uniform vec3 u_grid; uniform vec3 u_tropic;
uniform vec4 u_gp; // stepA, stepB, tB, gridAlpha
out vec4 o;
const float D2R=0.017453292519943295;
${NOISE}
float lineAlpha(float dpx){ return clamp(0.5*u_dpr*1.2+0.5-dpx,0.0,1.0); }
vec2 gridLevel(float stp, vec2 wp, float lonDeg, float latDeg, float pxPerDeg){
  float dl=abs(mod(lonDeg+stp*0.5,stp)-stp*0.5);
  float lonLine=floor(lonDeg/stp+0.5)*stp;
  float k=floor(latDeg/stp+0.5); float latLine=k*stp;
  float dLat=1e6; float majLat=0.0;
  if(abs(latLine)<89.9){ float yL=1.25*log(tan(0.78539816339+0.4*latLine*D2R)); dLat=abs(wp.y-yL)*u_scale; majLat=step(abs(mod(latLine+15.0,30.0)-15.0),0.001); }
  float majLon=step(abs(mod(lonLine+15.0,30.0)-15.0),0.001);
  float a=lineAlpha(dl*pxPerDeg)*(0.45+0.55*majLon);
  float b=lineAlpha(dLat)*(0.45+0.55*majLat);
  return vec2(max(a,b),0.0);
}
void main(){
  vec2 frag=gl_FragCoord.xy; vec2 uv=frag/u_res;
  vec2 wp=u_center+(frag-0.5*u_res)/u_scale;
  float lonDeg=wp.x/D2R; float latDeg=degrees(2.5*(atan(exp(0.8*wp.y))-0.78539816339));
  float pxPerDeg=u_scale*D2R;
  vec3 ocean=mix(u_oBot,u_oTop,uv.y);
  float r=length((uv-vec2(0.5,0.55))*vec2(u_res.x/u_res.y,1.0));
  ocean+=0.06*exp(-r*r*3.0);
  float w=texture(u_blurW,uv).r; float n=texture(u_blurN,uv).r;
  ocean=mix(ocean,u_shallow,clamp(smoothstep(0.03,0.42,w)*0.70+smoothstep(0.02,0.5,n)*0.30,0.0,1.0));
  // reticula con dos niveles de detalle fundidos
  float ga=gridLevel(u_gp.x,wp,lonDeg,latDeg,pxPerDeg).x;
  float gb=gridLevel(u_gp.y,wp,lonDeg,latDeg,pxPerDeg).x*u_gp.z;
  float g=max(ga,gb)*u_gp.w;
  ocean=mix(ocean,u_grid,g);
  // ecuador y tropicos punteados
  float dash=step(0.5,fract(frag.x/(11.0*u_dpr)));
  float yE=0.0; float t=0.0;
  float dE=abs(wp.y-yE)*u_scale;
  float yT=1.25*log(tan(0.78539816339+0.4*23.4366*D2R));
  float dT=min(abs(wp.y-yT),abs(wp.y+yT))*u_scale;
  t=max(lineAlpha(dE),lineAlpha(dT))*dash*0.55;
  ocean=mix(ocean,u_tropic,t);
  ocean+=(hash(frag*0.91)-0.5)*0.014;
  o=vec4(ocean,1.0);
}`;

  const FS_POST = `#version 300 es
precision highp float;
uniform sampler2D u_scene; uniform vec2 u_res; uniform vec2 u_zc; uniform float u_zv; uniform vec2 u_pv; uniform float u_vig; uniform float u_grain; uniform vec3 u_tint; uniform float u_time;
out vec4 o;
${NOISE}
void main(){
  vec2 frag=gl_FragCoord.xy; vec2 uv=frag/u_res;
  vec2 toC=(u_zc-frag);
  float zvA=clamp(u_zv,-4.0,4.0);
  vec2 off=toC*zvA*0.06+u_pv*0.014;
  float lenPx=length(off);
  if(lenPx>40.0) off*=40.0/lenPx;
  vec3 col=vec3(0.0);
  const int N=12;
  for(int i=0;i<N;i++){
    float t=float(i)/float(N-1)-0.5;
    vec2 p=uv+off*t/u_res;
    col+=texture(u_scene,p).rgb;
  }
  col/=float(N);
  // aberracion cromatica proporcional a la velocidad
  float ca=min(lenPx,40.0)*0.0009;
  vec2 dir=normalize(toC+vec2(0.0001));
  col.r=mix(col.r,texture(u_scene,uv+dir*ca*u_res.y/u_res*0.5).r,step(0.001,ca));
  col.b=mix(col.b,texture(u_scene,uv-dir*ca*u_res.y/u_res*0.5).b,step(0.001,ca));
  // viñeta (se cierra un poco al hacer zoom) y grano
  vec2 q=uv-0.5; float v=1.0-u_vig*smoothstep(0.30,0.95,length(q*vec2(1.05,1.0))+min(abs(zvA)*0.02,0.08));
  col*=v*u_tint;
  col+=(hash(frag+fract(u_time)*61.0)-0.5)*u_grain;
  gl_FragColor_placeholder
}`.replace("gl_FragColor_placeholder", "o=vec4(col,1.0);");

  const VS_LABEL = null;

  const earcutFn = () => (typeof window.earcut === "function" ? window.earcut : window.earcut && window.earcut.default);

  function compile(gl, vs, fs) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + "\n" + s.slice(0, 200)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    p.u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); p.u[info.name.replace("[0]", "")] = gl.getUniformLocation(p, info.name); }
    return p;
  }
  function buildPrograms(gl) {
    return {
      sil: compile(gl, VS_FILL, FS_SIL), land: compile(gl, VS_FILL, FS_LAND), hatch: compile(gl, VS_FILL, FS_HATCH),
      line: compile(gl, VS_LINE, FS_LINE), blur: compile(gl, VS_FULL, FS_BLUR), ocean: compile(gl, VS_FULL, FS_OCEAN), post: compile(gl, VS_FULL, FS_POST),
    };
  }

  /* ================================================================== MapViewGL */
  class MapViewGL {
    static supported() {
      try {
        const c = document.createElement("canvas"); const gl = c.getContext("webgl2"); if (!gl || !earcutFn()) return false;
        buildPrograms(gl); return true;
      } catch (e) { console.warn("WebGL2 no disponible, uso el respaldo 2D:", e.message); return false; }
    }

    constructor(canvas, world, onPick) {
      this.cv = canvas; this.world = world; this.onPick = onPick || (() => {}); this.onView = null; this.onMotion = null;
      this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
      this.fx = document.createElement("canvas"); this.fx.id = "fx"; canvas.after(this.fx); this.fctx = this.fx.getContext("2d");
      this.view = { cx: 0, cy: 0.3, s: 100 }; this.tv = null; this.inertia = null;
      this.homeSpec = { lat: 0, lon: 0, zoom: 1 };
      this.anim = null; this.drift = null;
      this.marks = this._emptyMarks(); this.pickEnabled = false; this.mouse = null;
      this.quality = "auto"; this.rs = 1; this.frameEma = 0; this.baseDt = 1e9; this.lastT = 0; this.calm = 0;
      this.fxOn = true; this.zv = 0; this.lastLz = null; this.pv = [0, 0]; this.zc = null; this.lastView = { cx: 0, cy: 0, s: 0 };
      this.dirty = this.fxDirty = true; this.pointers = new Map(); this.samples = [];
      this.sk = A.MAPSTYLES.expedicion; this.ms = this._prepStyle(this.sk);
      this._initGL(); this._bind(); this.resize(true);
      canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); this.lost = true; });
      canvas.addEventListener("webglcontextrestored", () => { this.lost = false; this._initGL(); this.resize(true); });
      if (document.fonts) document.fonts.ready.then(() => { this.dirty = this.fxDirty = true; });
      const loop = t => { this._frame(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    /* ---------- estilo ---------- */
    _prepStyle(st) {
      return {
        raw: st, oTop: hex(st.oceanTop), oBot: hex(st.oceanBot), shallow: hex(st.shallow), grid: hex(st.grid), tropic: hex(st.tropic),
        pal: st.land.map(hex), line: st.line, hl: hex(st.hl || "#e0492b"),
      };
    }
    setStyle(st) { this.sk = st; this.ms = this._prepStyle(st); this.dirty = this.fxDirty = true; }
    setAnchor(px, py) { this.zc = [px, py]; }

    /* ---------- GL: programas, geometria y buffers ---------- */
    _initGL() {
      const gl = this.gl; this.P = buildPrograms(gl);
      // geometria: triangulos (earcut) y segmentos de frontera
      const pos = [], ci = [], idx = [], segs = [];
      for (const f of this.world.features) {
        f.gl = { i0: idx.length, n: 0, s0: segs.length / 4, sn: 0 };
        for (const poly of f.polys) {
          const copy = shift => {
            const base = pos.length / 2, flat = [], holes = []; let off = 0;
            poly.rings.forEach((ring, ri) => {
              if (ri > 0) holes.push(off);
              for (const [lo, la] of ring) { const [x, y] = project(lo, clamp(la, -89.99, 89.99)); flat.push(x + shift, y); }
              off += ring.length;
            });
            const tri = earcutFn()(flat, holes, 2);
            for (let i = 0; i < flat.length; i += 2) { pos.push(flat[i], flat[i + 1]); ci.push(f.ci); }
            for (let i = 0; i < tri.length; i++) idx.push(base + tri[i]);
            let o = 0;
            for (const ring of poly.rings) { for (let i = 0; i < ring.length - 1; i++) segs.push(flat[(o + i) * 2], flat[(o + i) * 2 + 1], flat[(o + i + 1) * 2], flat[(o + i + 1) * 2 + 1]); o += ring.length; }
          };
          copy(0); if (poly.bbox[2] > 180) copy(-TWO_PI); if (poly.bbox[0] < -180) copy(TWO_PI);
        }
        f.gl.n = idx.length - f.gl.i0; f.gl.sn = segs.length / 4 - f.gl.s0;
      }
      this.idxCount = idx.length; this.segCount = segs.length / 4;
      const buf = (target, data, usage = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, usage); return b; };
      // VAO de rellenos
      this.vaoFill = gl.createVertexArray(); gl.bindVertexArray(this.vaoFill);
      buf(gl.ARRAY_BUFFER, new Float32Array(pos)); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      buf(gl.ARRAY_BUFFER, new Uint8Array(ci)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.UNSIGNED_BYTE, false, 0, 0);
      buf(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx));
      // VAO de lineas (instanciadas)
      this.vaoLine = gl.createVertexArray(); gl.bindVertexArray(this.vaoLine);
      buf(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1, -1, 1, 1])); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.segBuf = buf(gl.ARRAY_BUFFER, new Float32Array(segs)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0); gl.vertexAttribDivisor(1, 1);
      gl.bindVertexArray(null);
      this.vaoEmpty = gl.createVertexArray();
      this.T = {}; // objetivos de render
    }
    _target(name, w, h, filter) {
      const gl = this.gl; let t = this.T[name];
      if (t && t.w === w && t.h === h) return t;
      if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); }
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter || gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter || gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return (this.T[name] = { tex, fbo, w, h });
    }

    /* ---------- tamano / camara ---------- */
    _emptyMarks() { return { guess: null, answer: null, highlight: null, label: null, labelAt: null, dist: "", pop: null, t0: 0 }; }
    setMarks(m) { this.marks = { ...this._emptyMarks(), ...m, t0: performance.now() }; this.fxDirty = this.dirty = true; }
    clearMarks() { this.marks = this._emptyMarks(); this.fxDirty = this.dirty = true; }
    setPick(on) { this.pickEnabled = on; this.fxDirty = true; for (const c of [this.cv, this.fx]) c.classList.toggle("aiming", on); }
    setQuality(q) { this.quality = q; this.rs = 1; this.resize(true); }

    resize(force) {
      const r = this.cv.getBoundingClientRect(), raw = window.devicePixelRatio || 1;
      this.dpr = this.quality === "saver" ? Math.min(1, raw) : Math.min(3, raw);
      const W = Math.max(1, r.width), H = Math.max(1, r.height);
      if (force || Math.abs(W - (this.W || 0)) > 0.5 || Math.abs(H - (this.H || 0)) > 0.5 || this._lastDpr !== this.dpr) {
        this.cv.width = Math.round(W * this.dpr); this.cv.height = Math.round(H * this.dpr);
        this.fx.width = Math.round(W * this.dpr); this.fx.height = Math.round(H * this.dpr);
      }
      this._lastDpr = this.dpr; this.W = W; this.H = H;
      this.minS = Math.max(W / (BX1 - BX0), H / (BY1 - BY0));
      this.maxS = this.minS * 70;
      this.view.s = clamp(this.view.s, this.minS, this.maxS); this._clamp(this.view);
      this.dirty = this.fxDirty = true;
    }
    _clamp(v) {
      const hw = this.W / (2 * v.s), hh = this.H / (2 * v.s);
      v.cx = hw * 2 >= BX1 - BX0 ? 0 : clamp(v.cx, BX0 + hw, BX1 - hw);
      v.cy = hh * 2 >= BY1 - BY0 ? (BY0 + BY1) / 2 : clamp(v.cy, BY0 + hh, BY1 - hh);
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
      const t = this._clamp({ ...target, s: clamp(target.s, this.minS, this.maxS) });
      this.drift = null; this.tv = null; this.inertia = null;
      if (ms <= 0) { this.view = t; this.anim = null; this.dirty = this.fxDirty = true; return; }
      const from = { ...this.view };
      const far = Math.min(1, Math.hypot(t.cx - from.cx, t.cy - from.cy) * Math.min(from.s, t.s) / Math.max(this.W, this.H));
      this.anim = { from, to: t, t0: performance.now(), ms, dip: 0.5 * far };
    }
    fitPoints(pts, pad = { l: 60, r: 60, t: 160, b: 120 }, ms = 900) {
      const ps = pts.map(([lo, la]) => project(lo, la));
      let x0 = Math.min(...ps.map(p => p[0])), x1 = Math.max(...ps.map(p => p[0]));
      let y0 = Math.min(...ps.map(p => p[1])), y1 = Math.max(...ps.map(p => p[1]));
      const MIN_SPAN = 0.3;
      if (x1 - x0 < MIN_SPAN) { const m = (x0 + x1) / 2; x0 = m - MIN_SPAN / 2; x1 = m + MIN_SPAN / 2; }
      if (y1 - y0 < MIN_SPAN) { const m = (y0 + y1) / 2; y0 = m - MIN_SPAN / 2; y1 = m + MIN_SPAN / 2; }
      const aw = this.W - pad.l - pad.r, ah = this.H - pad.t - pad.b;
      const s = clamp(Math.min(aw / (x1 - x0), ah / (y1 - y0)), this.minS, this.maxS);
      this.animateTo({ cx: (x0 + x1) / 2 - (pad.l - pad.r) / (2 * s), cy: (y0 + y1) / 2 + (pad.t - pad.b) / (2 * s), s }, ms);
    }
    startDrift() {
      const v = this._clamp({ cx: 0.3, cy: 0.9, s: this.minS * 1.7 });
      this.animateTo(v, 1400); setTimeout(() => { if (!this.anim) this.drift = { base: { ...this.view }, t0: performance.now() }; }, 1500);
    }
    /* zoom suavizado hacia el cursor (objetivo + amortiguacion critica) */
    zoomBy(f, px = this.W / 2, py = this.H / 2, animate = true) {
      const base = this.tv || (this.anim ? this.anim.to : this.view);
      const [wx, wy] = this._toWorld(px, py, base);
      const s = clamp(base.s * f, this.minS, this.maxS);
      const t = this._clamp({ s, cx: wx - (px - this.W / 2) / s, cy: wy + (py - this.H / 2) / s });
      this.anim = null; this.drift = null; this.inertia = null; this.zc = [px, py];
      if (animate === false && f === 1) return;
      this.tv = t;
    }
    _toWorld(px, py, v = this.view) { return [v.cx + (px - this.W / 2) / v.s, v.cy - (py - this.H / 2) / v.s]; }
    toScreen(x, y, v = this.view) { return [this.W / 2 + (x - v.cx) * v.s, this.H / 2 - (y - v.cy) * v.s]; }
    lonLatToScreen(lon, lat) { const [x, y] = project(lon, lat); return this.toScreen(x, y); }
    zoomLevel() { return this.view.s / this.minS; }

    /* ---------- interaccion ---------- */
    _bind() {
      const cv = this.cv; cv.style.touchAction = "none";
      cv.addEventListener("pointerdown", e => {
        cv.setPointerCapture(e.pointerId); this.drift = null; this.inertia = null; this.tv = null; this.samples = [];
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
        if (this.pointers.size === 2) this._pinch = this._pinchState();
      });
      cv.addEventListener("pointermove", e => {
        if (e.pointerType === "mouse") { const r = cv.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; this.fxDirty = true; }
        const p = this.pointers.get(e.pointerId); if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
        if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > (e.pointerType === "touch" ? 10 : 5)) p.moved = true;
        if (this.pointers.size === 1 && p.moved) {
          this.anim = null; this.view.cx -= dx / this.view.s; this.view.cy += dy / this.view.s; this._clamp(this.view);
          this.dirty = this.fxDirty = true; cv.classList.add("grabbing"); this.fx.classList.add("grabbing");
          const now = performance.now(); this.samples.push([now, dx, dy]); while (this.samples.length && now - this.samples[0][0] > 90) this.samples.shift();
        } else if (this.pointers.size === 2) {
          const st = this._pinchState();
          if (this._pinch && this._pinch.d > 0) {
            this.anim = null; const r = cv.getBoundingClientRect(), px = st.mx - r.left, py = st.my - r.top;
            const [wx, wy] = this._toWorld(px, py); const s = clamp(this.view.s * (st.d / this._pinch.d), this.minS, this.maxS);
            this.view = this._clamp({ s, cx: wx - (px - this.W / 2) / s, cy: wy + (py - this.H / 2) / s }); this.zc = [px, py]; this.dirty = this.fxDirty = true;
          }
          this._pinch = st;
        }
      });
      cv.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { this.mouse = null; this.fxDirty = true; } });
      const up = e => {
        const p = this.pointers.get(e.pointerId); if (!p) return;
        this.pointers.delete(e.pointerId); cv.classList.remove("grabbing"); this.fx.classList.remove("grabbing");
        if (!p.moved && this.pointers.size === 0 && !this._wasPinch && e.type === "pointerup") { const r = cv.getBoundingClientRect(); this._tap(e.clientX - r.left, e.clientY - r.top); }
        // inercia al soltar
        if (p.moved && this.pointers.size === 0 && !this._wasPinch && this.samples.length > 1) {
          const t0 = this.samples[0][0], t1 = this.samples[this.samples.length - 1][0], dt = Math.max(16, t1 - t0) / 1000;
          const sx = this.samples.reduce((a, s) => a + s[1], 0) / dt, sy = this.samples.reduce((a, s) => a + s[2], 0) / dt;
          if (performance.now() - t1 < 60 && Math.hypot(sx, sy) > 250) this.inertia = { vx: -sx / this.view.s, vy: sy / this.view.s };
        }
        this._wasPinch = this.pointers.size > 0; if (this.pointers.size === 0) this._wasPinch = false;
      };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      cv.addEventListener("wheel", e => {
        e.preventDefault(); const r = cv.getBoundingClientRect();
        this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0018)), e.clientX - r.left, e.clientY - r.top);
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

    /* ---------- bucle: fisica de camara, velocidades y dibujo ---------- */
    _adapt(now, dt) {
      const moving = !!(this.anim || this.drift || this.tv || this.pointers.size || this.inertia);
      if (dt * 1000 < this.baseDt) this.baseDt = dt * 1000;
      if (!moving) { if (this.rs < 1 && ++this.calm > 20) { this.rs = 1; this.calm = 0; this.dirty = true; } this.frameEma = this.baseDt; return; }
      this.calm = 0; this.frameEma = this.frameEma * 0.85 + dt * 1000 * 0.15;
      if (this.quality !== "auto") return;
      if (this.frameEma > Math.max(this.baseDt * 1.5, this.baseDt + 2.5) && this.rs > 0.65) { this.rs = Math.max(0.65, this.rs - 0.1); this.frameEma = this.baseDt; this.dirty = true; }
    }
    _frame(now) {
      if (this.lost) return;
      const dt = this.lastT ? Math.min(0.05, (now - this.lastT) / 1000) : 0.016; this.lastT = now;
      this._adapt(now, dt);
      if (this.anim) {
        const a = this.anim, k = Math.min(1, (now - a.t0) / a.ms), e = easeIO(k), dip = 1 - a.dip * Math.sin(Math.PI * e);
        this.view = { cx: a.from.cx + (a.to.cx - a.from.cx) * e, cy: a.from.cy + (a.to.cy - a.from.cy) * e, s: Math.max(this.minS, a.from.s * Math.pow(a.to.s / a.from.s, e) * dip) };
        if (k >= 1) this.anim = null; this.dirty = this.fxDirty = true;
      } else if (this.tv) {
        const k = 1 - Math.exp(-dt * 13), v = this.view, t = this.tv;
        v.cx += (t.cx - v.cx) * k; v.cy += (t.cy - v.cy) * k; v.s *= Math.pow(t.s / v.s, k);
        if (Math.abs(Math.log(t.s / v.s)) < 0.0004 && Math.hypot(t.cx - v.cx, t.cy - v.cy) * v.s < 0.15) { this.view = { ...t }; this.tv = null; }
        this._clamp(this.view); this.dirty = this.fxDirty = true;
      } else if (this.inertia) {
        const I = this.inertia; this.view.cx += I.vx * dt; this.view.cy += I.vy * dt; const f = Math.exp(-dt * 4.2); I.vx *= f; I.vy *= f;
        this._clamp(this.view); this.dirty = this.fxDirty = true; if (Math.hypot(I.vx, I.vy) * this.view.s < 8) this.inertia = null;
      } else if (this.drift) {
        const t = (now - this.drift.t0) / 1000, b = this.drift.base;
        this.view = this._clamp({ cx: b.cx + Math.sin(t * 0.09) * 1.1, cy: b.cy + Math.sin(t * 0.07 + 1) * 0.16, s: b.s }); this.dirty = this.fxDirty = true;
      }
      // velocidades (para efectos y sonido)
      const lz = Math.log(this.view.s);
      if (this.lastLz !== null && dt > 0) {
        const zv = (lz - this.lastLz) / dt, k = 1 - Math.exp(-dt * 16); this.zv += (zv - this.zv) * k;
        const pvx = ((this.view.cx - this.lastView.cx) * this.view.s) / dt, pvy = (-(this.view.cy - this.lastView.cy) * this.view.s) / dt;
        this.pv[0] += (pvx - this.pv[0]) * k; this.pv[1] += (pvy - this.pv[1]) * k;
      }
      this.lastLz = lz; this.lastView = { ...this.view };
      const active = Math.abs(this.zv) > 0.012 || Math.hypot(this.pv[0], this.pv[1]) > 4;
      if (!active) { this.zv = 0; this.pv = [0, 0]; } else this.dirty = true;
      if (this.onMotion) this.onMotion(this.zv, Math.hypot(this.pv[0], this.pv[1]));

      const m = this.marks;
      if (m.guess || m.answer || (this.pickEnabled && this.mouse)) this.fxDirty = true;
      if (m.highlight && now - m.t0 < 700) this.dirty = true;
      if (this.dirty) { this.dirty = false; this._drawGL(now); if (this.onView) this.onView(this.view); }
      if (this.fxDirty) { this.fxDirty = false; this._drawFx(now); }
    }

    /* ---------- dibujo GL ---------- */
    _u(p, name, ...v) {
      const gl = this.gl, loc = p.u[name]; if (loc === undefined) return;
      const n = v.length;
      if (n === 1) gl.uniform1f(loc, v[0]); else if (n === 2) gl.uniform2f(loc, v[0], v[1]); else if (n === 3) gl.uniform3f(loc, v[0], v[1], v[2]); else gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
    }
    _gridParams() {
      const STEPS = [0.25, 0.5, 1, 2, 5, 10, 15, 30], pxDeg = this.view.s * D2R, MIN = 84;
      let i = STEPS.findIndex(s => s * pxDeg >= MIN); if (i < 0) i = STEPS.length - 1;
      const a = STEPS[i], b = STEPS[Math.max(0, i - 1)];
      const sp = b * pxDeg, t = i === 0 ? 0 : clamp((sp - MIN * 0.45) / (MIN * 0.55), 0, 1);
      return { a, b, t };
    }
    _drawGL(now) {
      const gl = this.gl, v = this.view, W = this.W, H = this.H, dpr = this.dpr, ms = this.ms, P = this.P, st = this.sk;
      const sw = Math.max(2, Math.round(W * dpr * this.rs)), sh = Math.max(2, Math.round(H * dpr * this.rs));
      const scale = t => v.s * (t / W);                                  // px por unidad en un objetivo de ancho t
      const silW = Math.max(2, Math.round(W / 3)), silH = Math.max(2, Math.round(H / 3));
      const sil = this._target("sil", silW, silH), bA = this._target("bA", silW, silH), bN = this._target("bN", silW, silH), bW = this._target("bW", silW, silH);
      const scene = this._target("scene", sw, sh);
      gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

      // 1) silueta de tierra a baja resolucion
      gl.bindFramebuffer(gl.FRAMEBUFFER, sil.fbo); gl.viewport(0, 0, silW, silH); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(P.sil); this._u(P.sil, "u_center", v.cx, v.cy); this._u(P.sil, "u_scale", scale(silW)); this._u(P.sil, "u_res", silW, silH);
      gl.bindVertexArray(this.vaoFill); gl.drawElements(gl.TRIANGLES, this.idxCount, gl.UNSIGNED_INT, 0);

      // 2) desenfoques (estrecho y ancho) en la GPU: ancho constante en pantalla
      gl.bindVertexArray(this.vaoEmpty); gl.useProgram(P.blur);
      const blur = (src, dst, dx, dy) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo); gl.viewport(0, 0, silW, silH); gl.bindTexture(gl.TEXTURE_2D, src.tex);
        this._u(P.blur, "u_dir", dx / silW, dy / silH); this._u(P.blur, "u_res", silW, silH); gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(P.blur.u.u_tex, 0);
      blur(sil, bA, 1, 0); blur(bA, bN, 0, 1);       // estrecho
      blur(bN, bA, 3.2, 0); blur(bA, bW, 0, 3.2);    // ancho

      // 3) escena: oceano + reticula, tierra, fronteras, resalte
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo); gl.viewport(0, 0, sw, sh);
      const sc = scale(sw), gp = this._gridParams();
      gl.useProgram(P.ocean); gl.bindVertexArray(this.vaoEmpty);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bN.tex); gl.uniform1i(P.ocean.u.u_blurN, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bW.tex); gl.uniform1i(P.ocean.u.u_blurW, 1);
      this._u(P.ocean, "u_center", v.cx, v.cy); this._u(P.ocean, "u_scale", sc); this._u(P.ocean, "u_res", sw, sh); this._u(P.ocean, "u_dpr", dpr * this.rs);
      this._u(P.ocean, "u_oTop", ...ms.oTop); this._u(P.ocean, "u_oBot", ...ms.oBot); this._u(P.ocean, "u_shallow", ...ms.shallow); this._u(P.ocean, "u_grid", ...ms.grid); this._u(P.ocean, "u_tropic", ...ms.tropic);
      this._u(P.ocean, "u_gp", gp.a, gp.b, gp.t, st.gridA); gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(P.land); gl.bindVertexArray(this.vaoFill);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bN.tex); gl.uniform1i(P.land.u.u_blurN, 0);
      this._u(P.land, "u_center", v.cx, v.cy); this._u(P.land, "u_scale", sc); this._u(P.land, "u_res", sw, sh); this._u(P.land, "u_fx", st.ao, st.grain, 0, 0);
      const pal = new Float32Array(24); ms.pal.forEach((c, i) => pal.set(c, i * 3)); gl.uniform3fv(P.land.u.u_pal, pal);
      gl.drawElements(gl.TRIANGLES, this.idxCount, gl.UNSIGNED_INT, 0);

      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const hl = this.marks.highlight && this.world.byName[this.marks.highlight];
      if (hl) {
        const k = Math.min(1, (now - this.marks.t0) / 500);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(P.hatch);
        this._u(P.hatch, "u_center", v.cx, v.cy); this._u(P.hatch, "u_scale", sc); this._u(P.hatch, "u_res", sw, sh); this._u(P.hatch, "u_col", ...ms.hl); this._u(P.hatch, "u_dpr", dpr * this.rs); this._u(P.hatch, "u_alpha", k);
        gl.drawElements(gl.TRIANGLES, hl.gl.n, gl.UNSIGNED_INT, hl.gl.i0 * 4);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      // fronteras
      gl.useProgram(P.line); gl.bindVertexArray(this.vaoLine);
      this._u(P.line, "u_center", v.cx, v.cy); this._u(P.line, "u_scale", sc); this._u(P.line, "u_res", sw, sh);
      const lw = clamp(st.lineW + Math.log2(v.s / this.minS) * 0.06, st.lineW, st.lineW * 1.7) * dpr * this.rs;
      if (st.lineOff && (st.lineOff[0] || st.lineOff[1])) {           // desregistro (impresion): segunda capa desplazada
        this._u(P.line, "u_width", lw); this._u(P.line, "u_off", st.lineOff[0] * dpr * this.rs, st.lineOff[1] * dpr * this.rs); this._u(P.line, "u_col", ...st.lineOffCol);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.segCount);
      }
      this._u(P.line, "u_width", lw); this._u(P.line, "u_off", 0, 0); this._u(P.line, "u_col", ...st.line);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.segCount);
      if (hl && hl.gl.sn) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.segBuf); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, hl.gl.s0 * 16);
        this._u(P.line, "u_width", 3.2 * dpr * this.rs); this._u(P.line, "u_col", ...ms.hl, 1); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, hl.gl.sn);
        this._u(P.line, "u_width", 1.1 * dpr * this.rs); this._u(P.line, "u_col", ...hex(st.paper), 1); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, hl.gl.sn);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0);
      }
      gl.disable(gl.BLEND);

      // 4) post-proceso a pantalla: desenfoque radial y aberracion segun velocidad de zoom, viñeta y grano
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.useProgram(P.post); gl.bindVertexArray(this.vaoEmpty);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.tex); gl.uniform1i(P.post.u.u_scene, 0);
      const zc = this.zc || [W / 2, H / 2];
      this._u(P.post, "u_res", this.cv.width, this.cv.height); this._u(P.post, "u_zc", zc[0] * dpr, (H - zc[1]) * dpr);
      const fxk = this.fxOn === false ? 0 : 1;
      this._u(P.post, "u_zv", this.zv * fxk); this._u(P.post, "u_pv", this.pv[0] * dpr * 0.06 * fxk, -this.pv[1] * dpr * 0.06 * fxk);
      this._u(P.post, "u_vig", st.vignette); this._u(P.post, "u_grain", st.postGrain); this._u(P.post, "u_tint", ...st.tint); this._u(P.post, "u_time", now / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* ---------- capa 2D: retícula (etiquetas), chinchetas, linea, etiquetas y cursor ---------- */
    _drawGridLabels(c) {
      const { W, H } = this, gp = this._gridParams();
      c.font = "500 10px 'DM Mono', monospace"; c.textBaseline = "top";
      const [wx0, wyTop] = this._toWorld(0, 0), [wx1, wyBot] = this._toWorld(W, H);
      const latTop = unproject(0, wyTop)[1], latBot = unproject(0, wyBot)[1];
      const draw = (step, alpha) => {
        if (alpha < 0.03) return;
        c.fillStyle = `rgba(190,225,230,${0.55 * alpha})`;
        const lon0 = Math.max(-180, Math.floor(wx0 / D2R / step) * step), lon1 = Math.min(180, Math.ceil(wx1 / D2R / step) * step);
        for (let lo = lon0; lo <= lon1 + 1e-9; lo += step) if (Math.abs(lo % 30) < 1e-9 || step < 30) c.fillText(fmtCoord(lo, "E", "W").replace(".00", ""), this.toScreen(lo * D2R, 0)[0] + 4, H - 16);
        const lat0 = Math.max(-90, Math.floor(latBot / step) * step), lat1 = Math.min(90, Math.ceil(latTop / step) * step);
        for (let la = lat0; la <= lat1 + 1e-9; la += step) if (Math.abs(la % 30) < 1e-9 || step < 30) c.fillText(fmtCoord(la, "N", "S").replace(".00", ""), 8, this.lonLatToScreen(0, la)[1] + 3);
      };
      draw(gp.a, 1); if (gp.b !== gp.a) draw(gp.b, gp.t);
    }
    _drawFx(now) {
      const { fctx: c, W, H, dpr } = this, m = this.marks, sk = this.sk;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      this._drawGridLabels(c);
      const age = now - m.t0;
      if (m.guess || m.answer || m.labelAt) {
        const G = m.guess && this.lonLatToScreen(m.guess[0], m.guess[1]), Aa = m.answer && this.lonLatToScreen(m.answer[0], m.answer[1]);
        if (G && Aa) this._line(c, m, G, Aa, age);
        if (Aa) {
          const k = clamp((age - 480) / 600, 0, 1);
          if (age > 480) {
            const t = ((age - 480) % 1900) / 1900;
            c.strokeStyle = `rgba(242,233,214,${0.85 * (1 - t)})`; c.lineWidth = 2.5; c.beginPath(); c.arc(Aa[0], Aa[1], 10 + t * 48, 0, Math.PI * 2); c.stroke();
            c.strokeStyle = this._rgba(sk.red, 0.6 * (1 - t)); c.lineWidth = 2; c.beginPath(); c.arc(Aa[0], Aa[1], 8 + t * 30, 0, Math.PI * 2); c.stroke();
          }
          this._pin(c, Aa[0], Aa[1], sk.red, sk.paper, age - 480, k);
        }
        if (G) this._pin(c, G[0], G[1], sk.ink, sk.paper, age, 1);
        const at = Aa || (m.labelAt && this.lonLatToScreen(m.labelAt[0], m.labelAt[1]));
        if (at && m.label && age > 520) this._chip(c, m.label, at[0], at[1] - (Aa ? 66 : 10), { center: true, font: `italic 700 17px ${this._fd()}`, alpha: Math.min(1, (age - 520) / 300) });
        if (G && m.pop && age > 700) {
          const t = Math.min(1, (age - 700) / 1700), y = G[1] - 52 - easeIO(t) * 46;
          c.save(); c.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
          c.font = `900 34px ${this._fd()}`; c.textAlign = "center"; c.lineJoin = "round";
          c.lineWidth = 7; c.strokeStyle = sk.ink; c.strokeText(m.pop, G[0], y); c.fillStyle = sk.paper; c.fillText(m.pop, G[0], y); c.restore();
        }
      }
      if (this.pickEnabled && this.mouse && !this.pointers.size) this._reticle(c, this.mouse.x, this.mouse.y);
    }
    _fd() { return getComputedStyle(document.documentElement).getPropertyValue("--serif") || "Fraunces, Georgia, serif"; }
    _fm() { return getComputedStyle(document.documentElement).getPropertyValue("--mono") || "'DM Mono', monospace"; }
    _rgba(h, a) { const [r, g, b] = hex(h); return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`; }
    _line(c, m, G, Aa, age) {
      const k = clamp((age - 300) / 500, 0, 1), e = easeIO(k); if (k <= 0) return;
      c.save(); c.setLineDash([1, 9]); c.lineCap = "round"; c.lineWidth = 4; c.strokeStyle = this._rgba(this.sk.ink, 0.9);
      const segs = [];
      for (const s of [-360, 0, 360]) {
        if (Math.abs(m.guess[0] + s - m.answer[0]) <= 180) segs.push([this.lonLatToScreen(m.guess[0] + s, m.guess[1]), Aa]);
        if (s !== 0 && Math.abs(m.answer[0] + s - m.guess[0]) <= 180) segs.push([G, this.lonLatToScreen(m.answer[0] + s, m.answer[1])]);
      }
      const trace = () => { c.beginPath(); for (const [a, b] of segs) { c.moveTo(a[0], a[1]); c.lineTo(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e); } c.stroke(); };
      trace(); c.lineWidth = 1.5; c.strokeStyle = this._rgba(this.sk.paper, 0.7); c.lineDashOffset = 5; trace(); c.restore();
      if (m.dist && k >= 1) { const [a, b] = segs[0]; this._chip(c, m.dist, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { font: `500 12px ${this._fm()}`, center: true, alpha: Math.min(1, (age - 800) / 250) }); }
    }
    _chip(c, text, x, y, o = {}) {
      c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.font = o.font || "600 14px sans-serif";
      const w = c.measureText(text).width + 22, h = 28, cut = 6, sk = this.sk;
      let rx = o.center ? x - w / 2 : x, ry = y - h / 2; rx = clamp(rx, 8, this.W - w - 8); ry = clamp(ry, 8, this.H - h - 8);
      const path = () => { c.beginPath(); c.moveTo(rx + cut, ry); c.lineTo(rx + w - cut, ry); c.lineTo(rx + w, ry + cut); c.lineTo(rx + w, ry + h - cut); c.lineTo(rx + w - cut, ry + h); c.lineTo(rx + cut, ry + h); c.lineTo(rx, ry + h - cut); c.lineTo(rx, ry + cut); c.closePath(); };
      c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 10; c.shadowOffsetY = 3; path(); c.fillStyle = sk.paper; c.fill();
      c.shadowColor = "transparent"; c.strokeStyle = sk.ink; c.lineWidth = 1.3; c.stroke();
      c.fillStyle = sk.ink; c.textBaseline = "middle"; c.fillText(text, rx + 11, ry + h / 2 + 1); c.restore();
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
      const sk = this.sk;
      c.save(); c.lineWidth = 1; c.setLineDash([2, 6]); c.strokeStyle = this._rgba(sk.paper, 0.28);
      c.beginPath(); c.moveTo(0, y); c.lineTo(x - 22, y); c.moveTo(x + 22, y); c.lineTo(this.W, y); c.moveTo(x, 0); c.lineTo(x, y - 22); c.moveTo(x, y + 22); c.lineTo(x, this.H); c.stroke();
      c.setLineDash([]); c.strokeStyle = sk.paper; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x - 8, y); c.moveTo(x + 8, y); c.lineTo(x + 22, y); c.moveTo(x, y - 22); c.lineTo(x, y - 8); c.moveTo(x, y + 8); c.lineTo(x, y + 22); c.stroke();
      c.fillStyle = sk.red; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = sk.brass; c.beginPath(); c.moveTo(x - 5, 0); c.lineTo(x + 5, 0); c.lineTo(x, 8); c.fill(); c.beginPath(); c.moveTo(0, y - 5); c.lineTo(0, y + 5); c.lineTo(8, y); c.fill();
      const [wx, wy] = this._toWorld(x, y), [lon, lat] = unproject(wx, wy);
      if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
        const txt = fmtCoord(lat, "N", "S") + "  " + fmtCoord(lon, "E", "W");
        c.font = `500 11px ${this._fm()}`; const w = c.measureText(txt).width + 14;
        let bx = x + 20, by = y + 18; if (bx + w > this.W - 6) bx = x - 20 - w; if (by + 22 > this.H - 6) by = y - 40;
        c.fillStyle = this._rgba(sk.ink, 0.9); c.fillRect(bx, by, w, 22); c.fillStyle = sk.paper; c.textBaseline = "middle"; c.fillText(txt, bx + 7, by + 12);
      }
      c.restore();
    }

    /* miniatura de una region (vectorial 2D, una sola vez) */
    drawThumb(cv, spec) {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 120, h = cv.clientHeight || 76;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const c = cv.getContext("2d"), st = this.sk;
      const g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, st.oceanTop); g.addColorStop(1, st.oceanBot); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      const [x, y] = project(spec.lon, spec.lat), z = Math.max(1, spec.zoom * 0.85), uw = (BX1 - BX0) / z, k = cv.width / uw;
      c.setTransform(k, 0, 0, -k, cv.width / 2 - x * k, cv.height / 2 + y * k);
      for (const f of this.world.features) { c.fillStyle = st.land[f.ci] || st.land[0]; c.fill(f.path); }
      c.setTransform(1, 0, 0, 1, 0, 0);
      const px = cv.width / 2, py = cv.height / 2;
      c.strokeStyle = st.red; c.lineWidth = 2 * dpr; c.beginPath(); c.arc(px, py, 6 * dpr, 0, Math.PI * 2); c.stroke(); c.fillStyle = st.red; c.beginPath(); c.arc(px, py, 2 * dpr, 0, Math.PI * 2); c.fill();
    }
  }
  A.MapViewGL = MapViewGL;

  /* fabrica: GPU si se puede, 2D si no */
  A.createMap = (canvas, world, onPick) => {
    if (!/[?&]nogl/.test(location.search) && MapViewGL.supported()) return new MapViewGL(canvas, world, onPick);
    document.documentElement.classList.add("no-webgl");
    return new A.MapView2D(canvas, world, onPick);
  };
})(window.AIQ);
