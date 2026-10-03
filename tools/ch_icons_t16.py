"""Iconos de retos de la tanda 16 (La siesta del crupier, Salvapantallas, Pantallazo azul) (48 px nativos x8 = 384), dibujados a mano en codigo con el mismo libro de estilo que las fichas de logro:
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

# rampas propias (colores exactos de la chistera del crupier: boss_hat / dealer_neutral)
R["hat"] = ramp("704aa8", "4e2a85", "39137f", "230361", "0a0048")
R["hband"] = ramp("ff7068", "ff1c24", "cd0725", "8a0a22", "5e1238")
R["bsod"] = ramp("b4e0ff", "4aa6f4", "1478dc", "0c52aa", "082e6c")
R["green"] = ramp("d4ffb0", "7ee05a", "3fae3f", "23743a", "154a38")

def lbar(m, rp, lo=1):
    """realces de 1 px: luz arriba-izquierda, sombra abajo-derecha"""
    return m

def sparkle(cv, x, y, r, rp, ink=True):
    """estrellita de cuatro puntas con contorno (r = largo de la punta)"""
    m = rect(x - r, y, x + r, y) | rect(x, y - r, x, y + r) | rect(x - 1, y - 1, x + 1, y + 1)
    m &= ~(rect(x - r, y - r, x - 2, y - 2) | rect(x + 2, y + 2, x + r, y + r))
    cv.piece(m, rp[1], ink)
    cv.px(x, y, rp[0]); cv.px(x - 1, y, rp[0]); cv.px(x, y - 1, rp[0])
    cv.px(x + 1, y + 1, rp[2]) if r > 1 else None

def zed(cv, x, y, s, t):
    """una Z dorada de lado s y trazo t, con contorno propio"""
    m = rect(x, y, x + s, y + t - 1) | rect(x, y + s - t + 1, x + s, y + s)
    for i in range(s + 1):
        c = x + s - i
        m |= rect(max(x, c - 1), y + i, min(x + s, c + t - 1), y + i)
    cv.piece(m, R["gold"][2])
    cv.put(edge(m, 0, -1) | edge(m, -1, 0), R["gold"][1])
    cv.put(edge(m, 0, 1) | edge(m, 1, 0), R["gold"][3])
    cv.put(edge(m, 0, -1) & edge(m, -1, 0), R["gold"][0])

def tophat(cv, cx, cy, ang, cw, ch, bw, bh, bandh):
    """chistera del crupier girada ang grados (horario); origen = centro del ala"""
    a = math.radians(ang); ca, sa = math.cos(a), math.sin(a)
    dx, dy = xx + .5 - cx, yy + .5 - cy
    u = dx * ca + dy * sa; v = -dx * sa + dy * ca
    H, B = R["hat"], R["hband"]
    brim = (u / bw) ** 2 + (v / bh) ** 2 <= 1
    curve = bh * 0.78 * np.sqrt(np.clip(1 - (u / cw) ** 2, 0, 1))
    body = (np.abs(u) <= cw) & (v <= curve) & (v >= -ch)
    top = ((u / cw) ** 2 + ((v + ch) / (bh * 0.62)) ** 2 <= 1)
    crown = body | top
    # ala
    cv.piece(brim, H[3])
    cv.put(brim & (v < bh * 0.2), H[2])
    cv.put(brim & (v < -bh * 0.3) & (u < bw * 0.2), H[1])
    cv.put(brim & (v > bh * 0.62), H[4])
    cv.put(brim & (u < -bw + 3.2) & (v < bh * 0.1), H[1])
    cv.put(brim & (u > bw - 3) & (v > -bh * 0.3), H[4])
    # copa
    cv.piece(crown, H[2])
    cv.put(crown & (u > cw - 2.6), H[3]); cv.put(crown & (u > cw - 1.2), H[4])
    cv.put(crown & (u < -cw + 3), H[1]); cv.put(crown & (u < -cw + 1.4), H[0])
    tf = top & (v < -ch + bh * 0.15)
    cv.put(tf, H[1]); cv.put(tf & (v < -ch - bh * 0.25) & (u < cw * 0.3), H[0]); cv.put(top & ~body & (v < -ch + bh * 0.15) & (u < -cw * 0.5), H[0])
    # banda roja
    band = body & (v >= curve - bandh)
    cv.put(band, B[2]); cv.put(band & (v < curve - bandh + 1.3), B[1]); cv.put(band & (u < -cw + 2.4), B[1])
    cv.put(band & (u > cw - 2.2), B[3]); cv.put(band & (v < curve - bandh + 1.3) & (u < -cw + 4), B[0])
    return u, v

# ================================================================== La siesta del crupier
def siesta():
    cv = Cv()
    tophat(cv, 16, 33, 14, 7.8, 13.5, 15, 4.2, 4.4)
    zed(cv, 30, 27, 4, 2); zed(cv, 33, 16, 6, 2); zed(cv, 35, 3, 8, 3)
    moon = ell(8, 9, 5.6, 5.6) & ~ell(10.8, 7.2, 4.9, 4.9); cv.piece(moon, R["cream"][1]); cv.put(moon & ((xx + yy) > 16), R["cream"][2]); cv.put(moon & ((xx + yy) < 11), R["cream"][0])
    sparkle(cv, 17, 6, 2, R["gold"]); 
    for (x, y) in [(3, 20), (22, 11), (28, 8)]: cv.px(x, y, R["ice"][1])
    cv.save("ch_siesta")


def minihat(cv, x, y, dim=0):
    """mini chistera de 11x8 (sin contorno propio: vive sobre pantalla oscura). dim: 0 viva, 1 y 2 estela"""
    H, B = R["hat"], R["hband"]
    cols = [(hexc("a98ae6"), hexc("704aa8"), hexc("4e2a85"), hexc("39137f"), B[1], B[0], hexc("0a0048")),
            (hexc("8a68c8"), hexc("5a3a96"), hexc("3a1c78"), hexc("2a0f60"), hexc("c01228"), hexc("e0505a"), hexc("1a0850")),
            (hexc("5a3e96"), hexc("3a2478"), hexc("2a1664"), hexc("1e0e50"), hexc("7a1230"), hexc("a02a48"), hexc("140a3c"))][dim]
    l, m, d, dd, red, redl, ink = cols
    crown = rect(x + 2, y, x + 8, y + 5); brim = rect(x, y + 6, x + 10, y + 7)
    cv.put(outline(brim | crown), ink)
    cv.put(brim, d); cv.put(rect(x, y + 6, x + 10, y + 6), m); cv.put(rect(x, y + 7, x + 10, y + 7), dd)
    cv.put(rect(x, y + 6, x, y + 6), l)
    cv.put(crown, m); cv.put(rect(x + 2, y, x + 3, y + 5), l if dim == 0 else m); cv.put(rect(x + 2, y, x + 2, y + 5), l)
    cv.put(rect(x + 7, y, x + 8, y + 5), d); cv.put(rect(x + 8, y, x + 8, y + 5), dd)
    cv.put(rect(x + 3, y, x + 6, y), l)
    cv.put(rect(x + 2, y + 4, x + 8, y + 5), red); cv.put(rect(x + 2, y + 4, x + 8, y + 4), redl)
    cv.put(rect(x + 8, y + 4, x + 8, y + 5), B[3] if dim == 0 else dd)

# ================================================================== Salvapantallas
def screensaver():
    cv = Cv()
    hump = rect(8, 1, 39, 5); hump &= ~(rect(8, 1, 8, 1) | rect(39, 1, 39, 1)); cv.piece(hump, R["cream"][3]); cv.put(rect(9, 2, 38, 2), R["cream"][2]); cv.put(rect(9, 2, 9, 4), R["cream"][2]); cv.put(rect(9, 4, 38, 4) | rect(38, 2, 38, 4), R["cream"][4])
    body = rect(2, 4, 45, 36); cv.put(outline(body), INK)
    # cuerpo crema con bisel y bordes redondeados
    body &= ~(rect(2, 4, 2, 4) | rect(45, 4, 45, 4) | rect(2, 36, 2, 36) | rect(45, 36, 45, 36))
    cv.put(outline(body), INK); cv.put(body, R["cream"][2])
    cv.put(edge(body, 0, -1) | edge(body, -1, 0), R["cream"][0]); cv.put(rect(3, 5, 44, 5) | rect(3, 5, 3, 35), R["cream"][1])
    cv.put(edge(body, 0, 1) | edge(body, 1, 0), R["cream"][4]); cv.put(rect(4, 35, 44, 35) | rect(44, 5, 44, 35), R["cream"][3])
    # pantalla hundida
    scr = rect(6, 8, 41, 31) & ~(rect(6, 8, 6, 8) | rect(41, 8, 41, 8) | rect(6, 31, 6, 31) | rect(41, 31, 41, 31))
    cv.put(outline(scr), R["cream"][3]); cv.put(edge(outline(scr), 0, -1) | edge(outline(scr), -1, 0), R["cream"][4])
    cv.put(scr, hexc("0e0c26")); cv.put(rect(7, 9, 40, 9) | rect(7, 9, 7, 30), INK)
    # brillo de cristal en la esquina superior izquierda
    cv.put(scr & (xx + yy < 20) & (xx + yy > 17) & (yy > 9) & (xx > 7), R["dark"][4])
    # estela (tres pasos) y chistera rebotando hacia la esquina inferior derecha
    minihat(cv, 8, 10, 2); minihat(cv, 16, 14, 1); minihat(cv, 25, 19, 0)
    # estrellas de fondo y destello de la esquina
    for (x, y) in [(11, 26), (35, 12), (30, 11), (9, 18), (22, 28), (36, 20)]: cv.px(x, y, R["dark"][1])
    for (x, y) in [(22, 12), (35, 14)]: cv.px(x, y, R["ice"][2])
    for (x, y) in [(38, 28), (37, 28), (39, 28), (38, 27), (38, 29), (36, 28), (40, 28), (38, 26), (38, 30)]: cv.px(x, y, R["gold"][1])
    cv.px(38, 28, R["gold"][0]); cv.px(37, 28, R["gold"][0]); cv.px(38, 27, R["gold"][0])
    for (x, y) in [(40, 26), (36, 30)]: cv.px(x, y, R["gold"][2])
    # led y boton de la peana
    cv.put(rect(37, 33, 38, 33), R["green"][1]); cv.put(rect(40, 33, 41, 33), R["cream"][4])
    # cuello y pie
    neck = rect(18, 37, 29, 40); cv.piece(neck, R["grey"][2]); cv.put(rect(18, 37, 19, 40), R["grey"][1]); cv.put(rect(28, 37, 29, 40), R["grey"][3])
    base = rect(11, 41, 36, 44); cv.bevel(base, R["grey"]); cv.put(rect(12, 42, 35, 42), R["grey"][1])
    cv.save("ch_screensaver")

# ================================================================== Pantallazo azul
def bsod():
    cv = Cv()
    body = rect(2, 6, 41, 35); body &= ~(rect(2, 6, 2, 6) | rect(41, 6, 41, 6) | rect(2, 35, 2, 35) | rect(41, 35, 41, 35))
    cv.piece(body, R["grey"][2])
    cv.put(edge(body, 0, -1) | edge(body, -1, 0), R["grey"][1]); cv.put(edge(body, 0, 1) | edge(body, 1, 0), R["grey"][3])
    scr = rect(5, 9, 38, 31); B = R["bsod"]
    cv.put(outline(scr), R["grey"][4]); cv.put(scr, B[2])
    cv.put(rect(5, 9, 38, 9) | rect(5, 9, 5, 31), B[4]); cv.put(rect(6, 10, 37, 10) | rect(6, 10, 6, 30), B[3])
    cv.put(scr & (xx + yy < 20) & (xx > 6) & (yy > 10) & (xx + yy > 17), B[1])
    W = R["cream"][0]
    def wp(m): cv.put(m << 0 & blank() if False else sh(m, 1, 1) & ~m, B[3]); cv.put(m, W)
    # carita triste :(
    wp(rect(9, 12, 11, 14)); wp(rect(9, 19, 11, 21))
    arc = thick(arc_pts(23, 17, 5.4, 7.2, 125, 235, 14), 2)
    wp(arc)
    # lineas de texto y codigo qr
    cv.put(rect(9, 25, 28, 25), B[0]); cv.put(rect(9, 27, 22, 27), B[0]); cv.put(rect(9, 29, 25, 29), B[1])
    qr = rect(31, 23, 36, 28); cv.put(qr, W); cv.put(rect(32, 24, 32, 24) | rect(35, 24, 35, 24) | rect(32, 27, 32, 27) | rect(34, 26, 35, 26) | rect(33, 25, 33, 25), B[3])
    # grieta que sale de la esquina y chispa dorada
    crack = [(38, 10), (37, 11), (37, 12), (36, 13), (35, 14), (35, 15), (34, 16), (34, 17), (37, 14), (37, 15)]
    for (x, y) in crack: cv.px(x + 1, y + 1, B[4])
    for (x, y) in crack: cv.px(x, y, R["ice"][0])
    sparkle(cv, 41, 7, 3, R["gold"])
    cv.save("ch_bsod")

for f in (siesta, screensaver, bsod): f()
