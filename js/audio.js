/*
 * Atlas IQ - identidad sonora.
 * Todo se sintetiza en el navegador (sin archivos de audio).
 *  - Firma: motivo de tres notas ascendentes (sol-do-re) que suena al empezar, al superar niveles y en la victoria.
 *  - Escala pentatonica de Do mayor: cualquier nota que suene "encaja", asi nada choca.
 *  - Musica generativa (kalimba + pad + bajo) con 3 intensidades: menu, juego y tension (ultimos segundos).
 *  - Los sonidos del resultado cambian segun lo cerca que estes: diana, muy bien, bien, fallo, tiempo agotado.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const PENTA = [0, 2, 4, 7, 9];
  const MOTIF = [67, 72, 74];                       // sol-do-re: la "firma" de Atlas IQ
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const scaleNote = (i, base = 60) => base + 12 * Math.floor(i / 5) + PENTA[((i % 5) + 5) % 5];

  let ctx = null, master, sfxBus, musBus, musFilter, revIn;
  A.audio = { sfxOn: true, musicOn: true, vol: { master: 0.85, music: 0.7, sfx: 0.9 } };
  const MUS_BASE = 0.55;

  function impulse(seconds, decay) {
    const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return buf;
  }
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = A.audio.vol.master;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 20; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = A.audio.vol.sfx; sfxBus.connect(master);
    musFilter = ctx.createBiquadFilter(); musFilter.type = "lowpass"; musFilter.frequency.value = 8600;
    musBus = ctx.createGain(); musBus.gain.value = MUS_BASE * A.audio.vol.music; musBus.connect(musFilter).connect(master);
    const rv = ctx.createConvolver(); rv.buffer = impulse(1.9, 2.8);
    const rvOut = ctx.createGain(); rvOut.gain.value = 0.42;
    revIn = ctx.createGain(); revIn.connect(rv); rv.connect(rvOut).connect(master);
    document.addEventListener("visibilitychange", () => { if (!ctx) return; document.hidden ? ctx.suspend() : ctx.resume(); });
    return true;
  }

  /* ------------------------------------------------------------------ voces */
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  }
  function send(node, amt) { if (!amt) return; const s = ctx.createGain(); s.gain.value = amt; node.connect(s).connect(revIn); }

  /* pulsada tipo kalimba / marimba */
  function pluck(m, t, o = {}) {
    const { vol = 0.14, dur = 0.5, bright = 6, bus = sfxBus, rev = 0.3, wave = "triangle" } = o;
    const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = Math.min(9000, f * bright);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o1.type = wave; o1.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 4; g2.gain.value = 0.16;
    o1.connect(g); o2.connect(g2).connect(g); g.connect(lp); lp.connect(bus); send(lp, rev);
    env(g, t, 0.003, vol, dur);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  /* campana (armonicos inarmonicos: sonido metalico limpio) */
  function bell(m, t, o = {}) {
    const { vol = 0.1, dur = 1.1, bus = sfxBus, rev = 0.5 } = o;
    const f = mtof(m), g = ctx.createGain();
    [[1, 1], [2.756, 0.32], [5.404, 0.12]].forEach(([r, a]) => {
      const os = ctx.createOscillator(), ga = ctx.createGain();
      os.type = "sine"; os.frequency.value = f * r; ga.gain.value = a; os.connect(ga).connect(g); os.start(t); os.stop(t + dur + 0.1);
    });
    g.connect(bus); send(g, rev); env(g, t, 0.004, vol, dur);
  }
  function noise(t, dur, o = {}) {
    const { hp = 0, lp = 20000, vol = 0.05, bus = sfxBus, sweepTo, q = 0.7, type } = o;
    const n = Math.floor(ctx.sampleRate * (dur + 0.05)), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f1 = ctx.createBiquadFilter(); f1.type = type || (hp ? "highpass" : "lowpass"); f1.frequency.value = hp || lp; f1.Q.value = q;
    if (sweepTo) f1.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain(); s.connect(f1).connect(g).connect(bus); env(g, t, 0.004, vol, dur);
    s.start(t); s.stop(t + dur + 0.05);
  }
  function thump(t, o = {}) {
    const { vol = 0.3, f0 = 130, f1 = 42, dur = 0.16, bus = sfxBus } = o;
    const os = ctx.createOscillator(), g = ctx.createGain();
    os.type = "sine"; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + dur);
    os.connect(g).connect(bus); env(g, t, 0.003, vol, dur); os.start(t); os.stop(t + dur + 0.05);
  }
  function pad(notes, t, dur, vol = 0.05, bus = musBus) {
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    notes.forEach(m => [-6, 6].forEach(det => {
      const os = ctx.createOscillator(); os.type = "sawtooth"; os.frequency.value = mtof(m); os.detune.value = det;
      os.connect(g); os.start(t); os.stop(t + dur + 0.1);
    }));
    g.connect(lp); lp.connect(bus); send(lp, 0.5);
  }

  /* ------------------------------------------------------------------ musica: jazz lo-fi con swing (estilo Balatro) */
  /*
   *  Piano electrico FM (Rhodes) haciendo stabs sincopados, contrabajo con notas de aproximacion, escobillas y charles con swing,
   *  melodia de blues-pentatonica con licks al azar, crujido de vinilo y "tape wobble" (vibrato lento de cinta) en toda la banda.
   *  Progresion de 8 compases: Dm9 . G13 . Cmaj9 . A7b13  |  Gm9 . C13 . Fmaj9 . D7b13
   */
  let BPM = 86, STEP = 60 / BPM / 4, SW = 0.3, SHIFT = 0, EPMOD = 1, EPIDX = 2.2;   // se ajustan por skin
  const PROG_A = [
    { root: 38, v: [53, 57, 60, 64], tonic: 50 },   // Dm9
    { root: 43, v: [53, 57, 59, 64], tonic: 50 },   // G13
    { root: 36, v: [52, 55, 59, 62], tonic: 50 },   // Cmaj9
    { root: 33, v: [55, 61, 64, 65], tonic: 50 },   // A7b13
  ];
  const PROG = [...PROG_A, ...PROG_A.map(c => ({ root: c.root + 5, v: c.v.map(n => n + 5), tonic: c.tonic + 5 }))];
  const PENTA_MIN = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
  const LICKS = [
    [[2, 4], [3, 3], [6, 2], [10, 0]], [[0, 5], [2, 4], [4, 2], [7, 3]], [[6, 3], [7, 4], [10, 5], [14, 4]],
    [[2, 2], [4, 3], [5, 4], [8, 6]], [[3, 6], [6, 5], [9, 3], [12, 2]], [[0, 4], [3, 2], [8, 3], [11, 0]],
  ];
  let timer = null, nextT = 0, step = 0, mode = 0, wob = null, curLick = null;

  function wobble() {
    if (wob) return wob;
    const slow = ctx.createOscillator(), fast = ctx.createOscillator(), g1 = ctx.createGain(), g2 = ctx.createGain(), out = ctx.createGain();
    slow.frequency.value = 0.55; g1.gain.value = 9; fast.frequency.value = 6.2; g2.gain.value = 2.6;   // centesimas
    slow.connect(g1).connect(out); fast.connect(g2).connect(out); slow.start(); fast.start();
    return (wob = out);
  }
  /* piano electrico FM: portadora + modulador que decae (timbre de "tine") */
  function epiano(m, t, o = {}) {
    const { vol = 0.07, dur = 0.9, mod = EPMOD, idx = EPIDX, rev = 0.35, bus = musBus } = o;
    const f = mtof(m), car = ctx.createOscillator(), md = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    car.type = "sine"; md.type = "sine"; car.frequency.value = f; md.frequency.value = f * mod;
    mg.gain.setValueAtTime(f * idx, t); mg.gain.exponentialRampToValueAtTime(f * 0.12, t + Math.min(0.5, dur));
    md.connect(mg).connect(car.frequency);
    const w = wobble(); w.connect(car.detune); w.connect(md.detune);
    lp.type = "lowpass"; lp.frequency.value = 4200;
    car.connect(g); g.connect(lp); lp.connect(bus); send(lp, rev);
    env(g, t, 0.004, vol, dur);
    [car, md].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
    const tn = ctx.createOscillator(), tg = ctx.createGain(); tn.type = "sine"; tn.frequency.value = f * 7.1; tn.connect(tg).connect(lp); env(tg, t, 0.002, vol * 0.18, 0.06); tn.start(t); tn.stop(t + 0.15);
  }
  function upright(m, t, dur = 0.34, vol = 0.2) {
    const f = mtof(m), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), g2 = ctx.createGain();
    o1.type = "triangle"; o2.type = "sine"; o1.frequency.value = f; o2.frequency.value = f * 2; wobble().connect(o1.detune);
    g2.gain.value = 0.25; o2.connect(g2).connect(g); o1.connect(g);
    lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(260, t + dur);
    g.connect(lp); lp.connect(musBus); env(g, t, 0.006, vol, dur); [o1, o2].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
  }
  const brush = (t, v = 1) => noise(t, 0.17, { lp: 3400, vol: 0.022 * v, bus: musBus, type: "bandpass", q: 0.6 });
  const hat = (t, v = 1, open = false) => noise(t, open ? 0.16 : 0.04, { hp: 7800, vol: 0.016 * v, bus: musBus });
  const crackle = t => noise(t, 0.012, { hp: 2600, vol: 0.009 * Math.random(), bus: musBus });

  function playStep(s, t0) {
    const bar = Math.floor(s / 16) % 8, st = s % 16, c0 = PROG[bar], n0 = PROG[(bar + 1) % 8];
    const ch = { root: c0.root + SHIFT, v: c0.v.map(n => n + SHIFT), tonic: c0.tonic + SHIFT }, nx = { root: n0.root + SHIFT };
    const t = t0 + (Math.floor(st / 2) % 2 === 1 ? STEP * 2 * SW : 0);          // swing en las corcheas de contratiempo
    const full = mode >= 1, rnd = Math.random;
    // bajo
    if (st === 0) upright(ch.root, t, 0.42, 0.22);
    if (full && st === 6) upright(ch.root + 7, t, 0.3, 0.16);
    if (st === 8) upright(ch.root + (rnd() < 0.4 ? 12 : 0), t, 0.32, 0.17);
    if (full && st === 10 && rnd() < 0.6) upright(ch.root + 3 + (bar % 2 ? 4 : 0), t, 0.24, 0.13);
    if (st === 14) upright(nx.root + (rnd() < 0.5 ? 1 : -1), t, 0.2, 0.14);      // nota de aproximacion al siguiente acorde
    // piano electrico: stabs sincopados con "strum"
    const comp = (v, dur) => ch.v.forEach((n, i) => epiano(n + (rnd() < 0.05 ? 12 : 0), t + i * 0.011, { vol: 0.045 * v * (0.85 + rnd() * 0.3), dur }));
    if (st === 2 && (full || rnd() < 0.75)) comp(1, 0.7);
    if (st === 9 && (full ? rnd() < 0.8 : rnd() < 0.35)) comp(0.75, 0.55);
    if (full && st === 13 && rnd() < 0.4) comp(0.55, 0.4);
    // melodia por licks (blues-pentatonica)
    if (st === 0) curLick = rnd() < (mode === 0 ? 0.16 : mode === 1 ? 0.6 : 0.75) ? LICKS[Math.floor(rnd() * LICKS.length)] : null;
    if (curLick) for (const [ls, deg] of curLick) if (ls === st) {
      const n = ch.tonic + 24 + PENTA_MIN[deg] + (rnd() < 0.1 ? -1 : 0);
      epiano(n, t, { vol: 0.07, dur: 0.8, mod: EPMOD * 2, idx: EPIDX * 0.6, rev: 0.55 });
    }
    // bateria
    if (full) {
      if (st === 0 || (st === 6 && rnd() < 0.7) || (st === 10 && rnd() < 0.85)) thump(t, { vol: st === 0 ? 0.16 : 0.1, f0: 100, f1: 44, dur: 0.14, bus: musBus });
      if (st === 4 || st === 12) brush(t, 1);
      if ((st === 7 || st === 15) && rnd() < 0.4) brush(t, 0.35);
    } else if (st === 4 || st === 12) brush(t, 0.55);
    if (st % 2 === 0) hat(t, (st % 4 === 0 ? 0.6 : 1) * (mode === 0 ? 0.6 : 1), st === 14 && rnd() < 0.3);
    if (mode === 2) { if (st % 2 === 1) hat(t, 0.5); if (st % 4 === 0) noise(t, 0.03, { hp: 1800, vol: 0.02, bus: musBus }); }   // reloj de tension
    if (rnd() < 0.14) crackle(t);
  }
  function schedule() { while (nextT < ctx.currentTime + 0.3) { playStep(step, nextT); nextT += STEP; step++; } }
  A.music = {
    start() { if (!A.audio.musicOn || timer || !init()) return; nextT = ctx.currentTime + 0.08; step = 0; timer = setInterval(schedule, 60); },
    stop() { clearInterval(timer); timer = null; },
    mode(m) { mode = m; if (ctx) musFilter.frequency.setTargetAtTime(m === 2 ? 12500 : 8600, ctx.currentTime, 0.15); },
    duck(level = 0.3, ms = 1400) {
      if (!ctx || !timer) return;
      const base = MUS_BASE * A.audio.vol.music, t = ctx.currentTime; musBus.gain.cancelScheduledValues(t);
      musBus.gain.setTargetAtTime(base * level, t, 0.05); musBus.gain.setTargetAtTime(base, t + ms / 1000, 0.4);
    },
    muffle(on) { if (ctx) musFilter.frequency.setTargetAtTime(on ? 320 : 8600, ctx.currentTime, 0.08); },
  };
  /* cada skin tiene su propia banda: tempo, swing, transposicion y timbre del piano */
  A.audio.setSkin = cfg => {
    if (!cfg) return;
    BPM = cfg.bpm; STEP = 60 / BPM / 4; SW = cfg.sw; SHIFT = cfg.shift; EPMOD = cfg.mod; EPIDX = cfg.idx;
  };
  A.audio.state = () => (ctx ? ctx.state : 'none');
  /* volumen 0..1 de "master" | "music" | "sfx" */
  A.audio.setVol = (kind, v) => {
    v = Math.max(0, Math.min(1, v)); A.audio.vol[kind] = v;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (kind === "master") master.gain.setTargetAtTime(v, t, 0.03);
    else if (kind === "music") { musBus.gain.cancelScheduledValues(t); musBus.gain.setTargetAtTime(MUS_BASE * v, t, 0.03); }
    else sfxBus.gain.setTargetAtTime(v, t, 0.03);
  };
  A.audio.unlock = (music = true) => { init(); if (music && A.audio.musicOn && !timer && ctx) A.music.start(); };
  A.audio.setMusic = on => { A.audio.musicOn = on; if (on) A.music.start(); else A.music.stop(); };

  /* ------------------------------------------------------------------ efectos */
  const go = fn => (...a) => { if (!A.audio.sfxOn || !init()) return; fn(ctx.currentTime + 0.005, ...a); };

  A.sfx = {
    ui: go(t => pluck(84, t, { vol: 0.05, dur: 0.12, bright: 3, rev: 0.1 })),
    hover: go(t => noise(t, 0.02, { hp: 5000, vol: 0.02 })),
    start: go(t => { MOTIF.forEach((m, i) => pluck(m, t + i * 0.13, { vol: 0.16, dur: 0.9, rev: 0.6 })); bell(79, t + 0.42, { vol: 0.07 }); }),
    /* clic en el mapa: chincheta que cae */
    tap: go(t => { thump(t, { vol: 0.32, f0: 320, f1: 70, dur: 0.1 }); noise(t, 0.05, { lp: 2200, vol: 0.06 }); pluck(76, t + 0.02, { vol: 0.05, dur: 0.15, rev: 0.15 }); }),
    /* resultado: 0 fallo grande · 1 mal · 2 bien · 3 muy bien · 4 diana · 5 tiempo agotado */
    reveal: go((t, tier) => {
      if (tier === 4) {
        [72, 76, 79, 84].forEach((m, i) => bell(m + 12, t + i * 0.055, { vol: 0.085, dur: 1.4 })); thump(t, { vol: 0.28, f0: 90, f1: 38, dur: 0.4 });
        noise(t, 0.6, { hp: 3000, vol: 0.04, sweepTo: 12000, type: "highpass" }); A.music.duck(0.35, 1600);
      } else if (tier === 3) { [72, 76, 79].forEach((m, i) => bell(m, t + i * 0.07, { vol: 0.09, dur: 1.1 })); A.music.duck(0.4, 1300); }
      else if (tier === 2) { [76, 79].forEach((m, i) => bell(m, t + i * 0.08, { vol: 0.08, dur: 0.9 })); }
      else if (tier === 1) { pluck(67, t, { vol: 0.12, dur: 0.5, bright: 3 }); pluck(64, t + 0.11, { vol: 0.1, dur: 0.6, bright: 3 }); }
      else if (tier === 0) { pluck(57, t, { vol: 0.16, dur: 0.6, bright: 2 }); pluck(53, t + 0.16, { vol: 0.15, dur: 0.9, bright: 1.8 }); thump(t + 0.02, { vol: 0.12, f0: 100, f1: 50 }); }
      else { thump(t, { vol: 0.26, f0: 150, f1: 55 }); pluck(50, t + 0.12, { vol: 0.14, dur: 0.9, bright: 1.5 }); noise(t, 0.09, { lp: 900, vol: 0.05 }); }
    }),
    /* contador de puntos: sube por la pentatonica, como una maquinita */
    count: go((t, k) => pluck(scaleNote(Math.floor(k * 9), 72), t, { vol: 0.045, dur: 0.09, bright: 3, rev: 0.05 })),
    countEnd: go(t => { bell(84, t, { vol: 0.07, dur: 0.8 }); bell(91, t + 0.06, { vol: 0.04, dur: 0.8 }); }),
    /* racha: cada nivel de racha sube un peldano */
    streak: go((t, n) => { const b = scaleNote(4 + Math.min(n, 7) * 2, 60); pluck(b, t, { vol: 0.12, dur: 0.4 }); pluck(b + 7, t + 0.07, { vol: 0.1, dur: 0.5 }); noise(t, 0.25, { hp: 2500, vol: 0.03, sweepTo: 9000, type: "highpass" }); }),
    tick: go((t, n) => pluck(88 - n * 2, t, { vol: 0.08, dur: 0.08, bright: 4, rev: 0.05 })),
    intro: go(t => { noise(t, 0.5, { lp: 400, sweepTo: 6000, vol: 0.09, type: "bandpass", q: 1.4 }); thump(t + 0.32, { vol: 0.25, f0: 100, f1: 40, dur: 0.3 }); MOTIF.forEach((m, i) => pluck(m - 12, t + 0.34 + i * 0.09, { vol: 0.1, dur: 0.6 })); A.music.duck(0.4, 1800); }),
    stamp: go(t => { thump(t, { vol: 0.45, f0: 120, f1: 32, dur: 0.35 }); noise(t, 0.12, { lp: 1600, vol: 0.14 }); }),
    win: go(t => {
      MOTIF.forEach((m, i) => pluck(m + 12, t + 0.12 + i * 0.11, { vol: 0.16, dur: 1.2, rev: 0.6 }));
      [72, 76, 79, 84].forEach((m, i) => bell(m, t + 0.5 + i * 0.07, { vol: 0.08, dur: 1.6 }));
      pad([48, 55, 60, 64], t + 0.4, 2.6, 0.05); A.music.duck(0.3, 2600);
    }),
    fail: go(t => { [64, 60, 57].forEach((m, i) => pluck(m, t + i * 0.2, { vol: 0.13, dur: 1, bright: 2, rev: 0.6 })); thump(t, { vol: 0.14, f0: 90, f1: 40 }); A.music.duck(0.3, 2200); }),
    victory: go(t => {
      MOTIF.forEach((m, i) => pluck(m + 12, t + i * 0.13, { vol: 0.17, dur: 1.4, rev: 0.7 }));
      for (let i = 0; i < 12; i++) bell(scaleNote(5 + i, 60) + 12, t + 0.55 + i * 0.09, { vol: 0.06, dur: 1.5 });
      pad([48, 55, 60, 64, 67], t + 0.4, 4, 0.06); thump(t + 0.5, { vol: 0.3, f0: 100, f1: 36, dur: 0.5 }); A.music.duck(0.25, 4200);
    }),
    pause: go(t => pluck(60, t, { vol: 0.08, dur: 0.3, bright: 3 })),
    /* Vault Raiders: marcado de caja fuerte -> clunk -> puerta -> dos notas brillantes (quinta ascendente) */
    vault: go(t => {
      [0.10, 0.36, 0.60].forEach(d => { noise(t + d, 0.035, { hp: 2600, vol: 0.10 }); thump(t + d, { vol: 0.07, f0: 440, f1: 190, dur: 0.05 }); });
      noise(t + 0.1, 0.8, { lp: 220, sweepTo: 1500, vol: 0.05, type: "bandpass", q: 1.1 });
      thump(t + 0.92, { vol: 0.6, f0: 95, f1: 32, dur: 0.5 }); noise(t + 0.92, 0.1, { lp: 1800, vol: 0.18 });
      bell(57, t + 0.93, { vol: 0.11, dur: 1.0, rev: 0.4 }); bell(64.4, t + 0.94, { vol: 0.05, dur: 0.7, rev: 0.4 });
      noise(t + 0.95, 0.7, { hp: 1400, vol: 0.06, sweepTo: 6500, type: "highpass" });
      pad([48, 55, 59, 62, 64], t + 1.15, 2.8, 0.08, sfxBus);
      bell(79, t + 1.22, { vol: 0.14, dur: 1.7, rev: 0.6 }); bell(86, t + 1.44, { vol: 0.17, dur: 2.2, rev: 0.75 });
      [91, 95, 98, 103].forEach((m, i) => bell(m, t + 1.72 + i * 0.06, { vol: 0.045, dur: 0.9, rev: 0.7 }));
      noise(t + 1.7, 0.7, { hp: 5000, vol: 0.035, sweepTo: 12000, type: "highpass" });
    }),
    /* estudio: dos golpes graves (VAULT y raiders) y un brillo suave cuando pasa la luz */
    studio: go(t => {
      thump(t + 0.62, { vol: 0.62, f0: 110, f1: 34, dur: 0.55 }); noise(t + 0.62, 0.09, { lp: 1500, vol: 0.14 }); bell(45, t + 0.63, { vol: 0.09, dur: 1.3, rev: 0.5 });
      thump(t + 1.26, { vol: 0.5, f0: 140, f1: 38, dur: 0.5 }); noise(t + 1.26, 0.08, { lp: 1900, vol: 0.12 }); bell(52, t + 1.27, { vol: 0.08, dur: 1.2, rev: 0.5 });
      noise(t + 1.85, 1.1, { hp: 3000, vol: 0.03, sweepTo: 9000, type: "highpass" }); bell(93, t + 2.0, { vol: 0.06, dur: 1.4, rev: 0.7 }); bell(100, t + 2.12, { vol: 0.04, dur: 1.2, rev: 0.7 });
    }),
    /* carta que se desliza (UI) y ficha que cae */
    card: go(t => { noise(t, 0.05, { lp: 2600, vol: 0.08, type: "bandpass", q: 0.8 }); noise(t + 0.04, 0.03, { hp: 3000, vol: 0.04 }); }),
    chip: go((t, k = 0) => { bell(84 + Math.round(k * 7), t, { vol: 0.05, dur: 0.25, rev: 0.2 }); noise(t, 0.01, { hp: 5000, vol: 0.04 }); }),
    /* zoom sensorial: silbido de aire continuo cuyo tono y volumen siguen la velocidad del zoom */
    zoomVel: (() => {
      let src = null, gain = null, filt = null;
      return (zv, pan) => {
        if (!A.audio.sfxOn || !ctx) return;
        if (!src) {
          const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
          for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
          src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
          filt = ctx.createBiquadFilter(); filt.type = "bandpass"; filt.Q.value = 0.9; filt.frequency.value = 500;
          gain = ctx.createGain(); gain.gain.value = 0; src.connect(filt).connect(gain).connect(sfxBus); src.start();
        }
        const a = Math.min(1, Math.abs(zv) / 3.2 + Math.min(0.35, pan / 2600)), t = ctx.currentTime;
        gain.gain.setTargetAtTime(a * 0.045, t, 0.06);
        filt.frequency.setTargetAtTime(380 + a * 2400 + (zv > 0 ? 500 : 0), t, 0.07);
      };
    })(),
    /* feedback de sliders: el tono sube con el valor (0..1) */
    blip: go((t, v) => pluck(scaleNote(Math.round(v * 9), 67), t, { vol: 0.09, dur: 0.16, bright: 3, rev: 0.15 })),
    /* interruptores: clic seco de palanca */
    flip: go((t, on) => { thump(t, { vol: 0.16, f0: on ? 260 : 190, f1: 80, dur: 0.06 }); pluck(on ? 84 : 72, t + 0.015, { vol: 0.06, dur: 0.1, bright: 3, rev: 0.05 }); }),
    /* pulsar el boton de salida */
    depart: go(t => { thump(t, { vol: 0.3, f0: 180, f1: 50, dur: 0.14 }); noise(t, 0.35, { lp: 300, sweepTo: 5000, vol: 0.08, type: "bandpass", q: 1.2 }); MOTIF.forEach((m, i) => pluck(m, t + 0.05 + i * 0.09, { vol: 0.15, dur: 0.9, rev: 0.6 })); }),
    /* v0.6: clic de mapa (pin que cae), monedas, tienda, sonar, jefe, logro, ronda */
    pin: go((t, k = 0) => { const n = 60 + Math.min(k, 6) * 2; thump(t, { vol: 0.34, f0: 170, f1: 55, dur: 0.11 }); noise(t, 0.05, { hp: 2200, vol: 0.09 }); pluck(n + 12, t + 0.03, { vol: 0.11, dur: 0.28, bright: 4, rev: 0.25 }); bell(n + 24, t + 0.05, { vol: 0.04, dur: 0.4, rev: 0.4 }); }),
    coin: go((t, k = 0) => { const n = 88 + Math.round(k * 5); bell(n, t, { vol: 0.07, dur: 0.35, rev: 0.25 }); bell(n + 7, t + 0.055, { vol: 0.06, dur: 0.5, rev: 0.3 }); noise(t, 0.012, { hp: 6000, vol: 0.05 }); }),
    buy: go(t => { [0, 0.06, 0.12].forEach((d, i) => bell(84 + i * 5, t + d, { vol: 0.07, dur: 0.4, rev: 0.3 })); thump(t, { vol: 0.16, f0: 200, f1: 70, dur: 0.08 }); noise(t + 0.02, 0.05, { hp: 3500, vol: 0.05 }); }),
    sell: go(t => { bell(76, t, { vol: 0.06, dur: 0.3 }); bell(69, t + 0.07, { vol: 0.06, dur: 0.4 }); noise(t, 0.04, { lp: 2400, vol: 0.06, type: "bandpass", q: 1 }); }),
    deny: go(t => { thump(t, { vol: 0.2, f0: 120, f1: 60, dur: 0.1 }); pluck(46, t, { vol: 0.09, dur: 0.18, bright: 1 }); pluck(43, t + 0.09, { vol: 0.09, dur: 0.22, bright: 1 }); }),
    reroll: go(t => { for (let i = 0; i < 5; i++) noise(t + i * 0.04, 0.03, { hp: 2500 + i * 500, vol: 0.05 }); pluck(79, t + 0.2, { vol: 0.08, dur: 0.2, bright: 3 }); }),
    sonar: go((t, near = 0.5) => { const m = 88 - Math.round(near * 14); bell(m, t, { vol: 0.13, dur: 1.4, rev: 0.7 }); bell(m + 12, t + 0.02, { vol: 0.04, dur: 0.9, rev: 0.6 }); noise(t, 0.5, { lp: 900, sweepTo: 3000, vol: 0.03, type: "bandpass", q: 3 }); }),
    boss: go(t => { [0, 0.28, 0.56].forEach(d => thump(t + d, { vol: 0.42, f0: 95, f1: 34, dur: 0.32 })); pad([38, 41, 44, 50], t, 2.6, 0.09); pluck(50, t + 0.85, { vol: 0.14, dur: 1.4, bright: 2, rev: 0.7 }); pluck(47, t + 1.1, { vol: 0.14, dur: 1.8, bright: 2, rev: 0.8 }); A.music.duck(0.3, 2600); }),
    clear: go(t => { thump(t, { vol: 0.3, f0: 130, f1: 40, dur: 0.25 }); [72, 76, 79, 84, 88].forEach((m, i) => pluck(m, t + 0.08 + i * 0.075, { vol: 0.13, dur: 0.9, rev: 0.5 })); bell(96, t + 0.5, { vol: 0.08, dur: 1.4, rev: 0.7 }); A.music.duck(0.35, 1800); }),
    lose: go(t => { thump(t, { vol: 0.4, f0: 80, f1: 28, dur: 0.6 }); [57, 53, 50, 45].forEach((m, i) => pluck(m, t + i * 0.16, { vol: 0.12, dur: 1.3, bright: 1.5, rev: 0.7 })); noise(t, 0.6, { lp: 500, vol: 0.08 }); A.music.duck(0.25, 2400); }),
    ach: go(t => { [79, 83, 86, 91].forEach((m, i) => bell(m, t + i * 0.08, { vol: 0.09, dur: 1.2, rev: 0.6 })); pluck(67, t, { vol: 0.12, dur: 0.6, rev: 0.4 }); noise(t + 0.25, 0.5, { hp: 5000, vol: 0.03, sweepTo: 12000, type: "highpass" }); }),
    unlock: go(t => { noise(t, 0.08, { lp: 2400, vol: 0.09, type: "bandpass", q: 0.8 }); [76, 83, 88].forEach((m, i) => bell(m, t + 0.05 + i * 0.07, { vol: 0.07, dur: 0.8, rev: 0.4 })); }),
  };
})(window.AIQ);
