"""Geolite - llama de 32 celdas sacada de assets/icons/a_flame.webp (64 celdas), para el fuego de la caja de la racha del ticket (v0.2.15).
   python tools/flame_small.py . assets/icons/a_flame_s.png hoja.png   (y luego a webp sin perdida)"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
WT = Path(sys.argv[1]); sys.path.insert(0, str(WT / "tools"))
from pxkit import dilate, erode
src = np.array(Image.open(WT / "assets/icons/a_flame.webp").convert("RGBA"))[::8, ::8].astype(int)   # 64x64 celdas
a = src[..., 3] > 0
L = src[..., 0] * .299 + src[..., 1] * .587 + src[..., 2] * .114
ink = a & (L < 70)
body = a & ~ink
cols = {}
H = 32
out = np.zeros((H, H, 4), np.uint8)
bm = np.zeros((H, H), bool)
for y in range(H):
    for x in range(H):
        blk = [(yy, xx) for yy in (2 * y, 2 * y + 1) for xx in (2 * x, 2 * x + 1)]
        bs = [tuple(src[p][:3]) for p in blk if body[p]]
        if len(bs) >= 2:
            # el color mas repetido; a igualdad, el mas claro (el corazon de la llama no se apaga al reducir)
            from collections import Counter
            c = Counter(bs).most_common()
            top = [k for k, n in c if n == c[0][1]]
            col = max(top, key=lambda k: k[0] * .299 + k[1] * .587 + k[2] * .114)
            out[y, x, :3] = col; out[y, x, 3] = 255; bm[y, x] = True
# contorno indigo de 1 px (8-conexo) alrededor del cuerpo, sin esquinas que no sostienen nada
INK = np.array((29, 10, 61, 255), np.uint8)
def sh(m, dx, dy):
    r = np.zeros_like(m)
    ys = slice(max(dy, 0), H + min(dy, 0)); yd = slice(max(-dy, 0), H + min(-dy, 0))
    xs = slice(max(dx, 0), H + min(dx, 0)); xd = slice(max(-dx, 0), H + min(-dx, 0))
    r[ys, xs] = m[yd, xd]; return r
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1)); N8 = N4 + ((1, 1), (-1, -1), (1, -1), (-1, 1))
d8 = np.zeros_like(bm)
for dx, dy in N8: d8 |= sh(bm, dx, dy)
ol = d8 & ~bm
t4 = np.zeros_like(bm)
for dx, dy in N4: t4 |= sh(bm, dx, dy)
nink = sum(sh(ol, dx, dy).astype(int) for dx, dy in N8)
ol &= t4 | (nink > 2)
out[ol] = INK
img = Image.fromarray(out, "RGBA")
ys, xs = np.where(out[..., 3] > 0); print("bbox", xs.min(), xs.max(), ys.min(), ys.max(), "colores", len(set(map(tuple, out[bm][:, :3]))))
img.resize((H * 8, H * 8), Image.NEAREST).save(sys.argv[2])
prev = Image.new("RGBA", (64 * 6 + 32 * 12 + 30, 64 * 6 + 20), (240, 232, 214, 255))
prev.alpha_composite(Image.open(WT / "assets/icons/a_flame.webp").convert("RGBA").resize((384, 384), Image.NEAREST), (10, 10))
prev.alpha_composite(img.resize((384, 384), Image.NEAREST), (404, 10))
prev.save(sys.argv[3])
