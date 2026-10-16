---
'@spectrum-charts/react-spectrum-charts-s2': patch
---

S2 draw-in animations play once per chart mount. Re-renders and data updates no longer restart the draw-in; if one happens mid draw-in, the animation continues from where it was. A chart whose data is emptied and then restored draws in again.
