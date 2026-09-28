"""Geolite - iconos de logros para Steamworks (64x64 JPG, conseguido y sin conseguir).

Lee docs/steam/achievements.json (node tools/steam-achievements.mjs) y compone cada insignia igual que el
juego (css/premium.css: marco de la categoria a tamano completo + icono al 52 % centrado); la version
bloqueada es la del juego: escala de grises y brillo al 60 %.

    python tools/steam_icons.py
"""
import json
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "assets" / "icons"
OUT = ROOT / "docs" / "steam" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
SIZE, WORK = 64, 512
BG = (26, 22, 18)                                   # fondo oscuro de la mesa: Steam no admite transparencia en JPG


def badge(frame: str, icon: str) -> Image.Image:
    img = Image.new("RGBA", (WORK, WORK), BG + (255,))
    base = Image.open(ICONS / f"{frame}.webp").convert("RGBA").resize((WORK, WORK), Image.LANCZOS)
    img.alpha_composite(base)
    inner = int(WORK * 0.52)
    ic = Image.open(ICONS / f"{icon}.webp").convert("RGBA").resize((inner, inner), Image.LANCZOS)
    img.alpha_composite(ic, (int(WORK * 0.24), int(WORK * 0.24)))
    return img.convert("RGB")


rows = json.loads((ROOT / "docs" / "steam" / "achievements.json").read_text(encoding="utf-8"))
for r in rows:
    got = badge(r["frame"], r["icon"]).resize((SIZE, SIZE), Image.LANCZOS)
    got.save(OUT / f"{r['id']}.jpg", quality=92)
    locked = ImageEnhance.Brightness(got.convert("L").convert("RGB")).enhance(0.6)
    locked.save(OUT / f"{r['id']}_locked.jpg", quality=92)
print(f"{len(rows)} logros -> {OUT} ({len(rows) * 2} iconos)")
