"""Iconos de la Barra, pixel art de 64x64 logicos (x6 = 384, como los de los logros):
 - bet_red     : Rojo o negro = ruleta roja y negra con el globo de Geolite en el cubo
 - pz_*        : las casillas de la Ruleta de premios (monedas, premio gordo, reto extra, atraco, reloj corto, nada)
Uso: python tools/barra_prizes.py <raiz del repo> [hoja.png]"""
import math, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = sys.argv[1]
ICONS = ROOT + "/assets/icons/"
INK = (29, 10, 61, 255)
GOLD = [(255, 236, 140, 255), (255, 217, 90, 255), (245, 166, 35, 255), (196, 106, 27, 255), (127, 58, 26, 255)]
RED = [(255, 138, 112, 255), (226, 72, 58, 255), (180, 40, 40, 255), (120, 24, 36, 255)]
BLK = [(104, 108, 132, 255), (58, 60, 78, 255), (34, 34, 48, 255), (20, 18, 32, 255)]
GRN = [(120, 232, 150, 255), (44, 168, 96, 255), (22, 110, 62, 255)]
CREAM = (255, 246, 200, 255); WHITE = (255, 252, 240, 255)
PARCH = [(250, 236, 196, 255), (232, 205, 150, 255), (200, 160, 105, 255), (150, 110, 72, 255)]
BLUE = [(120, 190, 255, 255), (52, 120, 220, 255), (28, 70, 150, 255), (18, 40, 100, 255)]
L = 64


def canvas():
    return Image.new("RGBA", (L, L), (0, 0, 0, 0))


def outline(im, col=INK):
    a = np.array(im)
    alpha = a[:, :, 3] > 0
    ink = np.zeros_like(alpha)
    ink[1:, :] |= alpha[:-1, :]; ink[:-1, :] |= alpha[1:, :]; ink[:, 1:] |= alpha[:, :-1]; ink[:, :-1] |= alpha[:, 1:]
    a[ink & ~alpha] = col
    return Image.fromarray(a)


def up(im):
    return im.resize((384, 384), Image.NEAREST)


def logical(name):
    """abre un icono del juego y lo baja a su rejilla logica (pixeles de n x n iguales)"""
    im = Image.open(ICONS + name + ".webp").convert("RGBA")
    w = im.size[0]
    for n in (8, 6, 4, 3, 2):
        if w % n == 0:
            # comprueba que de verdad es una rejilla de n
            sm = im.resize((w // n, w // n), Image.NEAREST)
            if sm.resize((w, w), Image.NEAREST).tobytes() == im.tobytes():
                return sm
    return im


# ---------- fuente 3x5 para los rotulos (+1, -3, 0...) ----------
FONT = {"0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001", "5": "111100111001111",
        "6": "111100111101111", "7": "111001001001001", "8": "111101111101111", "9": "111101111001111", "+": "000010111010000", "-": "000000111000000", "x": "000101010101000"}


def text(img, s, x, y, col, shadow=None):
    d = ImageDraw.Draw(img)
    cx = x
    for ch in s:
        g = FONT[ch]
        for i, b in enumerate(g):
            if b == "1":
                px, py = cx + i % 3, y + i // 3
                if shadow:
                    d.point((px, py + 1), fill=shadow)
                d.point((px, py), fill=col)
        cx += 4
    return cx - x


def shade(px, base, light, dark, lx, ly, x, y, cx, cy, r):
    """sombreado simple: mas luz hacia (lx, ly)"""
    dx, dy = x - cx, y - cy
    t = (dx * lx + dy * ly) / max(r, 1)
    return light if t < -0.45 else dark if t > 0.5 else base


# ---------- bet_red: ruleta roja y negra con el globo de Geolite ----------
def roulette():
    im = canvas(); px = im.load()
    cx, cy = 32.0, 33.0
    # perspectiva suave (3/4): elipse mas baja que ancha, con el borde de la mesa abajo
    RXo, RYo = 29.0, 25.0
    depth = 5
    WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
    REDN = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}
    # canto (la pared de la rueda) bajo la elipse
    for t in range(depth, -1, -1):
        for y in range(L):
            for x in range(L):
                e = ((x + .5 - cx) / RXo) ** 2 + ((y + .5 - (cy + t)) / RYo) ** 2
                if e <= 1:
                    px[x, y] = GOLD[3] if t > 2 else GOLD[4]
    for y in range(L):
        for x in range(L):
            dx, dy = (x + .5 - cx), (y + .5 - cy)
            e = math.hypot(dx / RXo, dy / RYo)
            if e > 1:
                continue
            ang = (math.degrees(math.atan2(dx / RXo, -dy / RYo)) + 360) % 360
            if e > .90:                                        # aro de oro
                px[x, y] = GOLD[0] if (dx < 0 and dy < 0) else GOLD[2]
                if e > .96:
                    px[x, y] = GOLD[3]
            elif e > .58:                                      # anillo de casillas
                k = int(ang // (360 / 37)); n = WHEEL[k % 37]
                if n == 0:
                    c = GRN
                elif n in REDN:
                    c = RED
                else:
                    c = BLK
                col = c[1]
                if e > .87 or e < .61:
                    col = c[2]
                elif dx < 0 and dy < 0 and e < .80:
                    col = c[0] if c is not BLK else c[1]
                px[x, y] = col
                # separadores finos de oro entre casillas
                frac = (ang % (360 / 37)) / (360 / 37)
                if frac < .09 or frac > .95:
                    px[x, y] = GOLD[2]
            elif e > .5:                                       # pista interior
                px[x, y] = (62, 34, 24, 255) if (dx + dy) % 3 else (84, 48, 30, 255)
            else:                                              # cono central
                px[x, y] = (110, 62, 38, 255) if dx < 0 and dy < 0 else (84, 46, 30, 255)
    # la Tierra de Geolite en el cubo (recortada de la ruleta de marca)
    src = logical("roulette"); R = 15; RS = 12
    m = Image.new("L", (64, 64), 0); ImageDraw.Draw(m).ellipse([32 - R, 32 - R, 32 + R, 32 + R], fill=255)
    earth = src.copy(); earth.putalpha(Image.composite(src.split()[3], Image.new("L", (64, 64), 0), m))
    earth = earth.crop((32 - R, 32 - R, 32 + R, 32 + R)).resize((RS * 2, RS * 2), Image.NEAREST)
    # anillo dorado alrededor del cubo
    dd = ImageDraw.Draw(im)
    dd.ellipse([cx - RS - 2, cy - 3 - RS - 2, cx + RS + 2, cy - 3 + RS + 2], fill=GOLD[3]); dd.ellipse([cx - RS - 1, cy - 3 - RS - 2, cx + RS + 1, cy - 3 + RS + 1], fill=GOLD[1])
    im.alpha_composite(earth, (int(cx - RS), int(cy - 3 - RS)))
    d = ImageDraw.Draw(im)
    # bola blanca en una casilla, con su brillo
    d.ellipse([46, 21, 50, 25], fill=WHITE); d.point((47, 22), fill=(255, 255, 255, 255)); d.point((49, 25), fill=(190, 190, 200, 255))
    return outline(im)


# ---------- pz_monedas: pila de tres monedas (la moneda de los logros) ----------
def coins_stack():
    sp = Image.open(ICONS + "coin_spin.webp").convert("RGBA")
    f = sp.crop((0, 0, 64, 64))                      # reposo, cara
    # la moneda ocupa y 4..~58; la apilo con 7 px de canto entre ellas
    im = canvas()
    f2 = f.resize((44, 44), Image.NEAREST)
    # tres monedas: la de abajo, la del medio y la de arriba (cada una algo mas arriba)
    for i, (ox, oy) in enumerate(((10, 18), (10, 11), (10, 4))):
        im.alpha_composite(f2, (ox, oy))
    # destellos
    d = ImageDraw.Draw(im)
    for (x, y) in ((8, 8), (8, 6), (8, 10), (6, 8), (10, 8)):
        d.point((x, y), fill=CREAM)
    return im


# ---------- pz_gordo: lingotes de oro ----------
def ingots():
    im = canvas(); d = ImageDraw.Draw(im)

    def bar(x, y, w=26, h=13):
        d.polygon([(x, y + h), (x + w, y + h), (x + w - 5, y), (x + 5, y)], fill=GOLD[2])                       # frente (trapecio)
        d.polygon([(x + 5, y), (x + w - 5, y), (x + w - 8, y + 4), (x + 8, y + 4)], fill=GOLD[0])               # cara de arriba
        d.polygon([(x, y + h), (x + 3, y + h - 3), (x + w - 3, y + h - 3), (x + w, y + h)], fill=GOLD[3])       # sombra de abajo
        d.line([(x + 4, y + 6), (x + 3, y + h - 5)], fill=GOLD[1])                                              # brillo del lateral
        d.point((x + 9, y + 1), fill=WHITE); d.point((x + 10, y + 1), fill=WHITE)

    bar(4, 41); bar(32, 41)
    bar(18, 28)
    bar(18, 15, w=26, h=13)
    for (x, y) in ((52, 14), (52, 11), (52, 17), (49, 14), (55, 14)):
        d.point((x, y), fill=WHITE)
    for (x, y) in ((9, 26), (9, 24), (9, 28), (7, 26), (11, 26)):
        d.point((x, y), fill=CREAM)
    d.point((58, 36), fill=GOLD[1]); d.point((4, 36), fill=GOLD[1]); d.point((46, 8), fill=GOLD[1])
    return outline(im)


# ---------- pz_reto: pergamino con sello de lacre y +1 ----------
def challenge():
    im = canvas(); d = ImageDraw.Draw(im)
    # pagina
    d.polygon([(12, 8), (46, 8), (46, 52), (12, 52)], fill=PARCH[0])
    d.polygon([(12, 8), (46, 8), (46, 12), (12, 12)], fill=PARCH[1])
    d.line([(12, 52), (46, 52)], fill=PARCH[2]); d.line([(46, 8), (46, 52)], fill=PARCH[2])
    # rizo del pergamino arriba y abajo
    d.ellipse([9, 5, 49, 13], fill=PARCH[1]); d.ellipse([11, 6, 47, 10], fill=PARCH[0])
    d.ellipse([9, 47, 49, 55], fill=PARCH[1]); d.ellipse([11, 49, 47, 53], fill=PARCH[2])
    # lineas de texto
    for y in (16, 20, 24):
        d.line([(17, y), (41, y)], fill=PARCH[3])
    d.line([(17, 28), (33, 28)], fill=PARCH[3])
    # sello de lacre rojo
    d.ellipse([22, 33, 40, 49], fill=RED[2]); d.ellipse([22, 33, 39, 47], fill=RED[1])
    d.ellipse([25, 36, 36, 45], outline=RED[2]); d.point((27, 37), fill=RED[0]); d.point((28, 37), fill=RED[0])
    d.rectangle([30, 38, 31, 41], fill=WHITE); d.rectangle([30, 43, 31, 44], fill=WHITE)    # "!"
    # cinta del sello
    d.polygon([(26, 48), (30, 48), (28, 58), (24, 56)], fill=RED[2]); d.polygon([(33, 48), (37, 48), (39, 56), (35, 58)], fill=RED[1])
    # etiqueta +1 arriba a la derecha
    d.rounded_rectangle([40, 4, 60, 18], radius=3, fill=RED[1]); d.rounded_rectangle([40, 4, 60, 8], radius=3, fill=RED[0])
    d.rectangle([41, 9, 59, 17], fill=RED[1])
    text(im, "+1", 44, 9, WHITE, shadow=RED[3])
    return outline(im)


# ---------- pz_atraco: antifaz de bandido ----------
def heist():
    im = canvas(); d = ImageDraw.Draw(im)
    # el botin primero (la bolsa roja con estrella del juego), asomando por debajo
    purse = logical("purse").resize((34, 34), Image.NEAREST)
    im.alpha_composite(purse, (26, 28))
    # antifaz de ladron
    mask = [(2, 14), (12, 8), (26, 12), (32, 16), (38, 12), (52, 8), (62, 14), (60, 28), (50, 33), (40, 28), (32, 25), (24, 28), (14, 33), (4, 28)]
    d.polygon(mask, fill=BLK[2])
    d.polygon([(2, 14), (12, 8), (26, 12), (32, 16), (27, 18), (14, 14), (4, 19)], fill=BLK[1])
    d.line([(6, 14), (12, 10)], fill=BLK[0]); d.line([(13, 10), (25, 13)], fill=BLK[0]); d.line([(38, 13), (51, 10)], fill=BLK[0])
    for ex in (16, 48):
        d.ellipse([ex - 7, 15, ex + 7, 26], fill=WHITE)
        d.ellipse([ex - 7, 15, ex + 7, 19], fill=CREAM)
        pxx = ex + (2 if ex < 32 else -2)
        d.rectangle([pxx - 2, 17, pxx + 2, 25], fill=BLK[3]); d.point((pxx - 1, 18), fill=WHITE)
    d.line([(8, 12), (22, 15)], fill=BLK[3]); d.line([(56, 12), (42, 15)], fill=BLK[3])
    # cintas a los lados
    d.polygon([(2, 14), (0, 12), (0, 24), (4, 28)], fill=RED[2]); d.polygon([(62, 14), (64, 12), (64, 24), (60, 28)], fill=RED[1])
    # monedas que se escapan
    for (x, y) in ((12, 46), (6, 54)):
        d.ellipse([x - 4, y - 3, x + 4, y + 4], fill=GOLD[3]); d.ellipse([x - 4, y - 4, x + 4, y + 3], fill=GOLD[2]); d.ellipse([x - 2, y - 2, x + 2, y + 1], fill=GOLD[1]); d.point((x - 2, y - 2), fill=WHITE)
    return outline(im)


# ---------- pz_reloj: cronometro con la cuenta casi agotada y -3 ----------
def clock():
    im = canvas(); d = ImageDraw.Draw(im)
    cx, cy, r = 30, 35, 22
    # boton y corona
    d.rectangle([27, 6, 33, 10], fill=GOLD[3]); d.rectangle([24, 4, 36, 7], fill=GOLD[2]); d.rectangle([24, 4, 36, 5], fill=GOLD[0])
    d.rectangle([29, 10, 31, 13], fill=GOLD[4])
    d.polygon([(46, 14), (52, 10), (54, 14), (49, 18)], fill=GOLD[3])
    d.ellipse([cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2], fill=GOLD[3])
    d.ellipse([cx - r - 2, cy - r - 3, cx + r + 2, cy + r + 1], fill=GOLD[2])
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
    d.pieslice([cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3], 262, 315, fill=RED[1])    # el trozo que queda, en rojo
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=PARCH[2])
    for k in range(12):
        a = math.radians(k * 30)
        x0, y0 = cx + math.sin(a) * (r - 3), cy - math.cos(a) * (r - 3)
        x1, y1 = cx + math.sin(a) * (r - 5.5), cy - math.cos(a) * (r - 5.5)
        d.line([(x0, y0), (x1, y1)], fill=BLK[2])
    # manecilla casi al final
    a = math.radians(314)
    d.line([(cx, cy), (cx + math.sin(a) * (r - 7), cy - math.cos(a) * (r - 7))], fill=RED[2], width=2)
    d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=BLK[2])
    # grieta
    for pts in (((cx + 7, cy - r + 3), (cx + 4, cy - 8), (cx + 8, cy - 3)), ((cx + 4, cy - 8), (cx - 2, cy - 10))):
        d.line(pts, fill=BLK[1])
    # etiqueta -3
    d.rounded_rectangle([38, 40, 62, 58], radius=3, fill=RED[2]); d.rounded_rectangle([38, 40, 62, 46], radius=3, fill=RED[1])
    d.rectangle([39, 46, 61, 57], fill=RED[2])
    text(im, "-3", 44, 46, WHITE, shadow=RED[3])
    return outline(im)


# ---------- pz_nada: bolsa vacia, vuelta del reves, con telarana ----------
def empty():
    im = canvas(); d = ImageDraw.Draw(im)
    LEA = [(196, 134, 84, 255), (160, 102, 58, 255), (118, 72, 42, 255), (80, 48, 32, 255)]
    LIN = [(236, 196, 150, 255), (200, 150, 110, 255), (150, 98, 76, 255)]
    # dos mitades de una cartera abierta
    for x0, x1 in ((4, 31), (33, 60)):
        d.rounded_rectangle([x0, 10, x1, 54], radius=4, fill=LEA[2])
        d.rounded_rectangle([x0, 10, x1, 51], radius=4, fill=LEA[1])
        d.rounded_rectangle([x0 + 2, 12, x1 - 2, 48], radius=2, fill=LIN[1])
        d.line([(x0 + 3, 12), (x1 - 3, 12)], fill=LIN[0])
        # puntadas
        for x in range(x0 + 3, x1 - 2, 4):
            d.point((x, 50), fill=LEA[0]); d.point((x, 13), fill=LIN[2])
    # lomo
    d.rectangle([31, 10, 32, 54], fill=LEA[3])
    # ranuras de tarjetas vacias a la izquierda
    for y in (20, 28, 36):
        d.line([(8, y), (27, y)], fill=LIN[2]); d.line([(8, y + 1), (27, y + 1)], fill=LIN[0])
    # bolsillo de billetes vacio a la derecha
    d.rounded_rectangle([37, 18, 56, 44], radius=2, fill=LIN[2]); d.rectangle([37, 18, 56, 21], fill=(120, 76, 60, 255))
    d.rectangle([39, 22, 54, 24], fill=(98, 62, 52, 255))
    # telarana en la esquina
    cw = (226, 230, 248, 255)
    ox, oy = 59, 10
    for ang in (100, 125, 150, 175):
        a = math.radians(ang)
        d.line([(ox, oy), (ox + math.cos(a) * 20, oy + math.sin(a) * 20)], fill=cw)
    for rr in (6, 11, 16):
        pts = [(ox + math.cos(math.radians(a)) * rr, oy + math.sin(math.radians(a)) * rr) for a in (100, 125, 150, 175)]
        d.line(pts, fill=cw)
    # la arana colgando
    d.line([(46, 21), (46, 28)], fill=cw); d.ellipse([44, 28, 48, 32], fill=BLK[2])
    for dx in (-3, -2, 2, 3):
        d.point((46 + dx, 29 + (1 if abs(dx) == 3 else 0)), fill=BLK[2])
    return outline(im)


def main():
    out = {"bet_red": roulette(), "pz_monedas": coins_stack(), "pz_gordo": ingots(), "pz_reto": challenge(), "pz_atraco": heist(), "pz_reloj": clock(), "pz_nada": empty()}
    for k, im in out.items():
        up(im).save(ICONS + k + ".webp", lossless=True)
    if len(sys.argv) > 2:
        names = list(out)
        sh = Image.new("RGBA", (200 * 4, 200 * 2), (40, 70, 55, 255))
        for i, k in enumerate(names):
            sh.alpha_composite(out[k].resize((192, 192), Image.NEAREST), ((i % 4) * 200, (i // 4) * 200))
        sh.save(sys.argv[2])


if __name__ == "__main__":
    main()
