"""Iconos de retos de la tanda 15 (Ctrl+Z, Noche de tormenta, Pregunta trampa, Gigantes y enanos) (48 px nativos x8 = 384), dibujados a mano en codigo con el mismo libro de estilo que las fichas de logro:
luz arriba-izquierda, bandas de 2-3 tonos y contorno indigo continuo de 1 px (por cada pieza, como en los logros)."""
import sys, math
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw

N = 48; K = 8
INK = (29, 10, 61)
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
def hexc(h): return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def ramp(*h): return [hexc(x) for x in h]
R = {
    "gold": ramp("fff6c8", "ffd95a", "f5a623", "c46a1b", "7f3a1a"),
    "red": ramp("ffa08f", "ff5a55", "d8283f", "9c1a3f", "5e1238"),
    "blue": ramp("a8ecff", "4cb4ff", "2a78e4", "1f4bb0", "1d2a6e"),
    "teal": ramp("b0ffe8", "4ee3c1", "1fb3a3", "16787f", "164a5c"),
    "cream": ramp("ffffff", "fff4dc", "eedcb8", "c9aa84", "8a6a58"),
    "brown": ramp("f2b27a", "d07f45", "a45530", "73352a", "4a2126"),
    "dark": ramp("6a6f96", "4a4d72", "33345a", "24234a", "181636"),
    "purple": ramp("ecc2ff", "b36cff", "8440e0", "5a2ab0", "351a70"),
    "ice": ramp("ffffff", "e8f7ff", "b7e2f7", "7fb1d9", "4f73a8"),
    "grey": ramp("f4f4f8", "c8cbd8", "9095ab", "5f6480", "3a3b58"),
}
yy, xx = np.mgrid[0:N, 0:N]
def blank(): return np.zeros((N, N), bool)
def rect(x0, y0, x1, y1): m = blank(); m[max(0, y0):y1 + 1, max(0, x0):x1 + 1] = True; return m
def poly(pts):
    im = Image.new("L", (N, N)); ImageDraw.Draw(im).polygon([(x, y) for x, y in pts], fill=255); return np.array(im) > 0
def ell(cx, cy, rx, ry): return ((xx + .5 - cx) / rx) ** 2 + ((yy + .5 - cy) / ry) ** 2 <= 1
def thick(pts, w=2):
    im = Image.new("L", (N, N)); d = ImageDraw.Draw(im)
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): d.line([(x0, y0), (x1, y1)], fill=255, width=w)
    return np.array(im) > 0
def sh(m, dx, dy):
    o = np.zeros_like(m)
    ys, xs = slice(max(0, dy), N + min(0, dy)), slice(max(0, dx), N + min(0, dx))
    yd, xd = slice(max(0, -dy), N + min(0, -dy)), slice(max(0, -dx), N + min(0, -dx))
    o[ys, xs] = m[yd, xd]; return o
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1)); N8 = N4 + ((1, 1), (-1, -1), (1, -1), (-1, 1))
def outline(m):
    ol = np.zeros_like(m)
    for dx, dy in N8: ol |= sh(m, dx, dy)
    ol &= ~m
    t4 = np.zeros_like(m)
    for dx, dy in N4: t4 |= sh(m, dx, dy)
    nink = sum(sh(ol, dx, dy).astype(int) for dx, dy in N8)
    return ol & (t4 | (nink > 2))
def edge(m, dx, dy): return m & ~sh(m, dx, dy)      # pixel de m cuyo vecino (dx,dy) ya no esta en m

class Cv:
    def __init__(s): s.c = np.zeros((N, N, 4), np.uint8)
    def put(s, m, col): s.c[m, :3] = col; s.c[m, 3] = 255
    def piece(s, m, col, ink=True):
        if ink: s.put(outline(m), INK)
        s.put(m, col)
    def bevel(s, m, rp, soft=True):
        """cara con bisel: brillo arriba y a la izquierda, sombra de 1-2 px abajo y a la derecha"""
        s.piece(m, rp[2])
        if soft:
            inner = m & sh(m, 1, 0) & sh(m, 0, 1) & sh(m, -1, 0) & sh(m, 0, -1)
            s.put(m & ~sh(inner, -1, -1) & ~edge(m, 0, 1) & ~edge(m, 1, 0) & (edge(m, 0, 1) | edge(m, 1, 0) | ~inner) & blank(), rp[2]) if False else None
        s.put(edge(m, 1, 0) | edge(m, 0, 1), rp[3])
        s.put(edge(m, -1, 0) | edge(m, 0, -1), rp[1])
        s.put(edge(m, 0, -1) & edge(m, -1, 0), rp[0])
    def px(s, x, y, col):
        if 0 <= x < N and 0 <= y < N: s.c[y, x, :3] = col; s.c[y, x, 3] = 255
    def save(s, name):
        im = Image.fromarray(s.c, "RGBA"); im.resize((N * K, N * K), Image.NEAREST).save(OUT / f"{name}.webp", "WEBP", lossless=True, method=6)
        im.save(OUT / f"{name}_native.png")

R["green"] = ramp("d4ffb0", "7ee05a", "3fae3f", "23743a", "154a38")
R["orange"] = ramp("ffd9a0", "ffa044", "e8742a", "a8481f", "6a2a1c")

def arc_pts(cx, cy, rx, ry, a0, a1, n=24):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

# ================================================================== Ctrl+Z
def ctrlz():
    cv = Cv()
    # tecla Ctrl (atras, oscura) con el acento circunflejo
    k1 = rect(3, 29, 21, 43); cv.bevel(k1, R["dark"])
    cv.put(rect(5, 31, 19, 41), R["dark"][3]); cv.put(rect(5, 31, 19, 31) | rect(5, 31, 5, 41), R["dark"][2])
    for (x, y) in [(9, 38), (10, 37), (11, 36), (12, 36), (13, 37), (14, 38)]: cv.px(x, y, R["cream"][1])
    for (x, y) in [(9, 39), (10, 38), (11, 37), (12, 37), (13, 38), (14, 39)]: cv.px(x, y, R["cream"][3])
    # tecla Z (delante, crema)
    k2 = rect(20, 22, 44, 44); cv.bevel(k2, R["cream"])
    cv.put(rect(22, 24, 42, 42), R["cream"][1]); cv.put(rect(22, 24, 42, 24) | rect(22, 24, 22, 42), R["cream"][0]); cv.put(rect(22, 42, 42, 42) | rect(42, 24, 42, 42), R["cream"][2])
    z = thick([(27, 28), (37, 28), (27, 38), (37, 38)], 3); cv.put(z, R["purple"][4]); cv.put(edge(z, 0, -1) | edge(z, -1, 0), R["purple"][3])
    # flecha de deshacer: arco ancho por arriba que acaba apuntando abajo
    ar = thick(arc_pts(26, 18, 17, 12, -18, -170, 32), 4); cv.piece(ar, R["gold"][2]); cv.put(edge(ar, 0, -1) | edge(ar, -1, 0), R["gold"][1]); cv.put(edge(ar, 0, 1) | edge(ar, 1, 0), R["gold"][3])
    hd = poly([(2, 18), (16, 18), (9, 29)]); cv.piece(hd, R["gold"][2]); cv.put(edge(hd, 0, -1) | edge(hd, -1, 0), R["gold"][1]); cv.put(edge(hd, 1, 0) | edge(hd, 0, 1), R["gold"][3])
    cv.save("ch_ctrlz")

# ================================================================== Noche de tormenta
def stormnight():
    cv = Cv()
    tile = rect(3, 4, 44, 43); cv.put(outline(tile), INK); cv.put(tile, R["dark"][2]); cv.put(edge(tile, 0, -1) | edge(tile, -1, 0), R["dark"][1]); cv.put(edge(tile, 0, 1) | edge(tile, 1, 0), R["dark"][3])
    inner = rect(6, 7, 41, 40); cv.put(inner, R["dark"][4]); cv.put(rect(6, 7, 41, 7) | rect(6, 7, 6, 40), hexc("0e0c26"))
    # tierra a oscuras, con una mancha alumbrada junto al rayo
    land = poly([(6, 35), (11, 30), (17, 32), (23, 28), (29, 31), (35, 28), (41, 31), (41, 40), (6, 40)]) & inner
    cv.put(land, R["teal"][4]); cv.put(land & ((xx + yy) % 5 == 0), hexc("1c5c66"))
    lit = ell(28, 33, 11, 6) & land; cv.put(lit, R["green"][3]); cv.put(lit & ell(28, 32, 7, 3.6), R["green"][2]); cv.put(lit & ell(27, 31.5, 3.5, 2), R["green"][1])
    # luna creciente
    moon = ell(13, 14, 5.2, 5.2) & ~ell(15.6, 12.6, 4.6, 4.6); cv.piece(moon, R["cream"][1]); cv.put(moon & ((xx + yy) > 27), R["cream"][2])
    for (x, y) in [(22, 11), (36, 10), (9, 24), (19, 20), (38, 21)]: cv.px(x, y, R["ice"][1])
    for (x, y) in [(8, 21), (24, 17)]: cv.px(x, y, R["ice"][3])
    # el rayo
    b = poly([(33, 6), (24, 22), (30, 22), (22, 39), (37, 18), (31, 18), (36, 6)]); cv.piece(b, R["gold"][1]); cv.put(b & ((xx + yy) < 56), R["gold"][0]); cv.put(b & ((xx + yy) > 66), R["gold"][2])
    # lluvia
    for (x, y) in [(10, 24), (15, 28), (38, 14), (40, 24), (18, 17)]: cv.px(x, y, R["blue"][1]); cv.px(x - 1, y + 2, R["blue"][1]); cv.px(x - 1, y + 1, R["blue"][2])
    cv.save("ch_stormnight")

# ================================================================== Pregunta trampa
def trap():
    cv = Cv()
    card = rect(6, 5, 36, 41); cv.bevel(card, R["cream"])
    cv.put(rect(8, 7, 34, 39), R["cream"][1]); cv.put(rect(8, 7, 34, 7) | rect(8, 7, 8, 39), R["cream"][0]); cv.put(rect(8, 39, 34, 39) | rect(34, 7, 34, 39), R["cream"][2])
    q = thick([(14, 15), (14, 12), (18, 9), (24, 9), (28, 12), (28, 17), (21, 23), (21, 27)], 3); cv.put(q, R["purple"][2]); cv.put(edge(q, 0, -1) | edge(q, -1, 0), R["purple"][1]); cv.put(edge(q, 0, 1) | edge(q, 1, 0), R["purple"][3])
    dot = rect(19, 31, 22, 34); cv.put(dot, R["purple"][2]); cv.put(rect(19, 31, 22, 31) | rect(19, 31, 19, 34), R["purple"][1]); cv.put(rect(19, 34, 22, 34) | rect(22, 31, 22, 34), R["purple"][3])
    # esquina roja doblada
    cn = poly([(25, 5), (36, 5), (36, 16)]); cv.piece(cn, R["red"][2]); cv.put(cn & ((xx + yy) < 46), R["red"][1]); cv.put(edge(cn, 1, 1), R["red"][3])
    # sello rojo con admiracion
    s = ell(35, 34, 9.2, 9.2); cv.piece(s, R["red"][2]); cv.put(s & ((xx + yy) < 63), R["red"][1]); cv.put(s & ((xx + yy) > 74), R["red"][3])
    ri = s & ~ell(35, 34, 7.2, 7.2); cv.put(ri, R["red"][3]); cv.put(ri & ((xx + yy) < 66), R["red"][2])
    cv.put(rect(34, 28, 36, 35), R["cream"][0]); cv.put(rect(34, 38, 36, 40), R["cream"][0]); cv.put(rect(36, 28, 36, 35) | rect(36, 38, 36, 40), R["cream"][2])
    cv.save("ch_trap")

# ================================================================== Gigantes y enanos
def giants():
    cv = Cv()
    big = poly([(14, 8), (24, 6), (32, 7), (38, 10), (43, 12), (41, 18), (37, 24), (36, 31), (33, 39), (29, 44), (25, 42), (24, 34), (22, 27), (17, 25), (11, 22), (8, 16), (10, 11)]); cv.bevel(big, R["orange"])
    cv.put(big & ell(23, 14, 9, 6) & ((xx + yy) < 42), R["orange"][1]); cv.put(big & ell(31, 36, 4, 6) & ((xx + yy) > 68), R["orange"][3])
    # el tamano de verdad del enano, a puntos, y el enano dentro
    for k in range(20):
        t = 2 * math.pi * k / 20; cv.px(int(round(10.5 + 8.2 * math.cos(t))), int(round(37.5 + 8.2 * math.sin(t))), R["cream"][1] if k % 2 == 0 else R["cream"][3])
    sm = poly([(6, 36), (9, 34), (13, 34), (15, 36), (13, 39), (9, 40), (6, 39)]); cv.bevel(sm, R["green"])
    cv.put(sm & ell(10, 36, 2.5, 1.4) & ((xx + yy) < 46), R["green"][1])
    # flecha de crecer
    a1 = thick([(25, 22), (32, 15)], 2); cv.piece(a1, R["cream"][1]); cv.put(edge(a1, 0, -1) | edge(a1, -1, 0), R["cream"][0]); cv.put(edge(a1, 1, 0) | edge(a1, 0, 1), R["cream"][2])
    h1 = poly([(29, 10), (38, 10), (38, 19)]); cv.piece(h1, R["cream"][1]); cv.put(edge(h1, 0, -1), R["cream"][0]); cv.put(edge(h1, 1, 1), R["cream"][2])
    cv.save("ch_giants")

for f in (ctrlz, stormnight, trap, giants): f()
