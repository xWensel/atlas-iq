#!/usr/bin/env python3
"""Geolite - Don Crupier: GIF de revision de cada expresion y cada gesto (solo desarrollo).
Reproduce en Python lo que hace js/crupier.js (bucle, respiracion, parpadeo, habla, gestos) sobre los datos de js/crupier-data.js.

  python tools/crupier/preview.py DIR [k]   -> DIR/expr_<id>.gif y DIR/gest_<id>.gif (k = escala, 3 por defecto)
"""
import sys, json, re, io, base64, random
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from px import ROOT
from build import pose_img

def load():
    js = (ROOT / "js" / "crupier-data.js").read_text(encoding="utf-8")
    i = js.index("CRUPIER_DATA = ") + 15; d = json.loads(js[i: js.rstrip().rindex(";")])
    atlas = np.array(Image.open(io.BytesIO(base64.b64decode(d["atlas"].split(",", 1)[1]))).convert("RGBA"))
    return d, atlas

BASE = dict(e="open", r=None, l=0, m="smirk", s=0, b=[0, 0], h=[0, 0], t=[0, 0], c=[0, 0], f=[0, 0], g=None, x=None)
BLINK = {"open": ["half", "closed", "half"], "half": ["closed"], "angry": ["closed"], "sad": ["closed"], "squint": ["closed"], "sleepy": ["closed"]}

def merge(*ps):
    o = dict(BASE)
    for p in ps:
        if p:
            for k, v in p.items(): o[k] = v
    return o

def pose(E, t, talk_on=False, syl=0, since_syl=0, gest=None, gt=0, blink_at=None):
    p = merge(E["base"])
    if E.get("idle"):
        tot = sum(f[1] for f in E["idle"]); tt = t % tot
        for f in E["idle"]:
            if tt < f[1]: p = merge(p, f[0]); break
            tt -= f[1]
    if E.get("breath", 1300) is not False:
        if (t // (E.get("breath") or 1300)) % 2:
            p["h"] = [p["h"][0], p["h"][1] + 1]; p["c"] = [p["c"][0], p["c"][1] + 1]; p["f"] = [p["f"][0], p["f"][1] + 1]
    lock = False
    if gest:
        acc = 0
        for f in gest["frames"]:
            if gt < acc + f[1]: p = merge(p, f[0]); break
            acc += f[1]
        lock = gest.get("lockMouth")
    if talk_on and not lock:
        T = E.get("talk") or ["talk1", "talk2"]
        if since_syl < 190:
            p["m"] = T[syl % len(T)]
            if re.search("talk3|laugh|yawn", p["m"]): p["s"] = min(p["s"], -1)
        else: p["m"] = E.get("rest") or E["base"].get("m", "smirk")
    if E.get("blink", True) is not False and not gest and blink_at is not None and p["e"] in BLINK:
        i = (t - blink_at) // 55; seq = BLINK[p["e"]]
        if 0 <= i < len(seq):
            p["e"] = seq[i]
            if p.get("r"): p["r"] = seq[i]
    return p

def gif(frames, path, k, step):
    ims = [Image.fromarray(f, "RGBA").resize((128 * k, 128 * k), Image.NEAREST) for f in frames]
    bg = (38, 30, 58, 255); out = []
    for im in ims:
        b = Image.new("RGBA", im.size, bg); b.alpha_composite(im); out.append(b.convert("P", palette=Image.ADAPTIVE, colors=64))
    out[0].save(path, save_all=True, append_images=out[1:], duration=step, loop=0, disposal=2)

def main():
    d, atlas = load(); out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True); k = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    step = 50
    for eid, E in d["expr"].items():
        frames = []; cache = {}
        for t in range(0, 4800, step):
            talk = 1200 <= t < 3000; syl = (t - 1200) // 70
            p = pose(E, t, talk, syl, 0 if talk else 999, blink_at=3400)
            key = json.dumps(p, sort_keys=True)
            if key not in cache: cache[key] = pose_img(p, d["parts"], atlas)
            frames.append(cache[key])
        gif(frames, out / f"expr_{eid}.gif", k, step)
    for gid, G in d["gest"].items():
        tot = sum(f[1] for f in G["frames"]); frames = []
        for t in range(0, tot + 400, step):
            p = pose(d["expr"]["sly"], 0, gest=G if t < tot else None, gt=t)
            frames.append(pose_img(p, d["parts"], atlas))
        gif(frames, out / f"gest_{gid}.gif", k, step)
    print("hecho", out)

if __name__ == "__main__":
    main()
