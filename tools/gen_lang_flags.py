"""
Genera los banderines que faltan (es-419, zh, ko, ja, ru) para el selector de
idioma de Ajustes, en el MISMO formato que los banderines existentes
(flag_es.webp, flag_fr.webp, ...): 208x144, marco de tinta (#16241C), colores
planos sin degradados, sin antialiasing (se dibuja en una rejilla de 52x36 y
se escala x4 con NEAREST para que el pixel art salga nitido).
Uso: python tools/gen_lang_flags.py
"""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
SCALE = 4
W, H = 52, 36  # 208x144 tras escalar

INK = (22, 36, 28, 255)
CREAM = (242, 233, 214, 255)
RED = (194, 55, 46, 255)
BLUE = (31, 61, 122, 255)
YELLOW = (241, 196, 83, 255)
BLACK = (26, 26, 26, 255)
GREEN = (31, 92, 58, 255)

INNER = (2, 2, 49, 33)  # x0,y0,x1,y1 inclusive


def base(fill=None):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 1, 50, 34], fill=INK)
    d.rectangle(list(INNER), fill=fill or CREAM)
    return im, d


def save(im, name):
    big = im.resize((W * SCALE, H * SCALE), Image.NEAREST)
    path = os.path.join(OUT, f"flag_{name}.webp")
    big.save(path, "WEBP", lossless=True)
    print("guardado", path)


def star(d, cx, cy, r_out, r_in, rot=-90, fill=YELLOW):
    pts = []
    for i in range(10):
        ang = math.radians(rot + i * 36)
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d.polygon(pts, fill=fill)


def gen_ja():
    im, d = base(CREAM)
    d.ellipse([25 - 8, 17 - 8, 25 + 8, 17 + 8], fill=RED)
    save(im, "ja")


def gen_ru():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 1, 50, 34], fill=INK)
    x0, y0, x1, y1 = INNER
    h = (y1 - y0 + 1) / 3
    d.rectangle([x0, y0, x1, y0 + h - 1], fill=CREAM)
    d.rectangle([x0, y0 + h, x1, y0 + 2 * h - 1], fill=BLUE)
    d.rectangle([x0, y0 + 2 * h, x1, y1], fill=RED)
    save(im, "ru")


def gen_pl():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([1, 1, 50, 34], fill=INK)
    x0, y0, x1, y1 = INNER
    mid = y0 + (y1 - y0 + 1) // 2
    d.rectangle([x0, y0, x1, mid - 1], fill=CREAM)
    d.rectangle([x0, mid, x1, y1], fill=RED)
    save(im, "pl")


def gen_zh():
    im, d = base(RED)
    star(d, 11, 9, 5.5, 2.2, rot=-90)
    for cx, cy in [(19, 5), (22, 9), (22, 14), (19, 18)]:
        star(d, cx, cy, 2.1, 0.8, rot=-90)
    save(im, "zh")


def gen_ko():
    im, d = base(CREAM)
    cx, cy, R = 25.5, 17.5, 8.5
    # taegeuk: rojo arriba, azul abajo, partidos en S por dos circulos de radio R/2 sobre el eje horizontal
    for x in range(int(cx - R), int(cx + R) + 1):
        for y in range(int(cy - R), int(cy + R) + 1):
            px, py = x + 0.5, y + 0.5
            if (px - cx) ** 2 + (py - cy) ** 2 > R * R:
                continue
            d_left = (px - (cx - R / 2)) ** 2 + (py - cy) ** 2
            d_right = (px - (cx + R / 2)) ** 2 + (py - cy) ** 2
            if d_left <= (R / 2) ** 2:
                d.point((x, y), fill=BLUE)
            elif d_right <= (R / 2) ** 2:
                d.point((x, y), fill=RED)
            elif py < cy:
                d.point((x, y), fill=RED)
            else:
                d.point((x, y), fill=BLUE)

    def trigram(x, y, broken):
        for i, br in enumerate(broken):
            yy = y + i * 2
            if br:
                d.line([(x, yy), (x + 1, yy)], fill=BLACK)
                d.line([(x + 3, yy), (x + 4, yy)], fill=BLACK)
            else:
                d.line([(x, yy), (x + 4, yy)], fill=BLACK)

    trigram(4, 4, [False, False, False])        # geon, arriba-izq
    trigram(41, 4, [True, False, True])         # gam, arriba-der
    trigram(4, 27, [False, True, False])        # li, abajo-izq
    trigram(41, 27, [True, True, True])         # gon, abajo-der
    save(im, "ko")


def gen_es419():
    """Sin bandera unica para 'espanol de Latinoamerica': un globo simple
    en el mismo formato de banderin, para no elegir un solo pais."""
    im, d = base(CREAM)
    ocean, land = (52, 110, 186, 255), (72, 168, 96, 255)
    d.ellipse([17, 9, 34, 26], fill=ocean)
    d.polygon([(19, 12), (25, 10), (28, 12), (25, 16), (23, 18), (20, 16)], fill=land)   # Norte y Centroamerica
    d.polygon([(25, 19), (30, 18), (31, 21), (28, 25), (26, 25), (25, 22)], fill=land)   # Sudamerica
    save(im, "es-419")


if __name__ == "__main__":
    gen_ja(); gen_ru(); gen_zh(); gen_ko(); gen_es419(); gen_pl()
