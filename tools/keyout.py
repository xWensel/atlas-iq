"""Quita el fondo plano de un icono generado (relleno por inundacion desde los bordes) y lo deja como WebP con transparencia.
El fondo lo pide el generador en magenta liso; el contorno oscuro del dibujo detiene la inundacion, asi que no se come el objeto."""
import sys
from collections import deque
from PIL import Image, ImageFilter

def keyout(src, dst, size=256, tol=62, square=True):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()
    # color de fondo = mediana de los pixeles del borde
    border = [px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)]
    bg = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    def near(c, t):
        return (c[0] - bg[0]) ** 2 + (c[1] - bg[1]) ** 2 + (c[2] - bg[2]) ** 2 <= t * t
    mask = bytearray(w * h)  # 1 = fondo
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near(px[x, y], tol) and not mask[y * w + x]:
                mask[y * w + x] = 1; dq.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if near(px[x, y], tol) and not mask[y * w + x]:
                mask[y * w + x] = 1; dq.append((x, y))
    while dq:
        x, y = dq.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny * w + nx] and near(px[nx, ny], tol):
                mask[ny * w + nx] = 1; dq.append((nx, ny))
    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if mask[y * w + x]:
                ap[x, y] = 0
    # suaviza el borde del recorte (1px) y quita la sombra rosada suelta
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA"); out.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if bbox:
        pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.06)
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        out = out.crop(bbox)
    if square:
        s = max(out.size)
        sq = Image.new("RGBA", (s, s), (0, 0, 0, 0)); sq.paste(out, ((s - out.size[0]) // 2, (s - out.size[1]) // 2))
        sq = sq.resize((size, size), Image.LANCZOS)
    else:
        sq = out.resize((size, round(out.size[1] * size / out.size[0])), Image.LANCZOS)
    sq.save(dst, "WEBP", quality=90, method=6)
    return bg

if __name__ == "__main__":
    print(keyout(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 256))
