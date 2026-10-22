# Pigment fit for the color wheel (not deployed)

Offline scripts that produced `PIGMENT_DATA` in `color-theory.html`.
Source data: PaintMixing by miciwan (https://github.com/miciwan/PaintMixing),
data CC BY 4.0, code MIT. Clone it, then:

    python3 fit.py      <PaintMixing>/ ks.json                         # K,S per pigment, 400–700 nm @10 nm
    python3 recipes2.py <PaintMixing>/ ks.json model.py recipes.json   # pigment recipe per wheel hue
    python3 export.py   <PaintMixing>/ ks.json model.py recipes.json pigdata.json

Paste `pigdata.json` into `const PIGMENT_DATA = ...` in color-theory.html.
model.py reads PaintMixing's CIE 1931 2° / D65 tables. See
Color-Wheel-App-Reference.md ("The mixing engine") before retuning.
