#!/usr/bin/env python3
"""Geolite - tarjeta del modo Aventura (solo desarrollo).
Escena: el crupier de sus frases (assets/icons/dealer_neutral.webp, tal cual) preside la mesa del mapamundi; subido al
tapete, de espaldas, el explorador le planta cara con su brujula entre las fichas en juego.

IMPORTANTE: el crupier se lee de assets/icons/dealer_neutral.webp. Si el crupier cambia (retrato nuevo, otro traje,
otro tamano), hay que volver a ejecutar este script y revisar la escena para que se adapte (posicion DEALER_AT, que la
mesa le tape el busto y que la pajarita siga a la vista). Regla anotada en CLAUDE.md.

El resto de piezas salen del mismo estudio que los logros del Perfil (gen_art: ICON_SUF, aisladas sobre magenta y
recortadas con keyout; originales en tools/art/card_adv/) y se asientan UNA A UNA sobre la misma
reticula que el crupier: lienzo nativo 170x213, cada pieza reducida por moda de color (sin mezclas ni degradados),
alfa de 1 bit y contorno de tinta de 1 px nativo como el suyo. Ampliado x6 por vecino mas cercano -> 1020x1278.

  python tools/card_adv.py [--preview ruta.png]      escribe assets/gen/card_adv.webp
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from pixel_cleanup import reoutline
from pxkit import land_mask, despeckle

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / "tools" / "art" / "card_adv"
DEALER_AT = (21, 12)                                    # esquina del retrato nativo (128 px) en el lienzo
W, H, K = 170, 213, 6


def load(name):
    im = Image.open(PARTS / name).convert("RGBA")
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox())


def to_grid(im, w=None, h=None, colors=36, sprite=True):
    """reduce una pieza a la reticula nativa: cada pixel nuevo toma el color MAS FRECUENTE de su bloque (nunca una
    media), asi no nacen tonos intermedios; alfa por mayoria y, en los sprites, contorno de tinta de 1 px"""
    if w and not h: h = round(im.height * w / im.width)
    if h and not w: w = round(im.width * h / im.height)
    rgb = im.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(rgb.getpalette()[:colors * 3], np.uint8).reshape(-1, 3)
    idx = np.array(rgb); a = np.array(im.getchannel("A")) > 128
    ys = np.linspace(0, im.height, h + 1).astype(int); xs = np.linspace(0, im.width, w + 1).astype(int)
    out = np.zeros((h, w, 3), np.uint8); m = np.zeros((h, w), bool)
    for j in range(h):
        for i in range(w):
            bi = idx[ys[j]:ys[j + 1], xs[i]:xs[i + 1]]; ba = a[ys[j]:ys[j + 1], xs[i]:xs[i + 1]]
            if not sprite or ba.mean() >= .5:
                v = bi[ba] if sprite else bi.ravel()
                out[j, i] = pal[np.bincount(v, minlength=len(pal)).argmax()]; m[j, i] = True
    if not sprite: return np.dstack([out, np.full((h, w), 255, np.uint8)])
    return reoutline(out, m)


def blit(cv, spr, x, y):
    h, w = spr.shape[:2]; x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    s = spr[y0 - y:y1 - y, x0 - x:x1 - x]; m = s[..., 3] > 0
    cv[y0:y1, x0:x1][m] = s[m]


def ellipse(cx, cy, rx, ry):
    y, x = np.mgrid[0:H, 0:W]; return ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1


def tone(cv, m, k):
    cv[m, :3] = np.clip(cv[m, :3].astype(float) * k, 0, 255).astype(np.uint8)


INK = (29, 10, 61, 255)
RAMP = {   # brillo, luz, base, sombra, fondo (las rampas de tools/hand_icons.py)
    "red": ("ffa08f", "ff5a55", "d8283f", "9c1a3f", "5e1238"), "teal": ("b0ffe8", "4ee3c1", "1fb3a3", "16787f", "164a5c"),
    "gold": ("fff6c8", "ffd95a", "f5a623", "c46a1b", "7f3a1a"), "purple": ("ecc2ff", "b36cff", "8440e0", "5a2ab0", "351a70"),
    "dark": ("6a6f96", "4a4d72", "33345a", "24234a", "181636"), "cream": ("ffffff", "fff4dc", "eedcb8", "c9aa84", "8a6a58"),
}
def rgb(h): return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
RP = {k: [rgb(c) for c in v] for k, v in RAMP.items()}


def ell(h, w, cx, cy, rx, ry):
    y, x = np.mgrid[0:h, 0:w]; return ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1


def inked(spr):
    """contorno de tinta de 1 px (4-conexo, como el del crupier) alrededor de todo lo opaco"""
    m = spr[..., 3] > 0; ring = np.zeros_like(m)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): ring |= np.roll(np.roll(m, dy, 0), dx, 1)
    out = np.zeros((spr.shape[0] + 2, spr.shape[1] + 2, 4), np.uint8); out[1:-1, 1:-1] = spr
    mm = out[..., 3] > 0; r = np.zeros_like(mm)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): r |= np.roll(np.roll(mm, dy, 0), dx, 1)
    out[r & ~mm] = INK; return out


def chip_stack(cols, rx=8, ry=3, th=2):
    """pila de fichas pixel a pixel: canto con incrustaciones blancas alternas, filo oscuro entre fichas y la de
    arriba con aro de rayas, filete y centro (luz arriba-izquierda)"""
    w = 2 * rx; h = 2 * ry + th * len(cols) + 1; cx = rx; s = np.zeros((h, w, 4), np.uint8)
    x = np.mgrid[0:h, 0:w][1]
    for i, c in enumerate(cols):
        cy = h - ry - th - i * th - .5; r = RP[c]
        side = np.zeros((h, w), bool)
        for k in range(1, th + 1): side |= ell(h, w, cx, cy + k, rx, ry)
        side &= ~ell(h, w, cx, cy, rx, ry)
        s[side] = r[3]
        s[side & (((x + i * 3) % 6) < 2)] = RP["cream"][2]                      # incrustaciones del canto
        low = side & ~ell(h, w, cx, cy + th - 1, rx, ry); s[low] = r[4]         # filo inferior: separa fichas
        s[side & (x < 2) & ~low] = r[2]                                         # canto iluminado a la izquierda
        top = ell(h, w, cx, cy, rx, ry); s[top] = r[2]
        if i == len(cols) - 1:
            s[top & ~ell(h, w, cx, cy + 1, rx, ry)] = r[1]
            ring = top & ~ell(h, w, cx, cy, rx - 2, ry - 1); dash = ring & ((x % 3) == 0); s[dash] = RP["cream"][1]
            ctr = ell(h, w, cx, cy, rx - 3.2, ry - 1.2); s[ctr] = r[1]
    return inked(s)


def flat_chip(c, rx=5, ry=2):
    h, w = 2 * ry + 2, 2 * rx; s = np.zeros((h, w, 4), np.uint8); r = RP[c]
    s[ell(h, w, rx, ry + 1.5, rx, ry)] = r[3]; top = ell(h, w, rx, ry + .5, rx, ry); s[top] = r[2]
    s[top & ~ell(h, w, rx, ry + 1.5, rx, ry)] = r[1]; s[ell(h, w, rx, ry + .5, rx - 2.5, ry - .8)] = RP["cream"][1]
    return inked(s)


def build():
    cv = to_grid(Image.open(PARTS / "bg_1.jpg").convert("RGBA"), W, H, colors=28, sprite=False)
    cv[33:40, 60:68] = cv[33:40, 52:60]                                          # soporte del foco que asomaba junto a la chistera
    tone(cv, np.ones((H, W), bool), .7)                                          # telon en penumbra: manda el foco
    dealer = np.array(Image.open(ROOT / "assets" / "icons" / "dealer_neutral.webp").convert("RGBA"))[::4, ::4]
    blit(cv, dealer, *DEALER_AT)                                                    # el de sus frases, pixel por pixel
    table = to_grid(load("table_1.png"), w=W + 24, colors=32)
    tx, ty = -12, 128
    blit(cv, table, tx, ty)
    # tapete repintado a mano: fuera el mapa borroso del generador, dentro el mundo real (Natural Earth) a pixeles
    t = table[..., :3].astype(int)
    green = (t[..., 1] > t[..., 0] + 25) & (t[..., 1] > t[..., 2] - 10) & (table[..., 3] > 0)
    felt = np.zeros((H, W), bool)
    for j in range(table.shape[0]):
        r = np.where(green[j])[0]
        if len(r) > 20 and ty + j < H: felt[ty + j, max(0, r.min() + tx):min(W, r.max() + tx + 1)] = True
    FB, FS, FL = (19, 167, 130, 255), (14, 124, 106, 255), (36, 186, 142, 255)
    cv[felt] = FB
    top_band = felt & ~np.roll(felt, 2, 0); cv[top_band] = FS                    # sombra de la barandilla sobre el tapete
    EX, EY = 72, 177                                                             # pies del explorador
    lit = felt & ~top_band & ellipse(EX + 8, EY - 8, 58, 15); cv[lit] = FL       # foco sobre el tapete, a pixeles
    inner = felt.copy()
    for _ in range(4): inner &= np.roll(inner, 1, 0) & np.roll(inner, -1, 0) & np.roll(inner, 1, 1) & np.roll(inner, -1, 1)
    gl = inner & ~(np.roll(inner, 1, 0) & np.roll(inner, -1, 0) & np.roll(inner, 1, 1) & np.roll(inner, -1, 1))
    cv[gl] = RP["gold"][2]; cv[gl & (np.mgrid[0:H, 0:W][0] < 150)] = RP["gold"][1]  # filete dorado del tapete
    ys, xs = np.where(inner); bx0, bx1, by0, by1 = xs.min() + 6, xs.max() - 5, ys.min() + 3, ys.max() - 2
    land = land_mask(2048)[100:790]
    lm = np.array(Image.fromarray((land * 255).astype(np.uint8)).resize((bx1 - bx0, by1 - by0), Image.BOX)) > 100
    L = np.zeros((H, W), bool); L[by0:by1, bx0:bx1] = lm
    L = despeckle(L, passes=1) & inner & ~gl
    LB, LL, LS = (226, 222, 160, 255), (246, 240, 186, 255), (12, 108, 94, 255)
    cv[L] = LB; cv[L & lit] = LL
    sh = np.roll(np.roll(L, 1, 0), 1, 1) & ~L & inner & ~gl; cv[sh] = LS        # tinta impresa: sombra de 1 px
    # fichas en juego y el explorador, de atras hacia delante, con sombra de contacto
    def put(s, cx, by, k=.55):
        tone(cv, ellipse(cx, by - 1, s.shape[1] / 2 + 1, 2.5), k); blit(cv, s, round(cx - s.shape[1] / 2), by - s.shape[0] + 1)
    put(chip_stack(["teal", "red", "teal", "red", "gold", "red", "gold"]), 17, 166)
    put(chip_stack(["purple", "gold", "purple", "gold"], rx=6), 31, 174)
    put(chip_stack(["red", "red", "dark", "red", "red", "dark", "red", "red", "gold"]), 152, 166)
    put(flat_chip("teal"), 100, 180); put(flat_chip("gold"), 106, 178)
    put(to_grid(load("rear_3.png"), h=70), EX, EY, .5)
    return cv


if __name__ == "__main__":
    im = Image.fromarray(build(), "RGBA").convert("RGB").resize((W * K, H * K), Image.NEAREST)
    out = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else ROOT / "assets" / "gen" / "card_adv.webp"
    if str(out).endswith(".webp"): im.save(out, "WEBP", lossless=True, method=6)
    else: im.save(out)
    print("ok", out, im.size)
