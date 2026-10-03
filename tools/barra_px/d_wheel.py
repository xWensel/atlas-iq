"""Ruleta de premios: rueda de la fortuna de frente sobre su pie dorado, 8 cunas de colores con radios de oro,
aro con bombillas, cubo dorado y la lengueta roja arriba."""
import numpy as np
from dk import *

def build(path):
    g = G()
    cx, cy, R = 24.0, 23.0, 18.0
    d = np.sqrt((XX + .5 - cx) ** 2 + (YY + .5 - cy) ** 2)
    Lc = light(cx, cy); A = ang(cx, cy)
    # pie: poste y peana (detras de la rueda)
    post = (XX >= 21) & (XX <= 26) & (YY >= 36) & (YY <= 42)
    base = poly([(11, 42), (37, 42), (40, 47), (8, 47)])
    g.mask_paint(base, "g"); g.mask_paint(base & (YY == 42), "c"); g.mask_paint(base & (YY >= 46), "a"); g.mask_paint(base & (XX <= 10), "c")
    g.mask_paint(dilate(post, 1, cross=False) & ~post & base, "#")
    g.mask_paint(post, "g"); g.mask_paint(post & (XX <= 22), "c"); g.mask_paint(post & (XX >= 26), "a")
    # silueta de la rueda con su contorno sobre el pie
    wheel = d < R
    g.mask_paint(dilate(wheel, 1, cross=False) & ~wheel & (g.g != "."), "#")
    # aro de oro
    rim = (d >= R - 3) & wheel
    g.mask_paint(rim, "g"); g.mask_paint(rim & (Lc > -0.3), "c"); g.mask_paint(rim & (Lc > 0.55) & (d >= R - 2), "h"); g.mask_paint(rim & (Lc < -0.7) & (d >= R - 1.2), "a")
    # cunas: 8 colores, limites en 0/45/90... (radios rectos y diagonales limpias)
    inner = d < R - 3
    k = np.floor((A % 360) / 45).astype(int)
    cols = ["r", "w", "T", "p", "r", "w", "T", "p"]
    shade = {"r": ("R", "m"), "w": ("w", "v"), "T": ("U", "W"), "p": ("P", "q")}
    for i, c in enumerate(cols):
        m = inner & (k == i)
        g.mask_paint(m, c)
        hi, lo = shade[c]
        g.mask_paint(m & (d >= R - 6) & (Lc > 0.35), hi)          # luz en el borde de fuera, del lado de la luz
        g.mask_paint(m & (d >= R - 5) & (Lc < -0.45), lo)         # sombra del aro del otro lado
    # radios de oro (horizontal, vertical y diagonales)
    ix, iy = XX + .5 - cx, YY + .5 - cy
    spoke = inner & ((np.abs(ix) < .6) | (np.abs(iy) < .6) | (np.abs(np.abs(ix) - np.abs(iy)) < .75))
    g.mask_paint(spoke, "g"); g.mask_paint(spoke & (Lc > 0.0), "c")
    # bombillas en el aro, a mitad de cada cuna
    for j in range(8):
        a = np.radians(22.5 + 45 * j)
        bx, by = cx + np.cos(a) * (R - 1.5), cy + np.sin(a) * (R - 1.5)
        x0, y0 = int(np.floor(bx - .5)), int(np.floor(by - .5))
        for x, y in ((x0, y0), (x0 + 1, y0), (x0, y0 + 1), (x0 + 1, y0 + 1)):
            g.put(x, y, "w")
        g.put(x0 + 1, y0 + 1, "h")
    # cubo
    hub = d < 4.2
    g.mask_paint(dilate(hub, 1, cross=False) & ~hub, "#")
    g.mask_paint(hub, "c"); g.mask_paint(hub & (Lc > 0.4), "h"); g.mask_paint(hub & (Lc < -0.4), "a")
    # lengueta roja arriba, apuntando hacia dentro
    fl = poly([(19.5, 1), (28.5, 1), (24, 10)])
    g.mask_paint(dilate(fl, 1, cross=False) & ~fl, "#")
    g.mask_paint(fl, "r"); g.mask_paint(fl & (XX <= 22), "R"); g.mask_paint(fl & (XX >= 26), "m")
    g.put(21, 2, "w")
    pal = """h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c
r=#e8283a
R=#ff6470
m=#a8142e
w=#fff6e4
v=#d9c8b4
T=#2fcfb0
U=#7aeed6
W=#178a80
p=#8a3ae0
P=#b77cff
q=#56208f"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/bet_wheel.txt")
