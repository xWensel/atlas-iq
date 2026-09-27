#!/usr/bin/env python3
"""Geolite - utilidades de pixel art dibujado a mano en codigo (solo desarrollo).
Mascaras booleanas numpy (alto x ancho), morfologia sin scipy, paleta de la marca y el globo con continentes reales
(Natural Earth de data/world.js, proyeccion ortografica). Lo usan tools/make_brand.py y tools/pixel_cleanup.py."""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

def hexc(h, a=255):
    h = h.lstrip("#"); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

# ---- paleta de la marca (rampas con desplazamiento de tono: sombras hacia el rojo/violeta, luces hacia el amarillo/cian)
P = {k: hexc(v) for k, v in dict(
    ink="1a0b26", plum="3a1a5e", plum2="2a1145", plumhi="5a2d86",
    g0="fffbe6", g1="ffe58a", g2="ffc94a", g3="f59e2e", g4="c9621f", g5="8f3322",
    ex1="a8391f", ex2="7a2328", ex3="4e1530",
    bulb="ffffff", bulb2="fff4c2",
    o0="7fe3ff", o1="3fb0ff", o2="2479e8", o3="1c4fc2", o4="1b2f8a", o5="1a1d5c",
    l0="d8f58a", l1="8fe05a", l2="46b84a", l3="2a8a4a", l4="1f5e45", l5="1a3d3f",
    c0="fffdf5", c1="efe3c8", c2="c6ad8a", r0="ff5a55", r1="e0283a", r2="a3173a", r3="6c1236",
    w0="fff6e6", w1="d9cbb8",
).items()}

# ---- morfologia
def shift(m, dx, dy):
    o = np.zeros_like(m); h, w = m.shape
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    o[yd, xd] = m[ys, xs]; return o

def disk(r):
    return [(dx, dy) for dy in range(-r, r + 1) for dx in range(-r, r + 1) if dx * dx + dy * dy <= r * r + r * 0.8]

def dilate(m, r=1, cross=True):
    k = [(1, 0), (-1, 0), (0, 1), (0, -1), (0, 0)] if (r == 1 and cross) else disk(r)
    o = np.zeros_like(m)
    for dx, dy in k: o |= shift(m, dx, dy)
    return o

def erode(m, r=1, cross=True):
    return ~dilate(~m, r, cross)

def opening(m, r):
    return dilate(erode(m, r, False), r, False) if r else m

def edge(m, dx, dy):
    """pixeles de m cuyo vecino (dx,dy) esta vacio"""
    return m & ~shift(m, -dx, -dy)

def paint(img, m, c):
    img[m] = c

def to_image(arr):
    return Image.fromarray(arr.astype(np.uint8), "RGBA")

def canvas(w, h):
    return np.zeros((h, w, 4), np.uint8)

def alpha(arr):
    return arr[..., 3] > 0

def blit(dst, src, x, y):
    """pega src (RGBA array) sobre dst en (x,y), alfa de 1 bit"""
    h, w = src.shape[:2]; H, W = dst.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x0 >= x1 or y0 >= y1: return
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]; m = s[..., 3] > 0
    dst[y0:y1, x0:x1][m] = s[m]

def outline(arr, col, cross=True):
    """contorno de 1 px alrededor de todo lo opaco"""
    a = alpha(arr); ring = dilate(a, 1, cross) & ~a; arr[ring] = col; return arr

# ---- tierra real: TopoJSON de data/world.js -> mascara equirectangular
_LAND = None
def land_mask(w=2048):
    global _LAND
    if _LAND is not None and _LAND.shape[1] == w: return _LAND
    src = (ROOT / "data" / "world.js").read_text(encoding="utf8")
    T = json.loads(src[src.index("{"):src.rindex("}") + 1]); tr = T.get("transform")
    arcs = []
    for a in T["arcs"]:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy
            pts.append((x * tr["scale"][0] + tr["translate"][0], y * tr["scale"][1] + tr["translate"][1]) if tr else (x, y))
        arcs.append(pts)
    def ring(r):
        o = []
        for i in r:
            a = arcs[~i][::-1] if i < 0 else arcs[i]
            o.extend(a[1:] if o else a)
        return o
    h = w // 2; im = Image.new("L", (w, h), 0); d = ImageDraw.Draw(im)
    for g in list(T["objects"].values())[0]["geometries"]:
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"] if g["type"] == "MultiPolygon" else []
        for p in polys:
            pts = [((lon + 180) / 360 * w, (90 - lat) / 180 * h) for lon, lat in ring(p[0])]
            if len(pts) > 2 and max(x for x, _ in pts) - min(x for x, _ in pts) < w * 0.6: d.polygon(pts, fill=255)
    _LAND = np.array(im) > 127; return _LAND

def sphere(D, lon0=-38, lat0=12, light=(-0.55, -0.62, 0.56), ss=5):
    """globo de D px: devuelve (dentro, tierra, luz) por pixel. luz = lambert medio (0..1); tierra = cobertura >= 50 %"""
    L = np.array(light); L = L / np.linalg.norm(L); land = land_mask(); lh, lw = land.shape
    R = D / 2; inside = np.zeros((D, D), bool); cov = np.zeros((D, D)); lit = np.zeros((D, D))
    la0, lo0 = math.radians(lat0), math.radians(lon0)
    for y in range(D):
        for x in range(D):
            n = 0; lc = 0; li = 0
            for sy in range(ss):
                for sx in range(ss):
                    u = (x + (sx + .5) / ss - R) / R; v = (y + (sy + .5) / ss - R) / R
                    rr = u * u + v * v
                    if rr > 1: continue
                    z = math.sqrt(1 - rr); n += 1
                    li += max(0.0, u * L[0] + v * L[1] + z * L[2])
                    # ortografica inversa (v hacia abajo = sur)
                    yy = -v; rho = math.sqrt(rr); c = math.asin(min(1, rho))
                    if rho < 1e-9: lat, lon = la0, lo0
                    else:
                        lat = math.asin(math.cos(c) * math.sin(la0) + yy * math.sin(c) * math.cos(la0) / rho)
                        lon = lo0 + math.atan2(u * math.sin(c), rho * math.cos(la0) * math.cos(c) - yy * math.sin(la0) * math.sin(c))
                    lon = (math.degrees(lon) + 540) % 360 - 180; lat = math.degrees(lat)
                    px = min(lw - 1, int((lon + 180) / 360 * lw)); py = min(lh - 1, int((90 - lat) / 180 * lh))
                    lc += land[py, px]
            if n >= ss * ss * 0.5:
                inside[y, x] = True; cov[y, x] = lc / n; lit[y, x] = li / n
    return inside, cov >= 0.5, lit

def despeckle(m, keep=None, passes=2):
    """quita pixeles sueltos de una mascara (menos de 2 vecinos cruzados) y rellena huecos de 1 px"""
    for _ in range(passes):
        nb = sum(shift(m, dx, dy).astype(int) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        m = (m & (nb >= 2)) | (~m & (nb >= 3))
        if keep is not None: m &= keep
    return m
