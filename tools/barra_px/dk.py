"""pequeño kit para redibujar a limpio sobre la rejilla nativa (rejilla de caracteres -> grid.py)"""
import math, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pxkit import dilate, erode, shift
import numpy as np
from PIL import Image, ImageDraw

class G:
    def __init__(self, w=48, h=48):
        self.w, self.h = w, h; self.g = np.full((h, w), ".", dtype="<U1")
    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h: self.g[y, x] = c
    def mask_paint(self, m, c, only=None):
        if only is not None: m = m & np.isin(self.g, list(only))
        self.g[m] = c
    def rows(self): return ["".join(r) for r in self.g]
    def write(self, path, pal, extra=""):
        open(path, "w").write(pal.strip() + "\n" + extra + "\n\n" + "\n".join(self.rows()) + "\n")

YY, XX = np.mgrid[0:48, 0:48]

def ell(cx, cy, rx, ry, w=48, h=48):
    """elipse rellena: centros de pixel dentro"""
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx + .5 - cx) / rx) ** 2 + ((yy + .5 - cy) / ry) ** 2 <= 1.0

def ring(cx, cy, r0, r1, sy=1.0):
    d = np.sqrt((XX + .5 - cx) ** 2 + ((YY + .5 - cy) / sy) ** 2); return (d >= r0) & (d < r1)

def ang(cx, cy, sy=1.0):
    """angulo en grados (0 = derecha, 90 = abajo) de cada pixel respecto al centro"""
    return (np.degrees(np.arctan2((YY + .5 - cy) / sy, XX + .5 - cx)) + 360) % 360

def light(cx, cy, lx=-1, ly=-1.2, sy=1.0):
    """-1..1: cuanto mira cada pixel hacia la luz (arriba-izquierda)"""
    vx = XX + .5 - cx; vy = (YY + .5 - cy) / sy; n = np.sqrt(vx * vx + vy * vy) + 1e-6
    L = math.hypot(lx, ly); return (vx * lx + vy * ly) / n / L

def poly(pts, w=48, h=48):
    im = Image.new("L", (w * 4, h * 4), 0); d = ImageDraw.Draw(im)
    d.polygon([(x * 4, y * 4) for x, y in pts], fill=255)
    a = np.array(im.resize((w, h), Image.BOX)); return a >= 128

def line(x0, y0, x1, y1):
    pts = []; dx = abs(x1 - x0); dy = -abs(y1 - y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1; err = dx + dy
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1: break
        e2 = 2 * err
        if e2 >= dy: err += dy; x0 += sx
        if e2 <= dx: err += dx; y0 += sy
    return pts
