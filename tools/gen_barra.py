#!/usr/bin/env python3
"""Geolite - iconos de la Barra (Rojo o negro, Ruleta de premios y sus casillas) con el proceso EXACTO de los logros (solo desarrollo):
tools/gen_art.py (Pollinations zimage, "pixel art sprite icon of ..., ICON_SUF", 512) -> keyout(..., 256, holes=True) (= tools/art/barra_src)
-> tools/ach_pixel.pixel (48 px nativos, KEEP_SRC, merge_palette, despeckle_colors, reoutline) -> pulido a nivel de pixel -> 384 px (x8), WebP sin perdida.
Cada icono lleva el id del candidato elegido (la semilla sale de ese id: mismo id, misma imagen). La clave se lee de .env.local y no se escribe en ningun sitio.

  python tools/gen_barra.py            genera lo que falte (assets/raw, ignorado por git) y post-procesa
  python tools/gen_barra.py --post     solo post-procesa desde assets/raw
Moneda al aire (giro y canto): tools/barra_coin.py.
"""
import sys, time, hashlib, urllib.request, urllib.parse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from keyout import keyout
from ach_pixel import pixel, islands, NAT, K, KEEP_SRC
from pixel_cleanup import merge_palette, despeckle_colors, reoutline

RAW = ROOT / "assets" / "raw"; SRC = ROOT / "tools" / "art" / "barra_src"; OUT = ROOT / "assets" / "icons"
for d in (RAW, SRC, OUT): d.mkdir(parents=True, exist_ok=True)
INK = np.array((29, 10, 61), np.uint8)
MODEL = "zimage"
PAL = "saturated palette of coral red, gold, teal green and violet"
ICON_SUF = f"chunky pixels, thick dark purple outline, glossy highlights, {PAL}, Balatro card game item art, centered, isolated on plain flat bright magenta background, no text"

# icono -> (id del candidato elegido, descripcion)
ICONS = {
 "pz_nada": [
  "nada_1a",
  "an open empty wooden treasure chest with the lid up and absolutely nothing inside, a cobweb in the corner and a tiny spider"
 ],
 "pz_monedas": [
  "monedas_0a",
  "a neat stack of five shiny golden coins with stars engraved, small sparkles"
 ],
 "pz_gordo": [
  "gordo_0a",
  "a pyramid of shiny golden bars ingots stacked, sparkling"
 ],
 "pz_reto": [
  "reto_0a",
  "a rolled parchment scroll with a big red wax seal with an exclamation mark and a golden ribbon"
 ],
 "pz_atraco": [
  "atraco_2a",
  "a red money bag with a golden star wearing a black bandit eye mask, a coin dropping out"
 ],
 "pz_reloj": [
  "reloj_0a",
  "a cracked white stopwatch with the red timer wedge almost empty and a golden crack across the glass"
 ],
 "bet_red": [
  "red_0a",
  "a casino roulette wheel seen from above at a slight angle, red and black pockets with one green pocket, golden rim, a tiny blue and green world globe in the center hub and a white ball"
 ],
 "bet_wheel": [
  "wheel_0c",
  "a prize wheel of fortune with colorful wedges of gold green red and black, a red pointer on top, golden rim with light bulbs"
 ]
}

def key():
    env = ROOT / ".env.local"
    return dict(l.split("=", 1) for l in env.read_text().splitlines() if "=" in l).get("POLLINATIONS_KEY", "").strip() if env.exists() else ""

def seed_for(id):
    return int(hashlib.md5(id.encode()).hexdigest()[:6], 16) % 100000

def fetch(Kk, prompt, seed, tries=4):
    url = f"https://gen.pollinations.ai/image/{urllib.parse.quote(prompt)}?model={MODEL}&width=512&height=512&seed={seed}&nologo=true&private=true"
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"Authorization": "Bearer " + Kk, "User-Agent": "geolite-art/1.0"})
            with urllib.request.urlopen(req, timeout=150) as r:
                data = r.read()
                if data[:3] in (b"\xff\xd8\xff", b"\x89PN") or data[:4] == b"RIFF": return data
        except Exception as e:
            print("  reintento", str(e)[:60], flush=True)
        time.sleep(3 * (i + 1))
    return None

N8 = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1))

def polish(out):
    """limpieza premium sobre la rejilla de 48: funde tonos casi iguales, mayoria 3x3 para motas de bajo contraste,
    pixeles sueltos de un color que no se repite en su entorno -> su vecino dominante (salvo brillos claros), y contorno de nuevo"""
    m = out[..., 3] > 0; ink = (out[..., :3] == INK[:3]).all(-1) & m
    body = m & ~ink; rgb = out[..., :3].copy()
    rgb, _ = merge_palette(rgb, body, 18)
    rgb = despeckle_colors(rgb, body, 80, passes=3)
    h, w = m.shape; L = rgb.astype(float) @ np.array([.299, .587, .114])
    for _ in range(2):
        new = rgb.copy()
        for y in range(h):
            for x in range(w):
                if not body[y, x]: continue
                c = tuple(rgb[y, x]); same = 0; votes = {}
                for dx, dy in N8:
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and body[yy, xx]:
                        n = tuple(rgb[yy, xx]); votes[n] = votes.get(n, 0) + 1; same += n == c
                if same or not votes: continue
                n, v = max(votes.items(), key=lambda t: t[1])
                if L[y, x] > 225 and v < 6: continue            # un brillo puntual bien puesto se queda
                new[y, x] = n
        rgb = new
    full = out.copy(); full[body, :3] = rgb[body]
    # contorno: se rehace igual que ach_pixel (reoutline) sobre la silueta completa
    res = reoutline(np.where(m[..., None], full[..., :3], 0).astype(np.uint8), m)
    res[~islands(res[..., 3] > 0, 18)] = 0
    return res


def post(icon):
    cid, _ = ICONS[icon]; raw = RAW / f"{cid}.jpg"
    if not raw.exists(): return
    src = SRC / f"{icon}.webp"
    keyout(raw, src, 256, holes=True)
    out = polish(pixel(src, KEEP_SRC, False, 18))
    Image.fromarray(out, "RGBA").resize((NAT * K, NAT * K), Image.NEAREST).save(OUT / f"{icon}.webp", "WEBP", lossless=True, method=6)

if __name__ == "__main__":
    if "--post" not in sys.argv:
        Kk = key()
        if not Kk: sys.exit("Falta POLLINATIONS_KEY en .env.local")
        for icon, (cid, desc) in ICONS.items():
            if (RAW / f"{cid}.jpg").exists(): continue
            data = fetch(Kk, f"pixel art sprite icon of {desc}, {ICON_SUF}", seed_for(cid))
            if data: (RAW / f"{cid}.jpg").write_bytes(data); print("ok", icon, flush=True)
            else: print("FALLO", icon, flush=True)
    for icon in ICONS: post(icon)
