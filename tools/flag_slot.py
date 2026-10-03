"""Geolite - el hueco de la bandera (v0.2.15): assets/flags/p/_hueco.webp.
Cuando fallas, el ticket muestra el mastil vacio y, donde iria la tela, este contorno punteado de pixel (la silueta comun a todas las banderas
pixel de la Enciclopedia, sacada de la plantilla tools/art/flag_tpl): se ve que habia una bandera que ganar, sin desvelar cual.
    python tools/flag_slot.py
"""
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
tpl = np.array(Image.open(ROOT / "tools/art/flag_tpl/t_country_tpl.webp").convert("RGBA"))
k = tpl.shape[0] // 64
g = tpl[::k, ::k]                                    # 64 x 64 celdas
m = g[..., 3] > 0
m[:, :10] = False                                    # solo la tela (el mastil, columnas 0-9, lo pone el ticket)
inner = m.copy()
for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): inner &= np.roll(np.roll(m, dy, 0), dx, 1)
edge = m & ~inner
out = np.zeros((64, 64, 4), np.uint8)
ys, xs = np.where(edge)
for y, x in zip(ys, xs):
    if (x + y) % 2 == 0: out[y, x] = (29, 10, 61, 255)    # punteado: una celda si, otra no, en el indigo del contorno
img = Image.fromarray(out, "RGBA").resize((256, 256), Image.NEAREST)
img.save(ROOT / "assets/flags/p/_hueco.webp", lossless=True, quality=100, method=6)
print("ok", int(edge.sum()), "celdas de borde")
