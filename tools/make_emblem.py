#!/usr/bin/env python3
"""Geolite - escudo de la marca: la TIERRA del logo (la O de GEOLITE) con la carta y la ficha encima, en pixel art de verdad (48 px nativos).
El globo se recorta del logo pixelizado (tools/brand/logo.webp) y la carta y la ficha se dibujan pixel a pixel con la misma paleta.
Salida: tools/brand/emblem48.png (nativo, transparente). tools/make_icons.py lo amplia a todos los tamanos."""
from PIL import Image
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parent.parent
logo = Image.open(ROOT / "tools" / "brand" / "logo.webp").convert("RGBA")
logo = logo.resize((logo.width // 3, logo.height // 3), Image.NEAREST)                # 200 nativos
INK = (48, 0, 104, 255); CREAM = (255, 247, 214, 255); CREAM2 = (238, 218, 160, 255); RED = (206, 34, 40, 255); RED2 = (150, 20, 34, 255); GOLD = (248, 180, 73, 255); WHITE = (255, 255, 244, 255)

# ---- globo: los pixeles de la O del logo (centro 88,41, radio 18,5), sin las letras vecinas
px = logo.load(); cx, cy, R = 88, 41, 18.6
G = Image.new("RGBA", (37, 37), (0, 0, 0, 0)); gp = G.load()
for y in range(37):
    for x in range(37):
        sx, sy = cx - 18 + x, cy - 18 + y
        if math.hypot(sx - cx, sy - cy) <= R:
            c = px[sx, sy]
            if c[3] and not (c[0] > 200 and c[1] > 140 and c[2] < 130):             # fuera el amarillo de las letras
                gp[x, y] = c
# relleno de huecos interiores con el azul del oceano
ocean = (1, 104, 248, 255)
for y in range(37):
    for x in range(37):
        if math.hypot(x - 18, y - 18) <= R - 0.6 and gp[x, y][3] == 0: gp[x, y] = ocean
# sin reflejo: cualquier pixel casi blanco dentro del globo pasa a oceano
for y in range(37):
    for x in range(37):
        c = gp[x, y]
        if c[3] and min(c[:3]) > 190: gp[x, y] = ocean

W = H = 48
E = Image.new("RGBA", (W, H), (0, 0, 0, 0)); E.alpha_composite(G, (2, 10))

def put(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height: img.putpixel((x, y), c)

def outline(img, col=INK):
    src = img.copy(); sp = src.load()
    for y in range(img.height):
        for x in range(img.width):
            if sp[x, y][3] == 0 and any(0 <= x + dx < img.width and 0 <= y + dy < img.height and sp[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                img.putpixel((x, y), col)

# ---- carta: 13x18, inclinada (cizalla), con un rombo rojo y dos "puntas" de palo
def make_card():
    w, h = 12, 16; C = Image.new("RGBA", (w + 3, h), (0, 0, 0, 0))
    for y in range(h):
        off = int(round((h - 1 - y) * 0.14))                                        # inclinacion a la derecha
        for x in range(w):
            corner = (x in (0, w - 1)) and (y in (0, h - 1))
            if corner: continue
            put(C, x + off, y, CREAM2 if (x == w - 1 or y == h - 1) else CREAM)
    for (dx, dy) in [(0, -4), (0, 4)]:                                                # dos rombos pequenos + uno grande
        pass
    def diamond(cx_, cy_, r, col):
        for yy in range(-r, r + 1):
            for xx in range(-r, r + 1):
                if abs(xx) + abs(yy) <= r:
                    off = int(round((h - 1 - (cy_ + yy)) * 0.14)); put(C, cx_ + xx + off, cy_ + yy, col)
    diamond(6, 8, 4, RED); diamond(6, 8, 2, (232, 70, 60, 255)); diamond(2, 2, 1, RED); diamond(9, 13, 1, RED)
    outline(C); return C

def make_chip():
    d = 15; C = Image.new("RGBA", (d, d), (0, 0, 0, 0)); c0 = (d - 1) / 2
    for y in range(d):
        for x in range(d):
            r = math.hypot(x - c0, y - c0)
            if r <= 6.4:
                ang = math.atan2(y - c0, x - c0); notch = (r >= 4.4) and (int(round((ang + math.pi) / (math.pi / 4))) % 2 == 0) and abs(((ang + math.pi) / (math.pi / 4)) - round((ang + math.pi) / (math.pi / 4))) < 0.32
                col = WHITE if notch else RED
                if r <= 4.2: col = RED2 if r > 2.6 else GOLD
                put(C, x, y, col)
    outline(C); return C

card = make_card(); chip = make_chip()
E.alpha_composite(card, (26, 1)); E.alpha_composite(chip, (30, 18))
outline_img = E.copy(); outline(outline_img)                                        # contorno oscuro de todo el conjunto
out = ROOT / "tools" / "brand" / "emblem48.png"; outline_img.save(out); print(out, outline_img.size)
