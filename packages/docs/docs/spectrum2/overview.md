---
sidebar_position: 1
---

# Spectrum 2 Overview

:::caution Work in progress
Spectrum 2 support in React Spectrum Charts is actively under development. The S2 package still has some Spectrum 1 dependencies that are being incrementally migrated. We will make an effort not to introduce breaking API changes to Spectrum 2 features prior to **Adobe Summit**.
:::

React Spectrum Charts offers two paths for Spectrum 2 support. This page explains the difference between them, how to install the full S2 package, and how theming works.

## S2 prop vs. the S2 package

### `s2` prop (partial S2 support)

The `@adobe/react-spectrum-charts` package includes an `s2` prop on the `Chart` component. When set to `true`, it enables Spectrum 2 styling for **supported chart types**. Currently supported: **Line**, **Bar**, and **Donut**.

```jsx
import { Chart, Bar } from '@adobe/react-spectrum-charts';

<Chart data={data} s2>
  <Bar color="series" />
</Chart>
```

Use this approach if you are already using `@adobe/react-spectrum-charts` and only need S2 theming for supported chart types.

### `@spectrum-charts/react-spectrum-charts-s2` package (full S2 support)

The S2 package is a **separate alpha package** built entirely on Spectrum 2. It provides a full S2-native implementation of the chart library with additional features not available in the base package. All components are imported from this package instead of `@adobe/react-spectrum-charts`.

Use this approach when you need access to S2-exclusive features such as line gradients, line labels, line interpolation, or S2 reference lines.

---

## Installing the S2 package

The S2 package is published under the `alpha` tag on npm.

```bash
npm install @spectrum-charts/react-spectrum-charts-s2@alpha
# or
yarn add @spectrum-charts/react-spectrum-charts-s2@alpha
```

Import components from the S2 package instead of the base package:

```jsx
import { Chart, Axis, Line, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
```

The S2 package requires `@adobe/react-spectrum` as a peer dependency for its popover and tooltip components:

```bash
npm install @adobe/react-spectrum
```

---

## Theming

### Color scheme

The `Chart` component accepts a `colorScheme` prop to switch between light and dark mode. This controls both the chart's visual theme and the styling of tooltips and popovers.

```jsx
<Chart data={data} colorScheme="dark">
  <Line color="series" />
</Chart>
```

| Value | Description |
|-------|-------------|
| `'light'` | Light mode (default) |
| `'dark'` | Dark mode |

### Colors

The S2 package uses Spectrum 2 categorical color scales by default. You can override the color scale using the `colors` prop on `Chart`.

Available S2 color scales: `s2Categorical6`, `s2Categorical12`, `s2Categorical16`, `s2Categorical20`.

```jsx
<Chart data={data} colors="s2Categorical12">
  <Line color="series" />
</Chart>
```

### Inspect panels

Inspect panels in the S2 package are styled automatically to match the Spectrum 2 design specification — including the correct font (`adobe-clean`), text colors, border, and elevated box shadow. No additional configuration is required.

Add a `ChartInspect` as a child of a mark component to enable inspect panels:

```jsx
<Line color="series">
  <ChartInspect>
    {(datum) => (
      <div>
        <div>Series: {datum.series}</div>
        <div>Value: {datum.value}</div>
      </div>
    )}
  </ChartInspect>
</Line>
```

### Popovers

Popovers are styled to match the Spectrum 2 elevated surface style (border, box shadow, font). Add a `ChartPopover` as a child of a mark component to enable click-to-open popovers:

```jsx
<Line color="series">
  <ChartPopover width={200}>
    {(datum, close) => (
      <div>
        <div>Series: {datum.series}</div>
        <div>Value: {datum.value}</div>
        <button onClick={close}>Close</button>
      </div>
    )}
  </ChartPopover>
</Line>
```

#### ChartInspect props

<table>
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>children</td>
            <td>(datum: Datum) =&gt; ReactNode</td>
            <td>–</td>
            <td>Callback that returns the content to render inside the inspect panel.</td>
        </tr>
        <tr>
            <td>excludeDataKeys</td>
            <td>string[]</td>
            <td>–</td>
            <td>Keys in the data that, if they have truthy values, will suppress the inspect panel for that data point.</td>
        </tr>
        <tr>
            <td>highlightBy</td>
            <td>'series' | 'dimension' | 'item' | string[]</td>
            <td>'item'</td>
            <td>Controls which marks are highlighted when an inspect panel is visible.</td>
        </tr>
        <tr>
            <td>targets</td>
            <td>('dimensionArea' | 'item')[]</td>
            <td>['item']</td>
            <td>The hit targets that trigger the inspect panel.</td>
        </tr>
    </tbody>
</table>

#### ChartPopover props

<table>
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>children</td>
            <td>(datum: Datum, close: () =&gt; void) =&gt; ReactNode</td>
            <td>–</td>
            <td>Callback that returns the content to render inside the popover. The second argument is a function that closes the popover.</td>
        </tr>
        <tr>
            <td>width</td>
            <td>number | 'auto'</td>
            <td>250</td>
            <td>Width of the popover in pixels, or <code>'auto'</code> to size to content.</td>
        </tr>
        <tr>
            <td>minWidth</td>
            <td>number</td>
            <td>0</td>
            <td>Minimum width of the popover in pixels.</td>
        </tr>
        <tr>
            <td>maxWidth</td>
            <td>number</td>
            <td>–</td>
            <td>Maximum width of the popover in pixels.</td>
        </tr>
        <tr>
            <td>height</td>
            <td>number | 'auto'</td>
            <td>–</td>
            <td>Height of the popover in pixels.</td>
        </tr>
        <tr>
            <td>minHeight</td>
            <td>number</td>
            <td>–</td>
            <td>Minimum height of the popover in pixels.</td>
        </tr>
        <tr>
            <td>maxHeight</td>
            <td>number</td>
            <td>–</td>
            <td>Maximum height of the popover in pixels.</td>
        </tr>
        <tr>
            <td>contentMargin</td>
            <td>number</td>
            <td>12</td>
            <td>Inner margin applied around the popover content in pixels.</td>
        </tr>
        <tr>
            <td>onOpenChange</td>
            <td>(isOpen: boolean) =&gt; void</td>
            <td>–</td>
            <td>Callback fired when the popover opens or closes.</td>
        </tr>
        <tr>
            <td>rightClick</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, the popover opens on right-click instead of left-click.</td>
        </tr>
        <tr>
            <td>containerPadding</td>
            <td>number</td>
            <td>12</td>
            <td>Minimum distance between the popover and the edges of its container.</td>
        </tr>
    </tbody>
</table>

---

## Accessible keyboard navigation

:::note Experimental
Accessible keyboard navigation is an experimental feature and currently supports **Line** and **Bar** only.
:::

Set `accessibleNavigation` on `Chart` to enable keyboard navigation of a supported mark's data points, driven by [data-navigator](https://www.npmjs.com/package/data-navigator). Focused points render a focus ring, and any `ChartInspect` or `ChartPopover` child on the mark follows keyboard focus the same way it follows mouse hover/click.

```jsx
<Chart data={data} accessibleNavigation>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series">
    <ChartPopover width="auto">
      {(datum, close) => (
        <div>
          <div>Series: {datum.series}</div>
          <div>Value: {datum.value}</div>
          <button onClick={close}>Close</button>
        </div>
      )}
    </ChartPopover>
  </Line>
</Chart>
```

### Key bindings

| Key | Behavior |
|-----|----------|
| `Tab` | Focuses the chart's entry point (Shift+Tab to leave). |
| `Enter` (on the entry point) | Begins navigation, focusing the mark's outermost group. |
| `←` / `→` | Moves focus between sibling items at the current level. **Multi-series Line, at the line level:** drills into the line's first/last point instead — use `↑`/`↓` to move between lines. **Stacked Bar, at the segment level:** jumps to the same-series segment in the adjacent stack instead — use `↑`/`↓` to move between segments. |
| `↑` / `↓` | **Multi-series Line:** moves focus between sibling lines (at the line level) or between the same point on adjacent lines (at the point level). **Stacked Bar:** moves focus through every segment in the chart, crossing stack boundaries (at the segment level), or drills into the stack's first/last segment (at the stack level). |
| `Enter` (on a group) | Drills into the group's items. |
| `Enter` / `Space` (on a data point) | Opens that point's `ChartPopover`, anchored to the point. |
| `Escape` | Closes an open `ChartPopover` or dismisses a visible `ChartInspect` tooltip first; otherwise drills back out one level. At the outermost level, exits keyboard navigation and returns focus to the page's normal tab order. |

The `←`/`→`/`↑`/`↓` bindings above describe a vertical Bar (the default `orientation`). For a horizontal Bar, the two roles swap: `↑`/`↓` take over the sibling-movement role described above for `←`/`→` (moving between bars/stacks, or jumping to the same segment in the adjacent stack), while `←`/`→` take over the role described above for `↑`/`↓` (moving through every segment in the chart, crossing stack boundaries, or drilling into a stack's first/last segment).

### Popover and inspect behavior

- A point's `ChartPopover` opens on `Enter`/`Space` the same way it opens on click, anchored to the focused point's on-screen position.
- Closing the popover with `Escape` restores keyboard focus to the point that had it, rather than losing focus to the page body.
- A `ChartInspect` tooltip follows keyboard focus the same way it follows mouse hover. A fast second `Escape` right after the *popover* closes is treated as part of the same dismissal gesture rather than immediately drilling out — this grace window doesn't apply to the tooltip, so a second `Escape` right after dismissing it drills out immediately.
