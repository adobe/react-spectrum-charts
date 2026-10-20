---
'@spectrum-charts/themes': minor
'@adobe/react-spectrum-charts': minor
---

S2 legends positioned at the bottom or top are now left-aligned (`align: 'start'`) by default instead of centered. This also applies to S1 charts using the `s2` prop; S1 charts without it are unchanged. Pass `align="middle"` to keep the previous centered layout.
