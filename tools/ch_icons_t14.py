"""Iconos de retos de la tanda 14 (48 px nativos x8 = 384), dibujados a mano en codigo con el mismo libro de estilo que las fichas de logro:
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

def pole(cv, x, y0, y1, ball=True):
    m = rect(x - 1, y0, x + 1, y1)
    cv.piece(m, R["gold"][2]); cv.put(rect(x - 1, y0, x - 1, y1), R["gold"][1]); cv.put(rect(x + 1, y0, x + 1, y1), R["gold"][3])
    if ball:
        b = ell(x + .5, y0 - 1, 2.6, 2.6); cv.piece(b, R["gold"][1]); cv.put(b & (xx >= x + 1) & (yy >= y0 - 1), R["gold"][2]); cv.px(x - 1, y0 - 2, R["gold"][0])

def wave_flag(cv, x0, x1, ytop, h, bands, amp0, amp1, period, phase=0.0):
    """bandera ondeando: columnas desplazadas por una onda que crece hacia el borde libre; la inclinacion de cada columna da el tono (luz arriba-izquierda)"""
    off = {}
    for x in range(x0, x1 + 1):
        t = (x - x0) / max(1, x1 - x0); off[x] = round((amp0 + (amp1 - amp0) * t) * math.sin(2 * math.pi * (x - x0) / period + phase))
    m = blank();
    for x in range(x0, x1 + 1): m[ytop + off[x]: ytop + off[x] + h, x] = True
    cv.put(outline(m), INK)
    tot = sum(b[1] for b in bands)
    for x in range(x0, x1 + 1):
        d = off.get(x + 1, off[x]) - off.get(x - 1, off[x])
        ti = 1 if d <= -1 else 2 if d == 0 else 3 if d == 1 else 4
        y = ytop + off[x]
        for rp, rows in bands:
            n = max(1, round(rows * h / tot))
            for k in range(n):
                if y + k < N: cv.px(x, y + k, R[rp][ti] if not (ti == 4 and rp == "cream") else R[rp][3])
            y += n
        # el ultimo trozo hasta h
    return m, off

# ================================================================== Bandera al viento
def flagwind():
    cv = Cv()
    pole(cv, 8, 8, 43)
    base = rect(4, 41, 13, 44); cv.bevel(base, R["brown"])
    m, off = wave_flag(cv, 11, 43, 8, 18, [("blue", 6), ("cream", 6), ("red", 6)], 0.9, 3.6, 21, 0.4)
    # rayas de viento: dos trazos crema con rizo
    for pts in (([14, 34], [30, 34], [35, 33], [37, 30], [34, 29]), ([20, 40], [38, 40], [42, 39], [43, 36], [40, 35])):
        s = thick([tuple(p) for p in pts], 2); cv.piece(s, R["ice"][1]); cv.put(edge(s, 0, 1) | edge(s, 1, 0), R["ice"][2])
    cv.save("ch_flagwind")

# ================================================================== Bandera de espaldas
FBM = ["...#.....#...", "..##.....##..", ".###.....###.", "#############", ".###.....###.", "..##.....##..", "...#.....#..."]
def flagback():
    cv = Cv()
    pole(cv, 39, 7, 43)
    base = rect(34, 41, 44, 44); cv.bevel(base, R["brown"])
    # la bandera sale hacia la izquierda: vista por detras, con su dibujo al reves (franjas teal | crema | coral y estrella invertida)
    m, off = wave_flag(cv, 5, 38, 8, 22, [("teal", 7), ("cream", 8), ("red", 7)], 0.5, 1.6, 26, 3.14)
    # las franjas son horizontales en wave_flag; aqui se quiere tricolor vertical: se repinta por columnas
    for x in range(5, 39):
        d = off.get(x + 1, off[x]) - off.get(x - 1, off[x]); ti = 1 if d <= -1 else 2 if d == 0 else 3 if d == 1 else 4
        rp = "teal" if x < 16 else "cream" if x < 28 else "red"
        for y in range(8 + off[x], 8 + off[x] + 22): cv.px(x, y, R[rp][ti] if not (ti == 4 and rp == "cream") else R[rp][3])
    # estrella dorada (el emblema, al reves)
    sx, sy = 22, 18 + off[22]
    star = [(0, -4), (1, -1), (4, -1), (2, 1), (3, 4), (0, 2), (-3, 4), (-2, 1), (-4, -1), (-1, -1)]
    st = poly([(sx + a, sy + b) for a, b in star]); cv.put(outline(st) & m, R["gold"][4]); cv.put(st, R["gold"][1]); cv.put(st & (yy > sy), R["gold"][2])
    # sello del giro: disco crema con la flecha doble
    d = ell(13.5, 38.5, 8.6, 8.6); cv.piece(d, R["cream"][1]); cv.put(d & ((xx + yy) > 50), R["cream"][2])
    ring = d & ~ell(13.5, 38.5, 6.4, 6.4); cv.put(ring, R["purple"][2]); cv.put(ring & ((xx + yy) < 46), R["purple"][1]); cv.put(ring & ((xx + yy) > 54), R["purple"][3])
    for r, row in enumerate(FBM):
        for c, ch in enumerate(row):
            if ch == "#": cv.px(7 + c, 35 + r, R["purple"][4])
    cv.save("ch_flagback")

# ================================================================== Bandera a trozos
def flagpuzzle():
    cv = Cv()
    FX0, FY0 = 4, 8
    def col(x, y):                       # la bandera entera: tres franjas y un disco dorado en el centro
        d2 = (x - 24) ** 2 + (y - 23) ** 2
        if d2 <= 42: return R["gold"][1] if (x + y) < 46 else R["gold"][2]
        if y < FY0 + 10: return R["red"][2]
        if y < FY0 + 20: return R["cream"][1]
        return R["teal"][2]
    # cuatro trozos con sus pestanas de rompecabezas; dos se han salido de su sitio
    pieces = [  # (rect, (dx,dy), pestanas fuera, huecos dentro)
        ((FX0, FY0, 23, 22), (0, 0), [(24.0, 12.0), (12.0, 23.0)], []),
        ((24, FY0, 43, 22), (0, -3), [], [(24.0, 12.0)]),
        ((FX0, 23, 23, 37), (-2, 1), [], [(12.0, 23.0), (24.0, 31.0)]),
        ((24, 23, 43, 37), (0, 0), [(24.0, 31.0)], []),
    ]
    for (x0, y0, x1, y1), (dx, dy), knobs, dents in [pieces[0], pieces[2], pieces[3], pieces[1]]:
        m = rect(x0, y0, x1, y1)
        for kx, ky in knobs: m |= ell(kx, ky, 2.6, 2.6)
        for kx, ky in dents: m &= ~ell(kx, ky, 2.6, 2.6)
        mm = sh(m, dx, dy) if (dx or dy) else m
        if dx or dy:
            mm = blank()
            ys, xs = np.nonzero(m)
            for y, x in zip(ys, xs):
                if 0 <= x + dx < N and 0 <= y + dy < N: mm[y + dy, x + dx] = True
        cv.put(outline(mm), INK)
        ys, xs = np.nonzero(m)
        for y, x in zip(ys, xs): cv.px(x + dx, y + dy, col(x, y))
        top = edge(mm, 0, -1); left = edge(mm, -1, 0); bot = edge(mm, 0, 1); rig = edge(mm, 1, 0)
        for msk in (top, left):
            for y, x in zip(*np.nonzero(msk)):
                c = tuple(int(v) for v in cv.c[y, x, :3]); cv.c[y, x, :3] = tuple(min(255, int(v + (255 - v) * .32)) for v in c)
        for msk in (bot, rig):
            for y, x in zip(*np.nonzero(msk)):
                c = tuple(int(v) for v in cv.c[y, x, :3]); cv.c[y, x, :3] = tuple(int(v * .72) for v in c)
    cv.save("ch_flagpuzzle")

# ================================================================== Pasaporte falso
def fakepass():
    cv = Cv()
    cover = rect(9, 4, 33, 41)
    cv.put(outline(cover), INK)
    cv.put(cover, R["blue"][2]); cv.put(rect(9, 4, 33, 4) | rect(9, 4, 9, 41), R["blue"][1]); cv.put(rect(9, 41, 33, 41) | rect(33, 4, 33, 41), R["blue"][3])
    cv.put(rect(9, 4, 12, 41), R["blue"][3]); cv.put(rect(9, 4, 9, 41), R["blue"][2]); cv.put(rect(12, 4, 12, 41), R["blue"][4])         # el lomo
    # paginas asomando por la derecha
    pg = rect(34, 6, 36, 39); cv.put(outline(pg), INK); cv.put(pg, R["cream"][1]); cv.put(rect(36, 6, 36, 39), R["cream"][3]); cv.put(rect(34, 12, 36, 12) | rect(34, 20, 36, 20) | rect(34, 28, 36, 28) | rect(34, 36, 36, 36), R["cream"][3])
    # escudo dorado: globo con meridianos
    g = ell(22, 17, 7.6, 7.6); cv.put(outline(g) & cover, R["gold"][4]); cv.put(g, R["gold"][2]); cv.put(g & ((xx + yy) < 36), R["gold"][1]); cv.put(g & ((xx + yy) > 43), R["gold"][3])
    gl = ell(22, 17, 5.2, 5.2) & ~ell(22, 17, 3.6, 3.6); cv.put(rect(21, 10, 22, 24) & g, R["gold"][4]); cv.put(rect(15, 16, 29, 17) & g, R["gold"][4])
    cv.put(g & ~ell(22, 17, 6.6, 6.6), R["gold"][3]);
    # titulo: dos rayas doradas
    cv.put(rect(16, 29, 28, 30), R["gold"][2]); cv.put(rect(16, 29, 28, 29), R["gold"][1]); cv.put(rect(18, 34, 26, 35), R["gold"][3])
    # sello rojo de FALSO: disco con X
    s = ell(33.5, 33.5, 9.6, 9.6); cv.piece(s, R["red"][2]); cv.put(s & ((xx + yy) < 62), R["red"][1]); cv.put(s & ((xx + yy) > 72), R["red"][3])
    ri = ell(33.5, 33.5, 9.6, 9.6) & ~ell(33.5, 33.5, 7.6, 7.6); cv.put(ri, R["red"][3]); cv.put(ri & ((xx + yy) < 64), R["red"][2])
    for k in range(-4, 5):
        for t in (0, 1):
            cv.px(33 + k, 33 + k + t, R["cream"][0]); cv.px(33 + k, 34 - k + t, R["cream"][0])
    cv.save("ch_fakepass")

# ================================================================== Panel de salidas
G5 = {
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
}
PLANE = [".......##.....", ".......###....", ".......####...", "..##...#####..", ".#########.##.", "##############", ".#########.##.", "..##...#####..", ".......####...", ".......###....", ".......##....."]
def ticker():
    cv = Cv()
    plate = rect(2, 15, 45, 36); cv.put(outline(plate), INK); cv.put(plate, R["dark"][2]); cv.put(edge(plate, 0, -1) | edge(plate, -1, 0), R["dark"][1]); cv.put(edge(plate, 0, 1) | edge(plate, 1, 0), R["dark"][3])
    cv.put(rect(3, 16, 44, 35) & ~rect(5, 18, 42, 33), R["dark"][2])
    inner = rect(5, 18, 42, 33); cv.put(inner, R["dark"][4])
    TOP, BOT, HI = hexc("3b2d68"), hexc("2a1f4e"), hexc("fff1c2")
    for i, ch in enumerate(["M", "A", "D", "R"]):
        x0 = 6 + i * 9; y0 = 19
        cv.put(rect(x0, y0, x0 + 7, y0 + 6), TOP); cv.put(rect(x0, y0 + 7, x0 + 7, y0 + 13), BOT)
        cv.put(rect(x0, y0 + 6, x0 + 7, y0 + 6), INK)               # la bisagra (las letras van por encima)
        flip = (i == 3)
        for r, row in enumerate(G5[ch]):
            for c, p in enumerate(row):
                if p == "#":
                    if flip and r < 4: continue                      # la ultima ficha esta girando: solo se ve la mitad de abajo de la letra de antes
                    cv.px(x0 + 1 + c, y0 + 3 + r, HI)
        if flip:
            fl = poly([(x0 + 1, y0 + 6), (x0 + 6, y0 + 6), (x0 + 5, y0 + 3), (x0 + 2, y0 + 3)]); cv.put(fl, hexc("54418f")); cv.put(rect(x0 + 2, y0 + 3, x0 + 5, y0 + 3), hexc("7a66c4")); cv.put(rect(x0 + 1, y0 + 6, x0 + 6, y0 + 6), INK)
        cv.px(x0, y0, hexc("54418f")); cv.px(x0 + 7, y0, hexc("54418f")); cv.px(x0, y0 + 13, INK); cv.px(x0 + 7, y0 + 13, INK)
    # tres pilotos encima del panel: ambar (girando), ambar y verde (fijas)
    for cx, rp in ((9.5, "gold"), (16.5, "gold"), (23.5, "green")):
        if rp == "green": rp = "teal"
        l = ell(cx, 9.5, 2.5, 2.5); cv.piece(l, R[rp][1]); cv.put(l & (xx + yy >= 28), R[rp][2]); cv.px(int(cx - 1), 8, R[rp][0])
    cv.save("ch_ticker")

for f in (flagwind, flagback, flagpuzzle, fakepass, ticker): f()
