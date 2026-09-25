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
  A.audio = { sfxOn: true, musicOn: true };

  function impulse(seconds, decay) {
    const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return buf;
  }
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 20; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    musFilter = ctx.createBiquadFilter(); musFilter.type = "lowpass"; musFilter.frequency.value = 16000;
    musBus = ctx.createGain(); musBus.gain.value = 0.55; musBus.connect(musFilter).connect(master);
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
  function pad(notes, t, dur, vol = 0.05) {
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    notes.forEach(m => [-6, 6].forEach(det => {
      const os = ctx.createOscillator(); os.type = "sawtooth"; os.frequency.value = mtof(m); os.detune.value = det;
      os.connect(g); os.start(t); os.stop(t + dur + 0.1);
    }));
    g.connect(lp); lp.connect(musBus); send(lp, 0.5);
  }

  /* ------------------------------------------------------------------ musica */
  const CHORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]];   // Cmaj7 · Am7 · Fmaj7 · G6
  const BPM = 92, STEP = 60 / BPM / 4;
  let timer = null, nextT = 0, step = 0, mode = 0, lastIdx = 5;

  function playStep(s, t) {
    const bar = Math.floor(s / 16) % 4, st = s % 16, chord = CHORDS[bar];
    const first = s < 16;                                            // el bucle abre con la firma de Atlas
    if (st === 0) pad(chord.map(m => m - 12), t, STEP * 16 * 1.02, mode === 0 ? 0.05 : 0.04);
    if (first && mode < 2) { const k = [0, 4, 8].indexOf(st); if (k >= 0) pluck(MOTIF[k], t, { bus: musBus, vol: 0.11, dur: 0.9, rev: 0.5 }); }
    // bajo
    if (mode >= 1 && (st === 0 || st === 10)) pluck(chord[0] - 24, t, { bus: musBus, vol: 0.2, dur: 0.45, bright: 2.2, rev: 0.1, wave: "sine" });
    // melodia por paseo aleatorio en la pentatonica (siempre suena bien)
    const density = mode === 0 ? 0.28 : mode === 1 ? 0.5 : 0.62;
    if (st % 2 === 0 && !(first && mode < 2) && Math.random() < density) {
      lastIdx = Math.max(3, Math.min(13, lastIdx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      pluck(scaleNote(lastIdx, 60), t, { bus: musBus, vol: 0.09, dur: 0.55, rev: 0.45 });
    }
    // percusion suave: escobilla en contratiempos y pulso grave
    if (mode >= 1 && st % 4 === 2) noise(t, 0.05, { hp: 7500, vol: mode === 2 ? 0.02 : 0.012, bus: musBus });
    if (mode >= 1 && (st === 0 || st === 8)) thump(t, { vol: 0.07, f0: 90, f1: 45, dur: 0.14, bus: musBus });
    if (mode === 2 && st % 4 === 0) thump(t, { vol: 0.16, f0: 110, f1: 44, dur: 0.16, bus: musBus });   // "latido" de tension
  }
  function schedule() {
    while (nextT < ctx.currentTime + 0.3) { playStep(step, nextT); nextT += STEP; step++; }
  }
  A.music = {
    start() { if (!A.audio.musicOn || timer || !init()) return; nextT = ctx.currentTime + 0.06; step = 0; timer = setInterval(schedule, 60); },
    stop() { clearInterval(timer); timer = null; },
    mode(m) { mode = m; },                                        // 0 menu · 1 juego · 2 tension
    duck(level = 0.3, ms = 1400) {
      if (!ctx || !timer) return;
      const t = ctx.currentTime; musBus.gain.cancelScheduledValues(t);
      musBus.gain.setTargetAtTime(0.55 * level, t, 0.05); musBus.gain.setTargetAtTime(0.55, t + ms / 1000, 0.4);
    },
    muffle(on) { if (ctx) musFilter.frequency.setTargetAtTime(on ? 320 : 16000, ctx.currentTime, 0.08); },
  };
  A.audio.state = () => (ctx ? ctx.state : 'none');
  A.audio.unlock = () => { init(); if (A.audio.musicOn && !timer && ctx) A.music.start(); };
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
  };
})(window.AIQ);
