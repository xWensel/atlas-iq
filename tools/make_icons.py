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

# ---- fuentes en pixel nativo: el escudo (64) y el logo (200) salen de los WebP ya pixelizados (x4 y x3)
mark4 = Image.open(ROOT / "tools" / "brand" / "logo_mark.webp").convert("RGBA")            # 256 = 64 x4
mark = mark4.resize((64, 64), Image.NEAREST)                                   # 64 nativos
mark_s = Image.open(ROOT / "tools" / "brand" / "logo_mark_s.webp").convert("RGBA").resize((32, 32), Image.NEAREST)   # 32 nativos
logo3 = Image.open(ROOT / "tools" / "brand" / "logo.webp").convert("RGBA")                    # 600 = 200 x3
logo = logo3.resize((logo3.width // 3, logo3.height // 3), Image.NEAREST)      # 200 nativos

# ---- PNG del logo y del escudo
logo3.save(A / "logo.png"); mark4.save(A / "icons" / "logo_mark.png"); up(mark_s, 2).save(A / "icons" / "logo_mark_s.png")

def tile(native, size, pad, rounded=True, src=None):
    """escudo sobre fondo morado de pixel art (con halo escalonado), a `native` px y ampliado a `size`"""
    src = src or mark
    bg = Image.new("RGBA", (native, native), (25, 19, 37, 255)); d = ImageDraw.Draw(bg)
    for i, c in enumerate([(44, 32, 72), (54, 40, 88), (64, 48, 104)]):
        r = int(native * (0.5 - i * 0.07)); d.ellipse((native / 2 - r, native / 2 - r, native / 2 + r, native / 2 + r), fill=c + (255,))
    s = max(8, int(native * (1 - 2 * pad))); t = src.resize((s, s), Image.NEAREST); bg.alpha_composite(t, ((native - s) // 2, (native - s) // 2))
    out = bg.resize((size, size), Image.NEAREST)
    if rounded:
        m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.2), fill=255)
        o = Image.new("RGBA", (size, size), (0, 0, 0, 0)); o.paste(out, (0, 0), m); out = o
    return out

# ---- navegador
for n in (16, 32, 48):
    src = mark_s if n <= 32 else mark
    tile(32 if n <= 32 else 64, n, 0.04, rounded=False, src=src).save(A / f"favicon-{n}.png")
ico = [tile(32, 16, 0.04, False, mark_s), tile(32, 32, 0.04, False, mark_s), tile(64, 48, 0.04, False)]
ico[2].save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[ico[0], ico[1]])
tile(64, 180, 0.10, False).save(A / "apple-touch-icon.png")
tile(64, 192, 0.10).save(A / "icon-192.png"); tile(64, 512, 0.10).save(A / "icon-512.png"); tile(64, 512, 0.22, False).save(A / "icon-maskable-512.png")

# ---- escritorio (Windows / Steam / Electron)
sizes = [16, 24, 32, 48, 64, 128, 256]
imgs = [tile(32 if s <= 32 else 64, s, 0.06, True, mark_s if s <= 32 else mark) for s in sizes]
imgs[-1].save(A / "desktop" / "icon.ico", sizes=[(s, s) for s in sizes], append_images=imgs[:-1])
for s in (256, 512, 1024): tile(64, s, 0.08).save(A / "desktop" / f"icon-{s}.png")

# ---- Open Graph 1200x630: el logo a 5x sobre el fondo del juego
W, H = 1200, 630
og = Image.new("RGBA", (W, H), (25, 19, 37, 255)); d = ImageDraw.Draw(og)
for i in range(12):
    r = int(560 - i * 38); c = (28 + i * 4, 20 + i * 3, 46 + i * 6, 255); d.ellipse((W / 2 - r, H / 2 - r * 0.62, W / 2 + r, H / 2 + r * 0.62), fill=c)
lg = up(logo, 5); og.alpha_composite(lg, ((W - lg.width) // 2, (H - lg.height) // 2 - 10))
og.convert("RGB").save(A / "og.png")
print("ok")
