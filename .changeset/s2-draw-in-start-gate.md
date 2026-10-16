---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/core-s2': patch
---

S2 draw-in starts more smoothly.

- On first paint a drawing-in chart fades in over 150ms with the Spectrum 2 ease-out curve instead of appearing abruptly.
- Draw-in waits up to 300ms for the page to render frames on time, so it no longer stutters while other content loads.
