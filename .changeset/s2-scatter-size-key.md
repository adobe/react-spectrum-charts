---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

New lab `ScatterSizeKey` component explains point sizes when `Scatter`'s `size` is a data field: the smallest, middle, and largest values drawn at their true size, with their own `title`, a `position`, and a `direction` (vertical on the left or right, horizontal on the top or bottom). It sits after the `Legend`.

`Legend` no longer shows a size legend for `Scatter`; add `ScatterSizeKey` inside `Scatter` instead:

```diff
- <Scatter size="revenue" />
- <Legend title="Revenue" />
+ <Scatter size="revenue">
+   <ScatterSizeKey title="Revenue" />
+ </Scatter>
```
