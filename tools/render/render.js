/* Bounce offline de las 21 canciones de Geolite a archivos de audio fijos (WAV -> MP3).
 * Reutiliza el motor generativo real de js/audio.js (ejecutado en un contexto vm aislado
 * con un OfflineAudioContext) para que el master coincida exactamente con lo que ya suena
 * en el juego. No se toca ni se duplica a mano el codigo de los instrumentos. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");
const { OfflineAudioContext } = require("node-web-audio-api");

const ROOT = path.join(__dirname, "..", "..");
/* fuente: copia congelada del motor generativo completo (audio-source.js), no el js/audio.js
 * que se sirve al juego (ese queda reducido a un reproductor de los mp3 ya renderizados). */
const AUDIO_SRC = fs.readFileSync(path.join(__dirname, "audio-source.js"), "utf8");
const OUT_DIR = path.join(ROOT, "assets", "music");
const TMP_DIR = path.join(__dirname, "tmp");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

const TARGET_SEC = 100;
const SAMPLE_RATE = 44100;

function slug(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function seedScript(seed) {
  return `(function(seed){
    let s = seed >>> 0;
    Math.random = function() {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(${seed});`;
}

function buildSandbox(offlineCtx, seed) {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.document = { addEventListener() {}, hidden: false };
  sandbox.console = console;
  sandbox.setTimeout = setTimeout;
  sandbox.clearTimeout = clearTimeout;
  sandbox.setInterval = setInterval;
  sandbox.clearInterval = clearInterval;
  sandbox.AudioContext = function () { return offlineCtx; };
  sandbox.window.AudioContext = sandbox.AudioContext;
  const context = vm.createContext(sandbox);
  vm.runInContext(seedScript(seed), context, { filename: "seed.js" });
  vm.runInContext(AUDIO_SRC, context, { filename: "audio.js" });
  return sandbox;
}

function cycleSeconds(T) {
  const bpm = T.bpm || 86;
  const bars = (T.prog && T.prog.length) || 8;
  const step = 60 / bpm / 4;
  return T.spb * bars * step;
}

function encodeWav(buf) {
  const numCh = buf.numberOfChannels, sr = buf.sampleRate, len = buf.length;
  const channels = []; for (let c = 0; c < numCh; c++) channels.push(buf.getChannelData(c));
  const blockAlign = numCh * 2, dataSize = len * blockAlign;
  const out = Buffer.alloc(44 + dataSize);
  out.write("RIFF", 0); out.writeUInt32LE(36 + dataSize, 4); out.write("WAVE", 8);
  out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
  out.writeUInt16LE(numCh, 22); out.writeUInt32LE(sr, 24); out.writeUInt32LE(sr * blockAlign, 28);
  out.writeUInt16LE(blockAlign, 32); out.writeUInt16LE(16, 34);
  out.write("data", 36); out.writeUInt32LE(dataSize, 40);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i]; s = s < -1 ? -1 : s > 1 ? 1 : s;
      out.writeInt16LE(Math.round(s < 0 ? s * 0x8000 : s * 0x7fff), off); off += 2;
    }
  }
  return out;
}

async function renderTrack(i, T) {
  const cyc = cycleSeconds(T);
  const cycles = Math.max(3, Math.round(TARGET_SEC / cyc));
  const seconds = cycles * cyc;
  const totalSamples = Math.ceil(seconds * SAMPLE_RATE) + SAMPLE_RATE; // cola de reverb
  const offline = new OfflineAudioContext(2, totalSamples, SAMPLE_RATE);
  const sandbox = buildSandbox(offline, 1000 + i);
  sandbox.AIQ.audio.unlock(false);
  sandbox.AIQ.audio.setSkin({ bpm: 92, sw: 0.34, shift: 0, mod: 1, idx: 2.6 }); // skin "casino" real: afecta solo a la pista 0 (Lounge Nocturno)
  sandbox.AIQ.music.renderTrack(i, seconds, 1);
  const rendered = await offline.startRendering();
  const wavBuf = encodeWav(rendered);
  const base = String(i + 1).padStart(2, "0") + "-" + slug(T.name);
  const wavPath = path.join(TMP_DIR, base + ".wav");
  const mp3Path = path.join(OUT_DIR, base + ".mp3");
  fs.writeFileSync(wavPath, wavBuf);
  execFileSync("ffmpeg", ["-y", "-i", wavPath, "-codec:a", "libmp3lame", "-b:a", "192k", mp3Path], { stdio: "pipe" });
  fs.unlinkSync(wavPath);
  return { seconds, cycles, mp3Path };
}

async function main() {
  const only = process.argv.slice(2).map(Number).filter(n => !Number.isNaN(n));
  const probe = buildSandbox(new OfflineAudioContext(2, SAMPLE_RATE, SAMPLE_RATE), 1);
  probe.AIQ.audio.unlock(false);
  const TRK = probe.AIQ.music._trk();
  const idxs = only.length ? only : TRK.map((_, i) => i);
  console.log("Pistas a renderizar:", idxs.length, "de", TRK.length);
  for (const i of idxs) {
    const T = TRK[i];
    const { seconds, cycles, mp3Path } = await renderTrack(i, T);
    console.log(`[${i}] ${T.name} -> ${path.basename(mp3Path)} (${seconds.toFixed(1)}s, ${cycles} vueltas)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
