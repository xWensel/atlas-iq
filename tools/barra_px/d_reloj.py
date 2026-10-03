"""Reloj corto: cronometro dorado con esfera blanca y solo una cuna roja de tiempo (casi agotado), la aguja al final de la cuna."""
import numpy as np
from dk import *

def build(path):
    g = G()
    cx, cy, R = 24.0, 27.0, 17.0
    d = np.sqrt((XX + .5 - cx) ** 2 + (YY + .5 - cy) ** 2)
    Lc = light(cx, cy); A = ang(cx, cy)
    # corona: tapa y vastago (detras del cuerpo)
    cap = (XX >= 19) & (XX <= 28) & (YY >= 3) & (YY <= 6)
    stem = (XX >= 22) & (XX <= 25) & (YY >= 7) & (YY <= 10)
    g.mask_paint(cap | stem, "g"); g.mask_paint(cap & (YY == 3), "h"); g.mask_paint(cap & (YY == 4), "c")
    g.mask_paint(cap & (YY == 6), "a"); g.mask_paint(stem & (XX == 22), "c"); g.mask_paint(stem & (XX == 25), "a")
    g.mask_paint(dilate(stem, 1, cross=False) & ~stem & ~cap & (YY == 7), "#")
    # boton lateral a 45 grados
    btn = poly([(37.5, 9.5), (41.5, 13.5), (39.0, 16.0), (35.0, 12.0)])
    g.mask_paint(btn, "g"); g.mask_paint(btn & (XX + YY <= 48), "c")
    # cuerpo
    body = d < R
    g.mask_paint(dilate(body, 1, cross=False) & ~body & (g.g != "."), "#")
    rim = body & (d >= R - 3)
    g.mask_paint(rim, "g"); g.mask_paint(rim & (Lc > -0.25), "c"); g.mask_paint(rim & (Lc > 0.55) & (d >= R - 2), "h"); g.mask_paint(rim & (Lc < -0.7) & (d >= R - 1.2), "a")
    face = d < R - 3
    g.mask_paint(ring(cx, cy, R - 4, R - 3), "#")              # bisel fino de tinta entre aro y esfera
    face = d < R - 4
    g.mask_paint(face, "w"); g.mask_paint(face & (Lc < -0.35) & (d > R - 8), "v")
    # la cuna roja que queda: de las 12 a las 2
    sec = face & (d < R - 6) & (A >= 270) & (A < 330)
    g.mask_paint(sec, "r"); g.mask_paint(sec & (d < 5), "R"); g.mask_paint(sec & (A >= 322), "m")
    # marcas de las horas
    for k in range(12):
        a = np.radians(k * 30 - 90)
        r0, r1 = (R - 5.2, R - 7.6) if k % 3 == 0 else (R - 5.2, R - 6.2)
        for t in np.linspace(r1, r0, 6):
            x, y = int(np.floor(cx + np.cos(a) * t)), int(np.floor(cy + np.sin(a) * t))
            if face[y, x]: g.put(x, y, "k" if k % 3 == 0 else "v")
    # aguja al final de la cuna (las 2) y centro
    a = np.radians(330 - 0)
    for t in np.linspace(0, R - 7.5, 30):
        x, y = int(np.floor(cx + np.cos(a) * t)), int(np.floor(cy + np.sin(a) * t))
        g.put(x, y, "k")
    for x, y in ((23, 26), (24, 26), (23, 27), (24, 27)): g.put(x, y, "k")
    g.put(23, 26, "c")
    # brillo del cristal
    g.put(15, 19, "w"); g.put(16, 18, "w")
    pal = """h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c
w=#ffffff
v=#c8c8dc
k=#1d0a3d
r=#e8283a
R=#ff6470
m=#a8142e"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/pz_reloj.txt")
