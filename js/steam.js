/*
 * Geolite - puente con Steamworks (solo existe dentro de Electron, via
 * preload.js + IPC; en el navegador normal window.geoliteHost no existe
 * y A.steam se queda sin definir, exactamente como antes).
 */
window.AIQ = window.AIQ || {};
if (window.geoliteHost && window.geoliteHost.steamUnlock) {
  window.AIQ.steam = { unlock: (id) => window.geoliteHost.steamUnlock(id) };
}
