---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
'@spectrum-charts/core-s2': minor
---

S2 bars draw in, and S2 animation timing follows Spectrum 2 motion.

- Add `'drawIn'` to the chart's `animationTypes` to grow bars from the baseline. Stacked segments fill in order, and direct labels and annotations fade in once their own bar finishes.
- Draw-in durations: line 850ms, bar 700ms, donut 750ms. Charts with more than one mark type finish together.
- Draw-in and hover use the Spectrum 2 easing curves. Hover fades take 150ms.
- Draw-in labels fade in over 150ms.
- When the user prefers reduced motion, draw-in is skipped but hover fades still run.
