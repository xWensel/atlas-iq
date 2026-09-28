"""Geolite - iconos de logros para Steamworks (64x64 JPG, conseguido y sin conseguir) + vista previa grande.

Lee docs/steam/achievements.json (node tools/steam-achievements.mjs) y compone cada insignia igual que el
juego (css/premium.css .ic.badge): ficha del color de su modo a tamano completo + la ilustracion propia del
logro (assets/icons/ach_<id>.webp, tools/gen_art.py) al 72 % y centrada, un poco por encima del canto.
La version bloqueada es la del juego: escala de grises y brillo al 60 %.

    python tools/steam_icons.py      -> docs/steam/icons/<id>.jpg, <id>_locked.jpg (64 px) y preview/<id>.png (256 px)
"""
import json
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "assets" / "icons"
OUT = ROOT / "docs" / "steam" / "icons"
PREV = OUT / "preview"
OUT.mkdir(parents=True, exist_ok=True); PREV.mkdir(parents=True, exist_ok=True)
SIZE, WORK, INNER = 64, 512, 0.72
BG = (26, 22, 18)                                   # fondo oscuro de la mesa: Steam no admite transparencia en JPG


def badge(frame: str, icon: str, bg=True) -> Image.Image:
    img = Image.new("RGBA", (WORK, WORK), (BG + (255,)) if bg else (0, 0, 0, 0))
    base = Image.open(ICONS / f"{frame}.webp").convert("RGBA").resize((WORK, WORK), Image.LANCZOS)
    img.alpha_composite(base)
    inner = int(WORK * INNER); off = (WORK - inner) // 2
    ic = Image.open(ICONS / f"{icon}.webp").convert("RGBA").resize((inner, inner), Image.LANCZOS)
    img.alpha_composite(ic, (off, off))
    return img


rows = json.loads((ROOT / "docs" / "steam" / "achievements.json").read_text(encoding="utf-8"))
for r in rows:
    big = badge(r["frame"], r["icon"])
    got = big.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    got.save(OUT / f"{r['id']}.jpg", quality=92)
    locked = ImageEnhance.Brightness(got.convert("L").convert("RGB")).enhance(0.6)
    locked.save(OUT / f"{r['id']}_locked.jpg", quality=92)
    badge(r["frame"], r["icon"], bg=False).resize((256, 256), Image.LANCZOS).save(PREV / f"{r['id']}.png")
print(f"{len(rows)} logros -> {OUT} ({len(rows) * 2} iconos de 64 px + vista previa de 256 px)")
