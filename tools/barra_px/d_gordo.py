"""Premio gordo: pila de tres lingotes de oro (dos abajo, uno encima), en perspectiva oblicua 2:1 (lineas limpias),
cara de arriba la mas clara, frente dorado con la marca hundida y lateral en sombra."""
import numpy as np
from dk import *

def bar(g, x0, yb, W=19, H=11, D=4):
    dx = 2 * D
    front = poly([(x0, yb + 1), (x0 + W, yb + 1), (x0 + W - 2, yb + 1 - H), (x0 + 2, yb + 1 - H)])
    top = poly([(x0 + 2, yb + 1 - H), (x0 + W - 2, yb + 1 - H), (x0 + W - 2 + dx, yb + 1 - H - D), (x0 + 2 + dx, yb + 1 - H - D)])
    side = poly([(x0 + W, yb + 1), (x0 + W + dx, yb + 1 - D), (x0 + W - 2 + dx, yb + 1 - H - D), (x0 + W - 2, yb + 1 - H)]) & ~front & ~top
    allm = front | top | side
    g.mask_paint(dilate(allm, 1, cross=False) & ~allm & (g.g != "."), "#")
    g.mask_paint(top, "c"); g.mask_paint(top & (YY == yb + 1 - H - D), "h")
    g.mask_paint(top & (XX < x0 + 2 + dx + 3) & (YY <= yb - H), "h")
    g.mask_paint(front, "g")
    g.mask_paint(front & (YY == yb + 1 - H), "c")                 # arista de arriba del frente, iluminada
    g.mask_paint(front & (XX <= x0 + 2 + (yb - YY) // 3 * 0) & (XX < x0 + 3), "c")
    g.mask_paint(front & (YY == yb), "a")
    # la marca hundida del frente
    mx0, mx1, my = x0 + 6, x0 + W - 6, yb - 5
    for x in range(mx0, mx1 + 1): g.put(x, my, "a")
    for x in range(mx0, mx1 + 1): g.put(x, my + 1, "c")
    g.put(mx0 - 1, my, "a"); g.put(mx1 + 1, my + 1, "c")
    g.mask_paint(side, "a"); g.mask_paint(side & (YY <= yb - H), "g")
    # brillo de la cara de arriba
    g.put(x0 + 2 + dx, yb + 1 - H - D, "w"); g.put(x0 + 3 + dx, yb + 1 - H - D, "w")

def build(path):
    g = G()
    bar(g, 1, 40)             # abajo izquierda
    bar(g, 20, 40)            # abajo derecha
    bar(g, 10, 29)            # encima
    pal = """w=#ffffff
h=#fff3b0
c=#fdd742
g=#efa526
a=#b8620c"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/pz_gordo.txt")
