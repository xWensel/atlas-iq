"""Rojo o negro: ruleta vista desde arriba con la Tierra de Geolite en el centro.
Aro de oro con canto, 17 casillas (cero verde arriba, rojas y negras alternas), aro fino de oro, cuenco de caoba, la Tierra y la bola blanca."""
import numpy as np
from pathlib import Path
from dk import *

def earth_land(cx, cy, r, src_r=15.0):
    """los continentes de la Tierra de la ruleta de marca (assets/icons/roulette.webp, 64 px nativos, Tierra de radio ~15),
    bajados por mayoria de submuestras: misma Tierra, sin motas"""
    from PIL import Image
    im = np.array(Image.open(str(Path(__file__).resolve().parent.parent.parent / "assets" / "icons" / "roulette.webp")).convert("RGB"))[::8, ::8].astype(int)
    isl = (im[..., 0] > 180) & (im[..., 1] > 180) & (im[..., 2] < 160)
    out = np.zeros((48, 48), bool); f = src_r / r
    for y in range(48):
        for x in range(48):
            n = 0; t = 0
            for sy in (-.33, 0, .33):
                for sx in (-.33, 0, .33):
                    u = 32 + (x + .5 + sx - cx) * f; v = 32 + (y + .5 + sy - cy) * f
                    if 0 <= u < 64 and 0 <= v < 64: t += 1; n += isl[int(v), int(u)]
            out[y, x] = t and n * 2 > t
    return out

def build(path):
    g = G()
    cx, cy, R = 24.0, 23.0, 21.0
    d = np.sqrt((XX + .5 - cx) ** 2 + (YY + .5 - cy) ** 2)
    Lc = light(cx, cy)
    A = ang(cx, cy)
    # canto: el mismo disco 3 px mas abajo
    edge = ring(cx, cy + 3, 0, R) & ~ring(cx, cy, 0, R)
    g.mask_paint(ring(cx, cy + 3, 0, R), "a")
    g.mask_paint(edge & (YY >= cy + 3 + R * 0.55), "A")
    g.mask_paint(edge & (XX < cx - R * 0.55), "g")
    # aro de oro
    rim = (d >= R - 3) & (d < R)
    g.mask_paint(rim, "g"); g.mask_paint(rim & (Lc > -0.3), "c"); g.mask_paint(rim & (Lc > 0.5) & (d >= R - 2), "h")
    g.mask_paint(rim & (Lc < -0.7) & (d >= R - 1.2), "a")
    # casillas
    N = 17; step = 360 / N
    k = np.floor(((A - 270 + step / 2) % 360) / step).astype(int)
    pk = (d >= 12.0) & (d < R - 3)
    red = pk & (k % 2 == 1); blk = pk & (k % 2 == 0) & (k != 0); grn = pk & (k == 0)
    g.mask_paint(red, "r"); g.mask_paint(blk, "n"); g.mask_paint(grn, "z")
    wall = pk & (d >= R - 4.2)                                     # sombra del aro sobre la pared de fuera de la casilla
    g.mask_paint(wall & red, "m"); g.mask_paint(wall & blk, "o"); g.mask_paint(wall & grn, "Z")
    # brillo del borde de dentro de cada casilla del lado de la luz
    g.mask_paint(red & (d < 14.0) & (Lc > 0.3), "R"); g.mask_paint(blk & (d < 14.0) & (Lc > 0.3), "N")
    # aro fino de oro y cuenco de caoba
    fin = (d >= 10.4) & (d < 12.0)
    g.mask_paint(fin, "c"); g.mask_paint(fin & (Lc < -0.35), "g")
    # la Tierra
    E = d < 10.4
    g.mask_paint(E, "O")
    land = earth_land(cx, cy, 10.4) & E
    g.mask_paint(land, "T")
    Lg = light(cx, cy)
    g.mask_paint(E & ~land & (Lg > 0.45) & (d > 5.5), "P"); g.mask_paint(E & ~land & (Lg < -0.35) & (d > 6.5), "Q")
    g.mask_paint(land & (Lg > 0.45) & (d > 4.5), "U"); g.mask_paint(land & (Lg < -0.35) & (d > 6.5), "W")
    g.put(18, 16, "w"); g.put(19, 16, "w"); g.put(18, 17, "w")
    # bola blanca en una casilla (arriba a la derecha) con su contorno
    bx, by = 35, 11
    ball = np.zeros((48, 48), bool)
    for x, y in ((bx, by), (bx + 1, by), (bx - 1, by + 1), (bx, by + 1), (bx + 1, by + 1), (bx + 2, by + 1), (bx, by + 2), (bx + 1, by + 2)): ball[y, x] = True
    g.mask_paint(dilate(ball, 1, cross=False) & ~ball, "#")
    g.mask_paint(ball, "w"); g.put(bx + 2, by + 1, "V"); g.put(bx + 1, by + 2, "V"); g.put(bx, by + 2, "V")
    pal = """h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c
A=#7a3a0a
r=#e8283a
R=#ff6470
m=#a8142e
n=#3a2f58
N=#5d5088
o=#241b3c
z=#1fae5a
y=#62e08e
Z=#127a3c
b=#8a3a1e
B=#5c2412
O=#2f8ff0
P=#7fd0ff
Q=#1d5fc4
T=#43c96b
U=#a4f08a
W=#1f8a4a
w=#ffffff
V=#c8d8e0"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/bet_red.txt")
