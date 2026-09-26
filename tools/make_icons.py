#!/usr/bin/env python3
"""Geolite - genera TODOS los PNG/ICO de marca a partir del logo y del escudo en pixel art (solo desarrollo).
Todo se amplia por vecino mas cercano: cada pixel es un cuadrado perfecto.

  assets/logo.png            logo con letras (200 px nativos x3), transparente
  assets/icons/logo_mark.png escudo 64 px nativos x4 (256) y logo_mark_s.png (32 nativos x2)
  favicon.ico                16/32/48 (raiz del sitio: los navegadores lo piden solos)
  assets/favicon-16/32/48.png, apple-touch-icon.png (180), icon-192/512, icon-maskable-512
  assets/desktop/icon.ico    16..256 (Windows) y icon-256/512/1024.png (Steam / Electron / escritorio)
  assets/og.png              1200x630 para compartir el enlace (Open Graph / Twitter)
"""
from PIL import Image, ImageDraw
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "assets"; (A / "desktop").mkdir(exist_ok=True)

def up(im, k): return im.resize((im.width * k, im.height * k), Image.NEAREST)

# ---- fuentes en pixel nativo: el logo (200) sale del WebP pixelizado y el escudo es LA TIERRA con la carta y la ficha (tools/make_emblem.py, 48 nativos)
sys.path.insert(0, str(ROOT / "tools"))
from pixelize import pixelize
import make_emblem                                                              # (re)genera tools/brand/emblem48.png
emb = Image.open(ROOT / "tools" / "brand" / "emblem48.png").convert("RGBA")       # 48 nativos, transparente
logo3 = Image.open(ROOT / "tools" / "brand" / "logo.webp").convert("RGBA")        # 600 = 200 x3
logo = logo3.resize((logo3.width // 3, logo3.height // 3), Image.NEAREST)

def small(n):
    """version de n px nativos del escudo (para tamanos pequenos: pestana, HUD, iconos de 16-32 px)"""
    tmp = ROOT / "tools" / "brand" / f"_e{n}.png"; up(emb, 4).save(tmp)
    pixelize(tmp, tmp, n, 22, 1, alpha_cut=110); im = Image.open(tmp).convert("RGBA"); tmp.unlink(); return im

def fit(size, pad=0.04, src=None, bg=None):
    """escudo a escala entera dentro de un lienzo size x size (transparente, o con fondo `bg` si el sistema lo exige: iOS / maskable)"""
    src = src or emb; k = max(1, int(size * (1 - 2 * pad)) // src.width)
    out = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0)); t = up(src, k)
    out.alpha_composite(t, ((size - t.width) // 2, (size - t.height) // 2)); return out

# ---- PNG del logo y del escudo (sin cuadrado: la marca ES la Tierra)
logo3.save(A / "logo.png"); up(emb, 8).save(A / "icons" / "logo_mark.png"); small(32).save(A / "icons" / "logo_mark_s.png")

# ---- navegador
s16, s32 = small(16), small(32)
s16.save(A / "favicon-16.png"); s32.save(A / "favicon-32.png"); emb.save(A / "favicon-48.png")
ico = [fit(16, 0, s16), fit(32, 0, s32), fit(48, 0)]
ico[2].save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[ico[0], ico[1]])
DARK = (25, 19, 37, 255)
fit(180, 0.06, bg=DARK).save(A / "apple-touch-icon.png")                            # iOS pide fondo opaco
fit(192, 0.05).save(A / "icon-192.png"); fit(512, 0.05).save(A / "icon-512.png"); fit(512, 0.2, bg=DARK).save(A / "icon-maskable-512.png")

# ---- escritorio (Windows / Steam / Electron): transparentes
sizes = [16, 24, 32, 48, 64, 128, 256]
imgs = [fit(sz, 0, small(sz) if sz <= 32 else None) if sz < 48 else fit(sz, 0.04) for sz in sizes]
imgs[-1].save(A / "desktop" / "icon.ico", sizes=[(sz, sz) for sz in sizes], append_images=imgs[:-1])
for sz in (256, 512, 1024): fit(sz, 0.04).save(A / "desktop" / f"icon-{sz}.png")

# ---- Open Graph 1200x630: el logo a 5x sobre el fondo del juego
W, H = 1200, 630
og = Image.new("RGBA", (W, H), (25, 19, 37, 255)); d = ImageDraw.Draw(og)
for i in range(12):
    r = int(560 - i * 38); c = (28 + i * 4, 20 + i * 3, 46 + i * 6, 255); d.ellipse((W / 2 - r, H / 2 - r * 0.62, W / 2 + r, H / 2 + r * 0.62), fill=c)
lg = up(logo, 5); og.alpha_composite(lg, ((W - lg.width) // 2, (H - lg.height) // 2 - 10))
og.convert("RGB").save(A / "og.png")
print("ok")
