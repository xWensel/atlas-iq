"""Icono de las notas del parche (portada, esquina inferior izquierda): un boletin morado con el parche de fieltro cosido y la flecha dorada (48 px nativos x8 = 384), dibujado a mano en codigo con el mismo libro de estilo que las fichas de logro:
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

def arc_pts(cx, cy, rx, ry, a0, a1, n=24):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

R["green"] = ramp("d4ffb0", "7ee05a", "3fae3f", "23743a", "154a38")

def cut(m, x0, y0, x1, y1, c=1):
    """quita c pixeles en cada esquina de un rectangulo (esquinas redondeadas de pixel art)"""
    for i in range(c):
        for j in range(c - i):
            for (x, y) in ((x0 + i, y0 + j), (x1 - i, y0 + j), (x0 + i, y1 - j), (x1 - i, y1 - j)): m[y, x] = False
    return m

def boletin():
    cv = Cv(); P, G, C, Rd, Gr = R["purple"], R["gold"], R["cream"], R["red"], R["green"]
    # bloque de paginas (asoma a la derecha y por abajo del lomo)
    pages = cut(rect(11, 7, 40, 44), 11, 7, 40, 44, 1)
    cv.piece(pages, C[1])
    cv.put(rect(37, 8, 39, 43), C[2]); cv.put(rect(40, 8, 40, 43), C[3]); cv.put(rect(12, 43, 39, 43), C[2]); cv.put(rect(12, 44, 39, 44), C[3])
    for y in range(10, 43, 3): cv.put(rect(37, y, 39, y), C[3])      # canto de hojas
    # cinta marcapaginas roja que sale por debajo
    rib = rect(28, 40, 32, 47); rib &= ~(rect(30, 46, 30, 47) | rect(29, 47, 31, 47) & blank())
    rib[47, 30] = False; rib[46, 30] = False
    cv.piece(rib, Rd[2]); cv.put(rect(28, 40, 28, 45), Rd[1]); cv.put(rect(32, 40, 32, 45), Rd[3]); cv.put(rect(31, 46, 31, 47), Rd[3]); cv.put(rect(29, 46, 29, 47), Rd[1])
    # tapa morada con bisel
    cover = cut(rect(8, 4, 36, 41), 8, 4, 36, 41, 1)
    cv.bevel(cover, P)
    cv.put(rect(9, 5, 35, 5), P[1]); cv.put(rect(9, 5, 9, 40), P[1])
    # lomo mas oscuro con tres puntadas doradas
    spine = rect(9, 5, 12, 40)
    cv.put(spine, P[3]); cv.put(rect(9, 5, 9, 40), P[2]); cv.put(rect(13, 5, 13, 40), P[4])
    for y0 in (9, 20, 31):
        cv.put(rect(10, y0, 12, y0 + 2), G[1]); cv.put(rect(10, y0, 12, y0), G[0]); cv.put(rect(10, y0 + 2, 12, y0 + 2), G[3])
    # marco dorado fino
    fr = rect(15, 7, 33, 38); fr &= ~rect(16, 8, 32, 37)
    cv.put(fr, G[2]); cv.put(rect(15, 7, 33, 7) | rect(15, 7, 15, 38), G[1]); cv.put(rect(15, 38, 33, 38) | rect(33, 7, 33, 38), G[3])
    for (x, y) in ((15, 7), (33, 7), (15, 38), (33, 38)): cv.px(x, y, G[0])
    # parche de fieltro verde cosido
    pm = cut(rect(17, 11, 31, 27), 17, 11, 31, 27, 2)
    cv.piece(pm, Gr[2])
    cv.put(edge(pm, 0, -1) | edge(pm, -1, 0), Gr[1]); cv.put(edge(pm, 0, 1) | edge(pm, 1, 0), Gr[3])
    st = np.zeros((N, N), bool)
    for x in range(20, 29, 2): st[12, x] = True; st[26, x] = True
    for y in range(14, 25, 2): st[y, 18] = True; st[y, 30] = True
    cv.put(st, C[1])
    # flecha dorada de "actualizado" (pixel a pixel: un escalon por fila) con contorno verde oscuro
    ar = blank()
    for i, y in enumerate(range(14, 19)): ar[y, 24 - i:24 + i + 1] = True
    ar |= rect(23, 19, 25, 24)
    cv.put(outline(ar), Gr[4]); cv.put(ar, G[1])
    cv.put(edge(ar, 1, 0) | edge(ar, 0, 1), G[2]); cv.put(edge(ar, 0, 1) & (yy >= 24), G[3]); cv.put(rect(25, 19, 25, 24), G[2])
    cv.put(rect(24, 14, 24, 15), G[0]); cv.put(rect(23, 16, 23, 16) | rect(22, 17, 22, 17) | rect(21, 18, 21, 18) | rect(20, 18, 20, 18), G[0]); cv.put(rect(23, 19, 23, 21), G[0])
    # titulo: dos lineas de texto bajo el parche
    cv.put(rect(18, 31, 30, 31), G[1]); cv.put(rect(18, 32, 30, 32), G[3]); cv.put(rect(18, 35, 25, 35), G[2]); cv.put(rect(18, 36, 25, 36), G[4])
    cv.save("m_patch")

boletin()
