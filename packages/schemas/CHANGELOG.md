# @spectrum-charts/schemas

## 2.1.0

### Minor Changes

- 88c036c: Require Node `>=22.12.0`. The `vega-lite` peer dependency (`^6.4.2`) now resolves to versions that require Node 22.12, so installs on Node 20 fail with strict engine checks.

## 2.0.0

### Major Changes

- 7363290: Ship `@spectrum-charts/schemas` as ES modules only (`"type": "module"` with an `exports` map). `require()`, the UMD global, and deep imports into `dist/` are no longer supported. Requires Node `>=20.19.0`.
