#!/usr/bin/env python3
"""Geolite - genera las escenas de assets/gen/ y los retratos del crupier (tools/hand_scenes.py + tools/scenes_*.py).
  python tools/make_scenes.py [ids...] [--preview hoja.png]"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import hand_scenes as K
import scenes_a, scenes_b, scenes_c, scenes_d  # noqa: F401  (registran sus escenas en K.REG)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--") and not a.endswith(".png")]
    ids = args or list(K.REG); K.build(ids); print(len(ids), "escenas dibujadas")
    if "--preview" in sys.argv: K.preview(ids, sys.argv[sys.argv.index("--preview") + 1])
