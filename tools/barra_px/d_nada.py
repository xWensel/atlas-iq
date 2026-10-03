"""Nada: cofre del tesoro abierto y VACIO (solo oscuridad dentro) con una polilla saliendo volando."""
import numpy as np
from dk import *

def build(path):
    g = G()
    # tapa abierta hacia atras (cara de dentro, en sombra), con aro dorado y tablas
    lid = poly([(7, 22), (41, 22), (39, 9), (35, 5.5), (13, 5.5), (9, 9)])
    g.mask_paint(lid, "m")
    lid_in = poly([(10, 21), (38, 21), (36.5, 10.5), (33.5, 8), (14.5, 8), (11.5, 10.5)])
    g.mask_paint(lid & ~lid_in, "g"); g.mask_paint(lid & ~lid_in & (XX <= 12), "c"); g.mask_paint(lid & ~lid_in & (YY <= 7), "c")
    g.mask_paint(lid_in, "k")
    for x in (18, 24, 30): g.mask_paint(lid_in & (XX == x), "K")      # juntas de las tablas
    g.mask_paint(lid_in & (YY <= 10), "K")
    # hueco del cofre: oscuro y vacio
    hole = poly([(8, 22), (40, 22), (40, 27), (8, 27)])
    g.mask_paint(hole, "o"); g.mask_paint(hole & (YY >= 26), "O")
    # caja
    box = poly([(6, 27), (42, 27), (42, 44), (6, 44)])
    g.mask_paint(dilate(box, 1, cross=False) & ~box & (g.g != "."), "#")
    g.mask_paint(box, "r")
    g.mask_paint(box & (YY >= 41), "m"); g.mask_paint(box & (XX <= 7), "R"); g.mask_paint(box & (XX >= 40), "m")
    for y in (33, 38): g.mask_paint(box & (YY == y), "m")          # tablas
    # borde dorado de arriba y flejes
    g.mask_paint(box & (YY <= 28), "c"); g.mask_paint(box & (YY == 27), "h"); g.mask_paint(box & (YY == 28) & (XX >= 38), "g")
    for x0 in (10, 35):
        st = box & (XX >= x0) & (XX <= x0 + 2)
        g.mask_paint(st, "g"); g.mask_paint(st & (XX == x0), "c"); g.mask_paint(st & (XX == x0 + 2), "a")
    g.mask_paint(box & (YY == 44), "a")
    # cerradura
    lock = poly([(20, 29), (28, 29), (28, 37), (24, 39), (20, 37)])
    g.mask_paint(dilate(lock, 1, cross=False) & ~lock & box, "#")
    g.mask_paint(lock, "c"); g.mask_paint(lock & (XX >= 27), "g"); g.mask_paint(lock & (YY == 29), "h")
    for x, y in ((23, 32), (24, 32), (23, 33), (24, 33), (24, 34), (24, 35)): g.put(x, y, "#")
    # polilla saliendo del cofre
    M = ["ww.....ww",
         "wwv.b.vww",
         ".wvvbvvw.",
         "..vwbwv..",
         "....b...."]
    moth = {}
    for j, r in enumerate(M):
        for i, ch in enumerate(r):
            if ch != ".": moth[(37 + i, 1 + j)] = ch
    mm = np.zeros((48, 48), bool)
    for (x, y), c in moth.items(): mm[y, x] = True
    g.mask_paint(dilate(mm, 1, cross=False) & ~mm & (g.g == "."), "#")
    for (x, y), c in moth.items(): g.put(x, y, c)
    pal = """h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c
r=#d8323e
R=#ff6470
m=#9a1a34
k=#5c1430
K=#3e0c24
o=#2a1030
O=#1d0a3d
v=#c8c8dc
w=#ffffff
b=#5a4f80"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/pz_nada.txt")
