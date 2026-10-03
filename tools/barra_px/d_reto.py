"""Reto extra: carta de reto violeta con marco dorado, calavera de hueso en el centro y lacre rojo con cintas abajo (sellado)."""
import numpy as np
from dk import *

def build(path):
    g = G()
    # carta
    x0, x1, y0, y1 = 10, 37, 3, 41
    card = (XX >= x0) & (XX <= x1) & (YY >= y0) & (YY <= y1)
    for (cx_, cy_) in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)): card[cy_, cx_] = False      # esquinas romas
    g.mask_paint(card, "g")
    frame_in = (XX >= x0 + 2) & (XX <= x1 - 2) & (YY >= y0 + 2) & (YY <= y1 - 2)
    g.mask_paint(card & ~frame_in & ((XX <= x0 + 1) | (YY <= y0 + 1)), "c")
    g.mask_paint(card & ~frame_in & (((XX == x0) & (YY < y1 - 2)) | ((YY == y0) & (XX < x1 - 2))), "h")
    g.mask_paint(card & ~frame_in & ((XX >= x1 - 1) | (YY >= y1 - 1)), "g")
    g.mask_paint(card & ~frame_in & ((XX == x1) | (YY == y1)), "a")
    # panel violeta con su borde fino de tinta
    panel = (XX >= x0 + 3) & (XX <= x1 - 3) & (YY >= y0 + 3) & (YY <= y1 - 3)
    g.mask_paint(frame_in & ~panel, "#")
    g.mask_paint(panel, "p")
    g.mask_paint(panel & ((XX >= x1 - 4) | (YY >= y1 - 4)), "q")
    g.mask_paint(panel & ((XX == x0 + 3) | (YY == y0 + 3)), "P")
    # calavera
    cx, cy = 24.0, 15.0
    cran = ell(cx, cy, 7.0, 6.5)
    jaw = (XX >= 20) & (XX <= 27) & (YY >= 19) & (YY <= 23)
    sk = cran | jaw
    g.mask_paint(dilate(sk, 1, cross=False) & ~sk, "#")
    g.mask_paint(sk, "b")
    Ls = light(cx, cy)
    g.mask_paint(cran & (Ls < -0.35), "B"); g.mask_paint(jaw & (XX >= 26), "B"); g.mask_paint(jaw & (YY == 23), "B")
    g.mask_paint(cran & (Ls > 0.55) & ~ell(cx, cy, 5.2, 4.8), "w")
    for ex in (20, 25):
        for x, y in ((ex, 15), (ex + 1, 15), (ex + 2, 15), (ex, 16), (ex + 1, 16), (ex + 2, 16), (ex, 17), (ex + 1, 17), (ex + 2, 17)):
            g.put(x, y, "#")
        g.put(ex + 2, 15, "k")
    g.put(23, 19, "#"); g.put(24, 19, "#"); g.put(23, 18, "B"); g.put(24, 18, "B")
    for x in (21, 23, 25): g.put(x, 21, "#"); g.put(x, 22, "#")
    g.put(26, 21, "B")
    # lacre rojo: disco con su aro hundido y brillo (sin cintas)
    sx, sy = 24.0, 33.0
    seal = ell(sx, sy, 6.0, 5.6)
    g.mask_paint(dilate(seal, 1, cross=False) & ~seal, "#")
    g.mask_paint(seal, "r")
    Ld = light(sx, sy)
    g.mask_paint(seal & (Ld < -0.35), "m"); g.mask_paint(seal & (Ld > 0.5) & ~ell(sx, sy, 4.4, 4.0), "R")
    rng = ring(sx, sy, 2.6, 3.6, sy=5.6 / 6.0)
    g.mask_paint(rng & (Ld > 0), "m"); g.mask_paint(rng & (Ld <= 0), "R")
    g.put(21, 30, "w"); g.put(22, 30, "w")
    pal = """h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c
p=#6a32b8
P=#8f5ae0
q=#4a2088
b=#fcf4d5
B=#c9bfa5
w=#ffffff
k=#5c0c24
r=#e8283a
R=#ff6470
m=#a8142e"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/pz_reto.txt")
