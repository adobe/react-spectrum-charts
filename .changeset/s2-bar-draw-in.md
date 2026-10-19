---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
'@spectrum-charts/core-s2': minor
---

S2 charts draw in by default, bars now draw in, and S2 animation timing follows Spectrum 2 motion.

- `animationTypes` now defaults to `['hover', 'drawIn']`, so lines, bars, and donuts draw in. Set `animationTypes={['hover']}` to turn off draw-in only, or `animations={false}` to turn off all animations.
- Bars grow from the baseline. Stacked segments fill in order, and direct labels and annotations fade in once their own bar finishes.
- Draw-in durations: line 850ms, bar 700ms, donut 750ms. Charts with more than one mark type finish together.
- Draw-in and hover use the Spectrum 2 ease-in-out curve. Hover fades take 150ms.
- Draw-in labels fade in over 50ms.
- Users who prefer reduced motion now get hover fades; previously all animation was turned off for them. Draw-in is still skipped.
