#!/usr/bin/env python3
"""Geolite - el icono del jefe del acto: la chistera del crupier (solo desarrollo).
Sale de la capa "hat" del rig (rig.py): los mismos pixeles que su retrato y sus animaciones, chistera lisa con la banda roja.
Se amplia x6 sin suavizar y se centra en 512x512 -> assets/icons/boss_hat.webp (ruta, panel de proxima ronda, ficha roja del jefe).
Si cambia el crupier (master.py / rig.py), se vuelve a generar:  python tools/crupier/chistera.py
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from rig import layers

ROOT = Path(__file__).resolve().parent.parent.parent


def main():
    hat = layers()["hat"]
    ys, xs = np.where(hat[..., 3] > 0)
    img = Image.fromarray(hat).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    k = 6
    big = img.resize((img.size[0] * k, img.size[1] * k), Image.NEAREST)
    out = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    out.alpha_composite(big, ((512 - big.size[0]) // 2, (512 - big.size[1]) // 2))
    dst = ROOT / "assets" / "icons" / "boss_hat.webp"
    out.save(dst, "WEBP", lossless=True, quality=100, method=6)
    print(dst.relative_to(ROOT), img.size, "x", k)


if __name__ == "__main__":
    main()
