"""zoom de una imagen de rejilla nativa con reticula y coordenadas (para retocar a mano)"""
import sys
import numpy as np
from PIL import Image, ImageDraw

def zoom(a, path, z=14, bg=(60, 52, 76)):
    h, w = a.shape[:2]; pad = 22
    im = Image.new("RGB", (w * z + pad, h * z + pad), (20, 16, 28)); d = ImageDraw.Draw(im)
    for y in range(h):
        for x in range(w):
            c = tuple(int(v) for v in a[y, x, :3]) if a[y, x, 3] else ((bg if (x + y) % 2 else tuple(v + 10 for v in bg)))
            d.rectangle([pad + x * z, pad + y * z, pad + x * z + z - 1, pad + y * z + z - 1], fill=c)
    for i in range(0, max(w, h) + 1, 4):
        if i <= w: d.line([pad + i * z, pad, pad + i * z, pad + h * z], fill=(255, 255, 255) if i % 8 == 0 else (150, 150, 150), width=1)
        if i <= h: d.line([pad, pad + i * z, pad + w * z, pad + i * z], fill=(255, 255, 255) if i % 8 == 0 else (150, 150, 150), width=1)
        if i < w: d.text((pad + i * z + 2, 4), str(i), fill=(255, 255, 0))
        if i < h: d.text((2, pad + i * z + 2), str(i), fill=(255, 255, 0))
    im.save(path)

if __name__ == "__main__":
    a = np.array(Image.open(sys.argv[1]).convert("RGBA")); k = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    zoom(a[::k, ::k], sys.argv[2])
