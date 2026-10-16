---
'@spectrum-charts/react-spectrum-charts': patch
'@spectrum-charts/react-spectrum-charts-s2': patch
---

`copy()` now writes to the clipboard in browsers that need the write to start inside the click, such as Safari. It passes the image to the clipboard as a pending promise.
