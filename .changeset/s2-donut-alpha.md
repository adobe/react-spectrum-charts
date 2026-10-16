---
'@spectrum-charts/react-spectrum-charts-s2': minor
---

S2 Donut is now an alpha component. `Donut`, `DonutSummary`, and `SegmentLabel` are exported from `@spectrum-charts/react-spectrum-charts-s2` and no longer from the `pre-alpha` subpath. Update imports:

```diff
- import { Donut, DonutSummary, SegmentLabel } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
+ import { Donut, DonutSummary, SegmentLabel } from '@spectrum-charts/react-spectrum-charts-s2';
```

Alpha components now show their stage: an `@alpha` tag in their documentation comment, an Alpha badge in Storybook, and an Alpha badge in the docs.
