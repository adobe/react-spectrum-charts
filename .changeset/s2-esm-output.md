---
'@spectrum-charts/schemas': major
---

Ship `@spectrum-charts/schemas` as ES modules only (`"type": "module"` with an `exports` map). `require()`, the UMD global, and deep imports into `dist/` are no longer supported. Requires Node `>=20.19.0`.
