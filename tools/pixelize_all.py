#!/usr/bin/env python3
"""Geolite - convierte TODO el arte generado a pixel art nitido (solo desarrollo).
Parte de los originales de assets/raw (jpg) y, con tools/pixelize.py, los baja a una rejilla nativa baja, limita la paleta (sin degradados ni dither),
recorta el alfa a 1 bit y amplia por vecino mas cercano: cada pixel es un cuadrado perfecto.

  python tools/pixelize_all.py --stage        escribe en assets_stage/ (para revisar) y crea hojas comparativas
  python tools/pixelize_all.py --apply        copia assets_stage/ sobre assets/
  python tools/pixelize_all.py id1 id2 ...    solo esos ids (con --stage)
Ajustes por id en OVR: (nativo, colores, escala).
"""
import sys, shutil, glob, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from keyout import keyout
from pixelize import pixelize
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"; ICONS = ROOT / "assets" / "icons"; GEN = ROOT / "assets" / "gen"
STAGE = ROOT / "assets_stage"; SI = STAGE / "icons"; SG = STAGE / "gen"

ICON = (64, 28, 4)            # nativo 64 px -> 256
OVR = {                       # id -> (nativo, colores, escala)
    "dealer_neutral": (128, 36, 4), "dealer_laugh": (128, 36, 4), "dealer_angry": (128, 36, 4), "dealer_shock": (128, 36, 4),
    "shop_bg": (256, 48, 5), "hub_hero": (256, 48, 4),
    "type_person": (96, 32, 5),
}
SCENE = (256, 48, 4)          # nativo 256 de ancho -> 1024
TYPE = (128, 40, 4)           # type_* cuadradas 640 -> 512

def spec(id, kind):
    if id in OVR: return OVR[id]
    if kind == "scene": return TYPE if id.startswith("type_") else SCENE
    return ICON

def run(ids=None):
    SI.mkdir(parents=True, exist_ok=True); SG.mkdir(parents=True, exist_ok=True); tmp = STAGE / "_k.png"
    for kind, folder, out in (("icon", ICONS, SI), ("scene", GEN, SG)):
        for f in sorted(folder.glob("*.webp")):
            id = f.stem
            if ids and id not in ids: continue
            if id.startswith("dealer_"): continue                 # v0.32: el crupier sale de tools/crupier/build.py (pulido a mano); nunca de su jpg
            raw = RAW / f"{id}.jpg"
            if not raw.exists(): print("sin raw", id); continue
            nat, col, k = spec(id, kind)
            try:
                if kind == "icon":
                    keyout(raw, tmp, 512); pixelize(tmp, out / f"{id}.webp", nat, col, k, alpha_cut=120)
                else:
                    pixelize(raw, out / f"{id}.webp", nat, col, k)
            except Exception as e: print("FALLO", id, e)
    if tmp.exists(): tmp.unlink()

def sheets():
    """hojas comparativas: original (izq) y pixelizado (der), 6 iconos por fila"""
    out = STAGE / "sheets"; out.mkdir(exist_ok=True)
    for kind, folder, sf in (("icons", ICONS, SI), ("gen", GEN, SG)):
        ids = sorted(p.stem for p in sf.glob("*.webp")); per = 24 if kind == "icons" else 8; cell = 128 if kind == "icons" else 300
        for n in range(0, len(ids), per):
            chunk = ids[n:n + per]; cols = 4 if kind == "icons" else 2; rows = (len(chunk) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * (cell * 2 + 8), rows * (cell + 14)), (40, 30, 60))
            for i, id in enumerate(chunk):
                x = (i % cols) * (cell * 2 + 8); y = (i // cols) * (cell + 14)
                for j, base in enumerate((folder, sf)):
                    im = Image.open(base / f"{id}.webp").convert("RGBA"); im.thumbnail((cell, cell), Image.NEAREST if j else Image.LANCZOS)
                    sheet.paste(im, (x + j * cell + 2, y), im)
            sheet.save(out / f"{kind}_{n // per:02d}.png")
    print("hojas en", out)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--apply" in sys.argv:
        for kind, sf, dst in (("icons", SI, ICONS), ("gen", SG, GEN)):
            for f in sf.glob("*.webp"): shutil.copy2(f, dst / f.name)
        print("aplicado")
    else:
        run(set(args) or None); sheets()
