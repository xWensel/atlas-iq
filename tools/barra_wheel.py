"""Uso: python tools/barra_wheel.py <raiz del repo>
Icono de la casilla Ruleta de premios (assets/icons/bet_wheel.webp). La moneda: tools/barra_coin.py."""
import math, sys
from PIL import Image, ImageDraw

ROOT = sys.argv[1]
ICONS = ROOT + "/assets/icons/"
INK = (22, 14, 40, 255)          # contorno azul oscuro, como el resto de iconos
GOLD = [(255, 236, 140, 255), (247, 190, 60, 255), (200, 130, 28, 255), (140, 84, 22, 255)]
RED = [(246, 110, 90, 255), (214, 58, 47, 255), (150, 30, 32, 255)]
BLK = [(92, 96, 118, 255), (44, 46, 60, 255), (22, 22, 32, 255)]
GRN = [(120, 232, 150, 255), (40, 160, 90, 255), (18, 100, 58, 255)]
WHITE = (255, 248, 232, 255)
L = 64   # lienzo logico; se amplia x6 a 384


def up(im, size=384):
    return im.resize((size, size), Image.NEAREST)


def outline(im):
    """contorno de 1 px logico (en INK) alrededor de lo opaco"""
    a = im.split()[3]
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    px, ap, op = im.load(), a.load(), out.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            if ap[x, y] > 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and ap[nx, ny] > 0:
                    op[x, y] = INK
                    break
    out.alpha_composite(im)
    return out


# ---------- bet_wheel: ruleta de premios de frente ----------
def wheel(n=8, r_out=27, cx=32, cy=33):
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    px = im.load()
    cols = [GOLD, RED, GRN, BLK]
    for y in range(L):
        for x in range(L):
            dx, dy = x + .5 - cx, y + .5 - cy
            d = math.hypot(dx, dy)
            if d > r_out:
                continue
            ang = (math.degrees(math.atan2(dx, -dy)) + 360) % 360
            k = int(ang // (360 / n))
            if d > r_out - 3.2:                                   # aro de oro con bombillas
                bulb = int((ang + 360 / n / 2) // (360 / n * .5)) % 2 == 0 and 0 < (ang % (360 / n)) < 360 / n
                c = GOLD[0] if int(ang // (360 / (n * 2))) % 2 == 0 else GOLD[2]
                px[x, y] = c
                continue
            if d < 6.4:                                           # cubo central
                px[x, y] = GOLD[1] if d > 3 else GOLD[0]
                if d > 5.2:
                    px[x, y] = GOLD[3]
                continue
            pal = cols[k % 4]
            c = pal[1]
            edge = (ang % (360 / n)) < 1.1 / max(d, 8) * 57                  # raya clara a un lado de cada cuna
            if edge:
                c = pal[0]
            elif d > r_out - 6:
                c = pal[2] if (x + y) % 2 == 0 else pal[1]
            px[x, y] = c
    # filetes dorados entre cunas
    for k in range(n):
        a = math.radians(k * 360 / n)
        for t in range(7, r_out - 3):
            x = int(cx + math.sin(a) * t); y = int(cy - math.cos(a) * t)
            if 0 <= x < L and 0 <= y < L:
                px[x, y] = GOLD[3]
    # brillo superior izquierdo
    for y in range(L):
        for x in range(L):
            if px[x, y][3] and math.hypot(x - cx + 9, y - cy + 11) < 6 and px[x, y] != GOLD[3]:
                r, g, b, a = px[x, y]
                px[x, y] = (min(255, r + 40), min(255, g + 40), min(255, b + 40), a)
    # puntero rojo arriba
    for i in range(6):
        for j in range(-(5 - i) // 2, (5 - i) // 2 + 1):
            x, y = 32 + j, 1 + i
            px[x, y] = RED[1] if i < 4 else RED[2]
    px[32, 2] = RED[0]; px[31, 2] = RED[0]
    return outline(im)


if __name__ == "__main__":
    up(wheel()).save(ICONS + "bet_wheel.webp", lossless=True)
