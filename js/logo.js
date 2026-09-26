/*
 * Vault Raiders - logo vectorial (recreacion del logotipo del estudio).
 * Si existe assets/vault-raiders.png se usa ese archivo original; si no, este dibujo.
 * Cada letra es un path (evenodd) para poder animarlas una a una.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const FILL = "#fdf5fd", LINE = "#e9c4f4";
  /* [clase, path]; los agujeros van en el mismo path (evenodd) */
  const CIRCLE = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;
  A.VR_LETTERS = [
    ["big", "M12 5 L68 5 Q72 5 72 10 L68 128 Q68 140 76 155 L140 270 L206 150 Q216 132 216 122 L214 10 Q214 5 220 5 L272 5 Q278 5 278 12 L280 128 Q280 136 274 148 L176 335 Q172 342 164 342 L120 342 Q112 342 108 335 L8 135 Q4 128 5 120 L8 12 Q8 5 12 5 Z"],
    ["big", "M228 341 Q212 341 222 310 Q250 240 310 140 Q335 104 385 103 Q440 104 468 143 L472 116 Q474 110 480 112 L520 123 Q526 125 525 132 L514 210 L520 336 Q520 343 512 343 L478 345 Q468 345 465 334 L462 312 Q440 332 418 341 Q408 343 380 343 Z " + CIRCLE(388, 190, 52, 56)],
    ["big", "M548 116 L590 116 Q600 116 598 128 L592 190 Q590 255 648 259 Q690 245 698 218 L698 122 Q698 115 706 115 L750 115 Q757 115 757 124 L757 335 Q757 342 748 342 L708 342 Q698 342 696 332 L696 306 Q650 345 610 344 Q548 340 538 260 Q530 190 540 125 Q542 116 548 116 Z"],
    ["big", "M792 5 Q784 5 784 12 L788 335 Q788 342 796 342 L836 342 Q844 342 843 334 L846 12 Q846 5 838 5 Z"],
    ["big", "M877 32 Q868 30 868 42 L868 290 Q870 340 920 343 Q960 343 990 335 Q994 332 993 322 L995 296 Q994 291 988 292 Q950 300 935 296 Q922 290 922 270 L922 163 L985 165 Q992 165 991 156 L992 122 Q992 115 984 115 L925 115 L927 52 Q928 43 920 41 Z"],
    ["small", "M155 480 Q148 474 148 486 L152 600 Q152 606 160 606 L182 606 Q188 606 188 598 L186 520 Q190 508 205 505 Q225 505 232 510 Q234 508 234 490 L232 474 Q232 470 226 471 Q200 468 182 488 L180 478 Q180 471 172 472 Z"],
    ["small", "M300 467 Q378 469 378 540 L376 590 Q376 600 384 601 L380 605 L358 607 Q350 607 348 592 Q330 607 305 606 Q240 598 236 535 Q240 470 300 467 Z " + CIRCLE(307, 536, 36, 40)],
    ["small", "M398 482 Q398 474 408 474 L432 473 Q437 473 437 480 L434 600 Q434 606 426 606 L406 606 Q400 606 400 598 Z " + CIRCLE(418, 438, 20, 19)],
    ["small", "M562 412 Q560 406 590 408 L596 412 L596 596 Q596 606 588 606 L570 606 Q562 606 562 598 L560 588 Q535 610 505 604 Q452 592 452 538 Q454 470 510 466 Q540 466 560 488 Z " + CIRCLE(521, 538, 36, 41)],
    ["small", "M672 466 Q736 466 738 530 Q738 545 726 548 L642 553 Q652 578 682 578 Q700 578 718 564 L734 592 Q712 607 675 606 Q610 600 608 540 Q610 470 672 466 Z M642 528 Q645 494 672 494 Q698 494 702 522 Q672 530 642 528 Z"],
    ["small", "M755 480 Q748 474 748 486 L752 600 Q752 606 760 606 L782 606 Q788 606 788 598 L786 520 Q790 508 805 505 Q825 505 832 510 Q834 508 834 490 L832 474 Q832 470 826 471 Q800 468 782 488 L780 478 Q780 471 772 472 Z"],
    ["small", "M886 468 Q895 466 898 476 L903 494 Q895 496 890 490 Q878 484 868 490 Q862 498 872 505 Q912 520 912 555 Q912 604 862 608 Q846 610 846 592 L846 585 Q850 578 858 580 Q870 583 880 578 Q884 570 878 565 Q838 545 838 512 Q840 470 886 468 Z"],
  ];

  /* construye el SVG del logo dentro de `host`. animated: cada letra con retardo propio (--i) */
  A.buildLogo = (host, { animated = false, className = "vr-logo" } = {}) => {
    const NS = "http://www.w3.org/2000/svg", el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = el("svg", { viewBox: "-6 -6 1012 626", class: className, "aria-label": "Vault Raiders", role: "img" });
    const g = el("g", { fill: animated ? "url(#vrFill)" : FILL, stroke: LINE, "stroke-width": "4", "stroke-linejoin": "round", "fill-rule": "evenodd" });
    if (animated) {                                                  // degradado metalico + un brillo suave que solo recorre las letras (recortado a su forma)
      const defs = el("defs"), fill = el("linearGradient", { id: "vrFill", x1: "0", y1: "0", x2: "0", y2: "1" });
      [["0", "#fdf7ff"], [".5", "#e6cdf6"], ["1", "#c39cdf"]].forEach(([o, c]) => fill.appendChild(el("stop", { offset: o, "stop-color": c })));
      const shine = el("linearGradient", { id: "vrShine", x1: "0", y1: "0", x2: "1", y2: "0" });
      [["0", "#ffd6ff", "0"], [".38", "#ffc978", ".7"], [".5", "#fff", "1"], [".62", "#ffc978", ".7"], ["1", "#ffd6ff", "0"]].forEach(([o, c, a]) => shine.appendChild(el("stop", { offset: o, "stop-color": c, "stop-opacity": a })));
      const clip = el("clipPath", { id: "vrClip" }); A.VR_LETTERS.forEach(([, d]) => clip.appendChild(el("path", { d, "clip-rule": "evenodd" })));
      defs.append(fill, shine, clip); svg.appendChild(defs);
    }
    A.VR_LETTERS.forEach(([size, d], i) => {
      const p = el("path", { d, class: "vr-l vr-" + size });
      if (animated) p.style.setProperty("--i", size === "big" ? i : i - 5);
      g.appendChild(p);
    });
    svg.appendChild(g);
    if (animated) { const sg = el("g", { "clip-path": "url(#vrClip)" }); sg.appendChild(el("rect", { x: "0", y: "-20", width: "230", height: "660", fill: "url(#vrShine)", class: "vr-shine" })); svg.appendChild(sg); }
    host.appendChild(svg);
    // si el archivo original esta disponible, sustituye el dibujo (se comprueba una sola vez)
    A._vrProbe = A._vrProbe || new Promise(res => { const i = new Image(); i.onload = () => res(i.src); i.onerror = () => res(null); i.src = "assets/vault-raiders.png"; });
    A._vrProbe.then(src => { if (!src || !svg.isConnected) return; const im = document.createElement("img"); im.src = src; im.alt = "Vault Raiders"; im.className = className + " vr-img"; svg.replaceWith(im); host.style.setProperty("--vr-url", `url(${src})`); host.classList.add("has-png"); });
    return svg;
  };
})(window.AIQ);
