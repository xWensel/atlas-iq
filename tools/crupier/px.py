#!/usr/bin/env python3
"""Geolite - Don Crupier: utilidades de pixel (solo desarrollo).
Todo el crupier se dibuja sobre su rejilla nativa de 128x128 con una paleta cerrada de caracteres, como un pixel artist:
  - PAL: caracter -> RGBA ('.' transparente). Los parches se escriben como texto (una fila por linea).
  - patch(img, x, y, texto): pinta el texto en (x, y); ' ' deja el pixel como estaba, '.' lo borra.
  - to_chars / from_chars: ida y vuelta entre imagen y texto (para ver y editar zonas).
  - show(...): hoja ampliada con rejilla para revisar a ojo.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

# ---------------------------------------------------------------- paleta cerrada (ramas limpias; ver master.py)
PAL = {
    ".": (0, 0, 0, 0),
    # tinta y oscuros
    "s": (29, 10, 61, 255),      # contorno exterior (indigo)
    "K": (1, 0, 63, 255),        # linea interior
    "D": (10, 0, 72, 255),       # relleno mas oscuro (traje en sombra, huecos de la mascara)
    # morados (chistera, traje, bigote)
    "d": (35, 3, 97, 255),       # sombra
    "P": (57, 19, 127, 255),     # medio
    "L": (78, 42, 133, 255),     # luz
    "H": (112, 74, 168, 255),    # brillo
    "a": (45, 19, 100, 255),     # bigote medio
    # rojos (banda, pajarita, palos)
    "R": (255, 28, 36, 255),     # rojo
    "c": (205, 7, 37, 255),      # rojo sombra
    "e": (255, 112, 104, 255),   # rojo brillo
    "x": (150, 4, 40, 255),      # rojo profundo (lengua/boca)
    # oro de la mascara
    "t": (255, 255, 240, 255),   # destello
    "h": (255, 239, 131, 255),   # luz
    "y": (255, 233, 26, 255),    # oro
    "b": (255, 212, 73, 255),    # oro templado
    "O": (255, 168, 73, 255),    # naranja (sombra)
    "o": (191, 115, 71, 255),    # sombra profunda
    # piel
    "r": (255, 202, 177, 255),   # piel
    "q": (236, 150, 138, 255),   # piel sombra / rubor
    "G": (190, 157, 117, 255),   # tostado (pliegues)
    # blancos (guante, camisa, cartas, ojos)
    "W": (255, 255, 255, 255),
    "w": (214, 206, 238, 255),   # blanco en sombra (lavanda)
    "v": (160, 146, 206, 255),   # sombra profunda del blanco
    # extras de expresion
    "B": (98, 196, 255, 255),    # lagrima / sudor
    "n": (200, 238, 255, 255),   # brillo de la lagrima
    "Z": (240, 240, 255, 255),   # zetas del sueno
}
RGB = {k: np.array(v, np.uint8) for k, v in PAL.items()}

def blank():
    return np.zeros((128, 128, 4), np.uint8)

def load(path):
    return np.array(Image.open(path).convert("RGBA"))

def nearest_char(px):
    if px[3] == 0: return "."
    best, bd = None, 1e9
    for k, v in PAL.items():
        if k == "." or k in "BnZ": continue
        d = int(((v[:3] - px[:3].astype(int)) ** 2).sum()) if isinstance(v, np.ndarray) else sum((a - int(b)) ** 2 for a, b in zip(v[:3], px[:3]))
        if d < bd: best, bd = k, d
    return best

def to_chars(img, x0=0, y0=0, x1=128, y1=128):
    return ["".join(nearest_char(img[y, x]) for x in range(x0, x1)) for y in range(y0, y1)]

def from_chars(rows):
    h = len(rows); w = max(len(r) for r in rows); out = np.zeros((h, w, 4), np.uint8)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r): out[y, x] = RGB[ch]
    return out

def rows_of(text):
    """texto de un parche -> filas (quita la primera linea vacia y la sangria comun marcada con '|')"""
    ls = text.split("\n")
    if ls and not ls[0].strip(): ls = ls[1:]
    if ls and not ls[-1].strip(): ls = ls[:-1]
    out = []
    for l in ls:
        if "|" in l: l = l.split("|", 1)[1]
        out.append(l.rstrip("\n"))
    return out

def patch(img, x, y, text, keep=" "):
    """pinta el texto en (x, y) sobre img (in situ). keep=' ' deja el pixel; '.' lo hace transparente"""
    for dy, r in enumerate(rows_of(text) if isinstance(text, str) else text):
        for dx, ch in enumerate(r):
            if ch == keep: continue
            yy, xx = y + dy, x + dx
            if 0 <= yy < img.shape[0] and 0 <= xx < img.shape[1]: img[yy, xx] = RGB[ch]
    return img

def replace(img, mapping, box=None):
    """cambia colores por caracter: mapping {'p': 'P'} (en la caja x0,y0,x1,y1 si se da)"""
    x0, y0, x1, y1 = box or (0, 0, img.shape[1], img.shape[0])
    sub = img[y0:y1, x0:x1]
    for a, b in mapping.items():
        m = (sub == RGB[a]).all(-1); sub[m] = RGB[b]
    return img

def over(dst, src, x=0, y=0):
    """compone src (RGBA, alfa de 1 bit) sobre dst en (x, y)"""
    h, w = src.shape[:2]
    ys, xs = max(0, -y), max(0, -x); ye, xe = min(h, dst.shape[0] - y), min(w, dst.shape[1] - x)
    if ye <= ys or xe <= xs: return dst
    s = src[ys:ye, xs:xe]; m = s[..., 3] > 0
    d = dst[y + ys:y + ye, x + xs:x + xe]; d[m] = s[m]
    return dst

def quantize(img):
    """cualquier pixel -> el de la paleta mas cercano (y alfa de 1 bit)"""
    out = img.copy(); h, w = img.shape[:2]
    for yy in range(h):
        for xx in range(w):
            ch = nearest_char(img[yy, xx]) if img[yy, xx, 3] >= 128 else "."
            out[yy, xx] = RGB[ch]
    return out

def big(img, k=4, bg=None):
    im = Image.fromarray(img, "RGBA")
    if bg is not None:
        b = Image.new("RGBA", im.size, bg); b.alpha_composite(im); im = b
    return im.resize((img.shape[1] * k, img.shape[0] * k), Image.NEAREST)

def show(img, path, box=None, k=12, grid=True):
    """zona ampliada con rejilla y coordenadas (para revisar a ojo)"""
    x0, y0, x1, y1 = box or (0, 0, img.shape[1], img.shape[0])
    sub = img[y0:y1, x0:x1]; h, w = sub.shape[:2]
    chk = np.zeros((h, w, 4), np.uint8); chk[...] = (205, 205, 205, 255); chk[(np.indices((h, w)).sum(0)) % 2 == 0] = (232, 232, 232, 255)
    im = Image.fromarray(chk); im.alpha_composite(Image.fromarray(sub)); im = im.resize((w * k, h * k), Image.NEAREST)
    pad = 26; out = Image.new("RGBA", (w * k + pad, h * k + pad), (255, 255, 255, 255)); out.paste(im, (pad, pad)); d = ImageDraw.Draw(out)
    if grid:
        for xx in range(w + 1):
            d.line([(pad + xx * k, pad), (pad + xx * k, pad + h * k)], fill=(255, 0, 0, 255) if (x0 + xx) % 8 == 0 else (0, 0, 0, 36))
            if (x0 + xx) % 4 == 0 and xx < w: d.text((pad + xx * k + 1, 2), str(x0 + xx), fill=(0, 0, 0, 255))
        for yy in range(h + 1):
            d.line([(pad, pad + yy * k), (pad + w * k, pad + yy * k)], fill=(255, 0, 0, 255) if (y0 + yy) % 8 == 0 else (0, 0, 0, 36))
            if (y0 + yy) % 4 == 0 and yy < h: d.text((1, pad + yy * k + 1), str(y0 + yy), fill=(0, 0, 0, 255))
    out.save(path); return path

def sheet(frames, path, k=3, cols=6, bg=(38, 30, 58, 255), labels=None):
    """hoja de fotogramas (lista de imagenes 128x128) con etiquetas"""
    n = len(frames); rows = (n + cols - 1) // cols; W = 128 * k; lab = 16 if labels else 0
    out = Image.new("RGBA", (cols * (W + 6) + 6, rows * (W + 6 + lab) + 6), bg); d = ImageDraw.Draw(out)
    for i, f in enumerate(frames):
        cx, cy = 6 + (i % cols) * (W + 6), 6 + (i // cols) * (W + 6 + lab)
        out.alpha_composite(big(f, k), (cx, cy + lab))
        if labels: d.text((cx + 2, cy + 2), labels[i], fill=(255, 240, 200, 255))
    out.save(path); return path
