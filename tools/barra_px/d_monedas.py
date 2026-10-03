"""Doblones: tres pilas de doblones de oro (la de detras, alta), con la estrella en la moneda de arriba.
Mismo dibujo de moneda que las pilas aceptadas de bet_offer: cara clara de 4 filas y canto a franjas (una moneda = 2 filas)."""
import numpy as np
from dk import *

FACE = ["....hhhhhhh....",
        "..hhccchccccg..",
        ".hcccchhhcccgg.",
        "hccccccheccccga"]
S0 = "hhcccccccccccga"
S1 = "cgggggggggggaaa"
BOT = ".aaaaaaaaaaaaa."

def stack(g, x0, y0, n):
    rows = FACE + [S0, S1] * n + [BOT]
    m = np.zeros((48, 48), bool)
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch != "." and 0 <= y0 + j < 48: m[y0 + j, x0 + i] = True
    g.mask_paint(dilate(m, 1, cross=False) & ~m & (g.g != "."), "#")
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch != ".": g.put(x0 + i, y0 + j, ch)

def build(path):
    g = G()
    stack(g, 17, 6, 9)        # detras, alta
    stack(g, 7, 22, 6)        # izquierda
    stack(g, 26, 29, 5)       # derecha, delante
    pal = """h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c
e=#b8620c"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/pz_monedas.txt")
