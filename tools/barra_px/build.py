#!/usr/bin/env python3
"""Geolite - iconos de la mesa de casino de la Barra, redibujados a limpio sobre la rejilla nativa de 48 px (solo desarrollo).
Mismo metodo que los iconos aceptados de la Barra (Seguro, Cafe doble, Doble o nada, Oferta, Apuesta final): mascaras y rampas de 3-4 tonos
sobre una rejilla de caracteres (dk.py), contorno indigo de 1 px por fuera (grid.py) y salida x8 = 384 px, WebP sin perdida.
NUNCA dibujar estos iconos con formas sueltas a otra rejilla ni sustituirlos por arte generado sin pulir.

  python tools/barra_px/build.py [ids...]     -> assets/icons/<id>.webp  (+ tools/barra_px/z/<id>.png: zoom con reticula para revisar)
ids: bet_red bet_wheel pz_monedas pz_gordo pz_reto pz_atraco pz_reloj pz_nada
La moneda (giro, canto e icono bet_coin) sale de tools/barra_coin.py."""
import sys, os, importlib
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from grid import render, save
from zoom import zoom

ICONS = HERE.parent.parent / "assets" / "icons"
DESIGNS = {"bet_red": "d_red", "bet_wheel": "d_wheel", "pz_monedas": "d_monedas", "pz_gordo": "d_gordo", "pz_reto": "d_reto",
           "pz_atraco": "d_atraco", "pz_reloj": "d_reloj", "pz_nada": "d_nada"}

if __name__ == "__main__":
    ids = sys.argv[1:] or list(DESIGNS)
    (HERE / "g").mkdir(exist_ok=True); (HERE / "z").mkdir(exist_ok=True)
    os.chdir(HERE)
    for i in ids:
        importlib.import_module(DESIGNS[i]).build(f"g/{i}.txt")
        a = render(HERE / "g" / f"{i}.txt"); save(a, ICONS / f"{i}.webp"); zoom(a, HERE / "z" / f"{i}.png")
        print("ok", i)
