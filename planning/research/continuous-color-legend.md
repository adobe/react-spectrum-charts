# Continuous color legend for Line, Bar, and Area

- Status: Ready for RFC
- Date: 2026-10-09
- Issues: #214

## Question

Line, Bar, and Area only support categorical color. A quantitative color field goes into the
ordinal `COLOR_SCALE` and renders as a nominal legend instead of a gradient. What would it
take to support a continuous color legend on these marks?

## Findings

- Scatter already supports this with `colorScaleType: 'linear' | 'ordinal'`
  (`ScatterOptions`). Its `setScales` routes the color facet to `LINEAR_COLOR_SCALE` when
  linear.
- The legend side is already generic: `getFacets` (`legendFacetUtils.ts`) treats any
  `LINEAR_COLOR_SCALE` facet as continuous, and `getContinuousLegend`
  (`legendSpecBuilder.ts`) renders it. No legend changes should be needed.
- The gap is each mark's scale wiring, and it differs by mark:
  - **Line** has no stacking, so it's closest to Scatter's approach: route the stroke color
    through the linear scale.
  - **Bar** groups by color categorically for stacking and dodging (`getStackFields`,
    `getDodgeGroupTransform`). A continuous field can't form discrete stack or dodge
    segments.
  - **Area** groups series by color (`groupby: color` in `areaSpecBuilder.ts`), with the
    same problem.
- S2's bar, area, and line builders would need the same option.
- Cross-cutting: adds use of an existing scale (`LINEAR_COLOR_SCALE`) to three marks and
  needs S1/S2 parity. No hover, highlight, legend-interaction, or tooltip changes expected.

## Options

1. Add `colorScaleType` to all three marks, and disallow (or document as unsupported) linear
   color with stacked/dodged Bar and with Area.
2. Line only first, since it follows Scatter's precedent; Bar and Area later once their
   behavior is designed.
3. Define real continuous-color semantics for Bar and Area (e.g. color per bar or per point
   rather than per group).

## Recommendation

Write an RFC that settles:

- What continuous color means for stacked/dodged Bar and for Area, or whether those
  combinations are unsupported.
- Whether `colorScaleType` becomes one shared type rather than being redefined per mark.
- How null color values fall back with a linear scale (match ordinal null handling).
