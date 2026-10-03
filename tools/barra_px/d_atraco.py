"""Atraco: la bolsa roja de doblones del juego (purse) con antifaz de ladron y los ojos mirando de reojo; las cintas del antifaz al viento."""
import numpy as np
from dk import *

def purse_txt():
    """la bolsa del juego (assets/icons/purse.webp) pasada a rejilla de texto, sin su contorno exterior"""
    import tempfile
    from PIL import Image
    from grid import dump
    p = Path(tempfile.gettempdir()) / "geolite_purse.txt"
    dump(np.array(Image.open(Path(__file__).resolve().parent.parent.parent / "assets" / "icons" / "purse.webp").convert("RGBA"))[::8, ::8].copy(), p)
    return p

def load(path):
    txt = open(path).read().split("\n\n", 1)
    pal = txt[0].strip(); rows = [r for r in txt[1].splitlines() if r.strip() or len(r) == 48]
    g = G()
    for y, r in enumerate(rows[:48]):
        for x, ch in enumerate(r[:48]):
            if ch != ".": g.put(x, y, ch)
    return g, pal

def build(path):
    g, pal = load(purse_txt())
    # fuera la estrella: el cuerpo de la bolsa se repinta con su luz (claro arriba-izq, sombra abajo-dcha)
    body = np.isin(g.g, list("abcghi#def")) & (YY >= 19) & (YY <= 39) & (XX >= 15) & (XX <= 37)
    star = np.isin(g.g, list("def#i")) & body
    # y el cordon que colgaba a la derecha (por debajo de la lazada)
    star |= np.isin(g.g, list("def#i")) & (YY >= 19) & (YY <= 28) & (XX >= 30) & (XX <= 37)
    edge_r = (XX >= 36) & (YY >= 19) & (YY <= 28) & star
    Lb = light(22.0, 30.0)
    g.mask_paint(star, "a")
    g.mask_paint(star & (Lb > 0.45), "c"); g.mask_paint(star & (Lb < -0.25), "b")
    # antifaz
    lob = ell(17.5, 28.0, 6.0, 3.6) | ell(30.5, 28.0, 6.0, 3.6)
    bridge = (XX >= 21) & (XX <= 26) & (YY >= 26) & (YY <= 28)
    mk = lob | bridge
    ties = poly([(37, 26.2), (44, 22.8), (45.5, 25.2), (38, 28.2)]) | poly([(37, 28.2), (43, 31.5), (41.6, 33.6), (36.4, 29.6)]) | ell(37.0, 27.6, 1.8, 1.9)
    g.mask_paint(dilate(ties, 1, cross=False) & ~ties & (g.g != "."), "#")
    g.mask_paint(ties, "K"); g.mask_paint(ties & (YY <= 25), "L")
    g.mask_paint(dilate(mk, 1, cross=False) & ~mk & (g.g != "."), "#")
    g.mask_paint(mk, "K")
    g.mask_paint(mk & ~shift(mk, 0, 1), "L")                    # arista de arriba con luz
    g.mask_paint(mk & ~shift(mk, 0, 2) & (XX <= 20), "L")
    # ojos de reojo
    for ex in (17.5, 30.5):
        eye = ell(ex, 28.0, 3.4, 2.2)
        g.mask_paint(eye, "w")
        px = int(ex + 1.5)
        g.put(px, 27, "k"); g.put(px, 28, "k"); g.put(px + 1, 27, "k"); g.put(px + 1, 28, "k")
        g.put(int(ex - 2.5), 27, "v"); g.put(int(ex - 2.5), 28, "v")
    pal += """
K=#2e2546
L=#5a4f80
w=#ffffff
v=#c8c8dc
k=#1d0a3d"""
    g.write(path, pal, "keepdark")

if __name__ == "__main__":
    build("g/pz_atraco.txt")
