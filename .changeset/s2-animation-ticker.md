---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
'@spectrum-charts/core-s2': minor
---

S2 animations run on a shared on-demand ticker instead of each chart's always-on Vega timer.

- Idle charts do no animation work; off-screen charts pause.
- Animations run at the display's native refresh rate, within an 8ms per-frame budget across charts.
- Draw-in starts on the first painted frame, so slow mounts no longer skip most of the animation.
- Add `yarn perf:animation` to benchmark draw-in, hover and idle cost in Storybook.
