#!/usr/bin/env python3
"""Geolite - pixelizador (solo desarrollo). Convierte una ilustracion generada (suave, con degradados) en PIXEL ART de verdad:
rejilla nativa baja, paleta limitada sin dither, bordes duros y ampliacion por vecino mas cercano (cada pixel es un cuadrado perfecto).

  from pixelize import pixelize
  pixelize(src, dst, native_w=176, colors=28, scale=4)          # src: jpg/png/webp (con o sin alfa)
"""
from PIL import Image, ImageFilter, ImageEnhance
import sys

def pixelize(src, dst, native_w=176, colors=28, scale=4, alpha_cut=140, sat=1.12, keep_alpha=None, quality=92):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    nh = max(1, round(native_w * h / w))
    rgb = im.convert("RGB")
    a = im.getchannel("A")
    small = rgb.resize((native_w, nh), Image.BOX)
    small = ImageEnhance.Color(small).enhance(sat)
    small = small.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=2))
    q = small.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    asmall = a.resize((native_w, nh), Image.BOX).point(lambda v: 255 if v >= alpha_cut else 0)
    out = q.convert("RGBA"); out.putalpha(asmall)
    out = out.resize((native_w * scale, nh * scale), Image.NEAREST)
    if str(dst).endswith(".webp"): out.save(dst, "WEBP", lossless=True, method=6)
    else: out.save(dst)
    return out.size

if __name__ == "__main__":
    print(pixelize(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 176, int(sys.argv[4]) if len(sys.argv) > 4 else 28, int(sys.argv[5]) if len(sys.argv) > 5 else 4))
