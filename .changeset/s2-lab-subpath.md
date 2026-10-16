---
'@spectrum-charts/react-spectrum-charts-s2': minor
---

The S2 `pre-alpha` subpath is renamed `lab`. `Area`, `Bullet`, `Combo`, `Scatter`, `ScatterAnnotation`, `ScatterPath`, `Trendline`, and `TrendlineAnnotation` are now lab components, imported from `@spectrum-charts/react-spectrum-charts-s2/lab`. The `pre-alpha` subpath is removed. Update imports:

```diff
- import { Scatter, ScatterPath } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
+ import { Scatter, ScatterPath } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```
