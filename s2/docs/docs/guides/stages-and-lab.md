# Stages and lab

Each component has a stage. The stage tells you how much its API and visuals may still change. Components that aren't stable are exempt from semver, even after the package reaches 1.0.

| Stage | What it means |
| --- | --- |
| **Lab** | Usable, but has no finalized Spectrum 2 design and no commitment to graduate. Can change in any release. Imported from `@spectrum-charts/react-spectrum-charts-s2/lab`. |
| **Alpha** | The Spectrum 2 design is finalized and the core features are implemented. Breaking changes can still happen. Animation and accessibility support are in progress. |
| **Beta** | The planned features are complete. Breaking API changes are avoided, and any that are needed are called out in the changelog. Animation and accessibility are complete. |
| **RC** (release candidate) | Feature freeze. The component is validated in consumer environments, and only blocking issues are fixed. |
| **Stable** | Production ready. Follows semver. |

## Current stages

| Stage | Components |
| --- | --- |
| Lab | [Area](/react-spectrum-charts/s2/docs/docs/area), [Bullet](/react-spectrum-charts/s2/docs/docs/bullet), [ChartActionBar](/react-spectrum-charts/s2/docs/docs/chart-action-bar), [Combo](/react-spectrum-charts/s2/docs/docs/combo), [Scatter](/react-spectrum-charts/s2/docs/docs/scatter), [ScatterAnnotation](/react-spectrum-charts/s2/docs/docs/scatter#scatterannotation), [ScatterPath](/react-spectrum-charts/s2/docs/docs/scatter#scatterpath), [Trendline](/react-spectrum-charts/s2/docs/docs/scatter#trendline), [TrendlineAnnotation](/react-spectrum-charts/s2/docs/docs/scatter#trendlineannotation) |
| Alpha | [Chart](/react-spectrum-charts/s2/docs/docs/chart), [Line](/react-spectrum-charts/s2/docs/docs/line), [Bar](/react-spectrum-charts/s2/docs/docs/bar), [Donut](/react-spectrum-charts/s2/docs/docs/donut), [DonutSummary](/react-spectrum-charts/s2/docs/docs/donut#donutsummary), [SegmentLabel](/react-spectrum-charts/s2/docs/docs/donut#segmentlabel), [Axis](/react-spectrum-charts/s2/docs/docs/axis), [AxisThumbnail](/react-spectrum-charts/s2/docs/docs/axis#axisthumbnail), [ReferenceLine](/react-spectrum-charts/s2/docs/docs/axis#referenceline), [Legend](/react-spectrum-charts/s2/docs/docs/legend), [Title](/react-spectrum-charts/s2/docs/docs/title), [ChartInspect](/react-spectrum-charts/s2/docs/docs/interaction#chartinspect), [ChartPopover](/react-spectrum-charts/s2/docs/docs/interaction#chartpopover), [LineDirectLabel](/react-spectrum-charts/s2/docs/docs/line#linedirectlabel), [LineForecast](/react-spectrum-charts/s2/docs/docs/line#lineforecast), [BarDirectLabel](/react-spectrum-charts/s2/docs/docs/bar#bardirectlabel) |

## Lab

Every new chart type starts in lab. Lab components work, but their API and styling may change once a Spectrum 2 design exists.

Import them from `@spectrum-charts/react-spectrum-charts-s2/lab`, so their status is visible in your code. Everything else, including `Chart` and `Axis`, comes from `@spectrum-charts/react-spectrum-charts-s2`:

```tsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter, ScatterPath } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={data}>
  <Axis position="bottom" />
  <Axis position="left" />
  <Scatter dimension="x" metric="y" color="series">
    <ScatterPath groupBy={['series']} />
  </Scatter>
</Chart>;
```

-   **Proposing one.** Anyone can open an issue or pull request for a new chart type. Maintainers decide whether it fits the library.
-   **Graduating.** A lab component moves to alpha once it has a finalized design and the maintainers commit to it. It's then exported from the main entry.
-   **Removal.** A lab component can be removed if it doesn't fit the project's goals and its usage is low. Removals are announced in the changelog.

If you use a lab component, [open an issue](https://github.com/adobe/react-spectrum-charts/issues) with your use case, bugs, or requests. Feedback shapes the component before it graduates.

## Release candidate period

RC confirms a component works in real apps; it isn't for adding features. Feature requests that come in during RC are scheduled after the stable release.

-   The first component to reach stable, which takes the package to 1.0, has a 3-week RC period. Later components have 1–2 weeks.
-   The period restarts when a blocking issue is found and fixed. Blocking issues are incorrect rendering, crashes, accessibility failures, and API defects that couldn't be fixed after stable without a breaking change.
-   Other bugs become known issues, fixed in patch releases after stable.

## How to tell a component's stage

-   **In your editor.** The component's documentation comment has an `@experimental` (lab), `@alpha`, or `@beta` tag. Release candidates use `@beta` and say "Release candidate." Stable components have no tag.
-   **In these docs and in Storybook.** Component pages and stories show a stage badge.
-   **In the changelog.** Stage changes are announced in the release notes.
