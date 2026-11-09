# @spectrum-charts/themes

## 1.53.1

### Patch Changes

- ca1a73a: Spectrum 2 categorical colors now use their dark values when `colorScheme` is `dark`, both as `categorical-*` tokens and in the `s2Categorical` palettes.

## 1.53.0

### Minor Changes

- c70b1c4: Charts using the `s2` prop now left-align top and bottom legends (`align: 'start'`) by default instead of centering them. Charts without the `s2` prop are unchanged. Pass `align="middle"` to keep the centered layout.

### Patch Changes

- Updated dependencies [ba758b4]
  - @spectrum-charts/constants@1.54.0
