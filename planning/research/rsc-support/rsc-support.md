# Using react-spectrum-charts-s2 with React Server Components

Fetch data in a Server Component. Render the chart in a Client Component, using the library
exactly as you do today — same `<Chart>`, same props, same `onClick`/`ChartPopover` callbacks.
There is no separate RSC API.

## Requires

The `fix/vegachart-ssr-expressionfunction-crash` branch, or a release built from it. Published
`0.4.1` does not include this fix and will crash under SSR (see "The fix" below).

## Pattern

![RSC rendering flow: a Server Component fetches data and passes it as plain serializable JSON across the RSC boundary to a Client Component, which renders the full, unmodified Chart JSX API and mounts vega-embed in the browser.](./rsc-rendering-flow.svg)

**Server Component** — fetch data, nothing else:

```tsx
// app/page.tsx
import { Suspense } from 'react';
import { ChartSkeleton } from '@/components/ChartSkeleton';
import { getMockChartData } from '@/lib/mockData';
import { DynamicChartClient } from './DynamicChartClient';

export const dynamic = 'force-dynamic';

async function ChartSection() {
  const data = await getMockChartData();
  return <DynamicChartClient data={data} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartSection />
    </Suspense>
  );
}
```

**Dynamic wrapper** — optional, defers the chart bundle out of the initial route chunk:

```tsx
// app/DynamicChartClient.tsx
'use client';
import dynamic from 'next/dynamic';

export const DynamicChartClient = dynamic(() => import('./ChartClient').then((m) => m.ChartClient));
```

**Client Component** — the chart, full API, real callbacks:

```tsx
// app/ChartClient.tsx
'use client';
import { Axis, Chart, ChartPopover, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartDatum } from '@/lib/mockData';

export function ChartClient({ data }: { data: ChartDatum[] }) {
  return (
    <Chart data={data}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" grid />
      <Line color="series" scaleType="time" dimension="datetime" metric="value" />
      <Legend highlight />
      <ChartPopover>{(datum, close) => <MyPopoverContent datum={datum} onClose={close} />}</ChartPopover>
    </Chart>
  );
}
```

`data` is the only thing crossing the Server→Client boundary, as plain JSON. Everything else —
spec building, mark rendering, `onClick`, popovers, legend interactions — runs client-side,
unchanged.

## Rules

- **Don't put `onClick` or a `ChartPopover`/`ChartInspect` render-prop inside a Server
  Component.** A closure defined in server-rendered code never reaches the browser — it's
  captured and discarded during the server render, so it silently never fires. No error, no
  warning. Keep interactive marks in the Client Component, as shown above.
- **There's no server-rendered chart output.** `vega-embed` mounts a live `View` to a DOM node
  in the browser; the chart appears once the Client Component's JS runs, same as it always has.

## The fix

`VegaChart.tsx` registered a Vega expression function unconditionally at module load, which
throws under any SSR framework's server-render pass of a `"use client"` component — RSC or not.
Fixed by guarding it on `typeof window !== 'undefined'`. Doesn't change `rscContainerWidth`'s
behavior in the browser; it only skips registering during the server pass, where there's no
`View` to use it anyway. Tracked in
`planning/specs/chart/issues/implemented/vegachart-ssr-expressionfunction-crash.json`.
