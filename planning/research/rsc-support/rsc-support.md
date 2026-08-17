# Using react-spectrum-charts-s2 with React Server Components

## Summary

Use RSC to fetch data server-side. Render the chart itself — the full, unmodified JSX API,
including `onClick` and `ChartPopover` — in a Client Component, exactly as you would today.
No new components, no new props, no restricted API. That's the whole pattern.

## Prerequisites

**Not yet released.** The fix this pattern depends on (below) exists only on the
`fix/vegachart-ssr-expressionfunction-crash` branch of this repo, not in any published npm
version — the current published `@spectrum-charts/react-spectrum-charts-s2` (`0.4.1`) does
**not** include it and will crash under SSR the way "Why this works" describes. Confirm with the
library maintainers that a release containing this fix is available before depending on this
pattern in production.

---

## The pattern

![RSC rendering flow: a Server Component fetches data and passes it as plain serializable JSON across the RSC boundary to a Client Component, which renders the full, unmodified Chart JSX API and mounts vega-embed in the browser.](./rsc-rendering-flow.svg)

Three files, real working code (from the verified `rsc-server-components-demo` prototype,
`app/baseline/`), in call order:

**1. Server Component** — fetch data, nothing else:

```tsx
// app/page.tsx  (no "use client" — this runs on the server)
import { Suspense } from 'react';

import { ChartSkeleton } from '@/components/ChartSkeleton';
import { getMockChartData } from '@/lib/mockData';

import { DynamicChartClient } from './DynamicChartClient';

export const dynamic = 'force-dynamic';

async function ChartSection() {
  const data = await getMockChartData(); // DB access, secrets — stays on the server
  return <DynamicChartClient data={data} />;
}

export default function BaselinePage() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Baseline: RSC as a data loader</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection />
      </Suspense>
    </main>
  );
}
```

**2. Dynamic wrapper** (optional, but recommended) — defers the chart bundle out of the initial
route chunk. Note there is **no** `{ ssr: false }` — see "Why this works" below for why that's
no longer needed:

```tsx
// app/DynamicChartClient.tsx
'use client';

import dynamic from 'next/dynamic';

export const DynamicChartClient = dynamic(() => import('./ChartClient').then((mod) => mod.ChartClient));
```

**3. Client Component** — the actual chart, full JSX API, real callbacks:

```tsx
// app/ChartClient.tsx
'use client';

import { Axis, Chart, ChartPopover, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

import { ChartDatum } from '@/lib/mockData';

export function ChartClient({ data }: { data: ChartDatum[] }) {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <Chart data={data}>
        <Axis position="bottom" labelFormat="time" baseline />
        <Axis position="left" grid />
        <Line color="series" scaleType="time" dimension="datetime" metric="value" />
        <Legend highlight />
        <ChartPopover>
          {(datum, close) => (
            <div style={{ padding: 12, minWidth: 160 }}>
              <div style={{ fontWeight: 600 }}>{String(datum.series)}</div>
              <div>{new Date(String(datum.datetime)).toLocaleDateString()}</div>
              <div>Value: {String(datum.value)}</div>
              <button onClick={close} style={{ marginTop: 8 }}>
                Close
              </button>
            </div>
          )}
        </ChartPopover>
      </Chart>
    </div>
  );
}
```

That's the entire integration. `data` crosses the Server→Client boundary as plain JSON.
Everything else — spec building, mark rendering, `onClick`, `ChartPopover`'s render-prop, legend
click-to-hide — runs exactly as it does in a non-RSC app, because it's still, and always was,
ordinary client-side code.

---

## What not to do

Don't try to author interactive marks — anything with `onClick` or a `ChartPopover`/
`ChartInspect` render-prop — directly inside a Server Component:

```tsx
// ❌ app/page.tsx — no "use client"
export default async function Page() {
  const data = await getMockChartData();
  return (
    <Chart data={data}>
      <Line onClick={(datum) => console.log(datum)} /> {/* this callback will never fire */}
    </Chart>
  );
}
```

This won't necessarily throw a build error — but the closure is captured and discarded during
the server render and is gone before the browser exists in the request lifecycle. Nothing
client-side ever gets a reference to it, so it silently never runs. This isn't a bug to work
around; it's a hard platform constraint (a live JS closure cannot cross the RSC Server→Client
boundary, with or without React Server Components — no tree restructuring changes this). Any
mark that needs a real callback belongs in the Client Component, as shown in "The pattern"
above — which is also just how you'd write it without RSC in the picture at all.

The one other server-only limitation: `vega-embed` itself is unavoidably client-only (a live
Vega `View` mounted to a DOM node, driven by browser events). There is no server-rendered chart
pixel output in this pattern — the chart mounts once the Client Component's JS runs in the
browser, same as today.

---

## Why this works

One narrow, non-breaking fix in the library makes the pattern above possible without
`next/dynamic(..., { ssr: false })`:

`VegaChart.tsx` used to call `expressionFunction('rscContainerWidth', ...)` unconditionally at
module load. This throws (`expressionFunction is not a function`) the instant any SSR
framework — Next.js or otherwise — server-renders a `"use client"` component using this
library, which happens by default for every client component's initial HTML. Fixed by guarding
the registration on `typeof window !== 'undefined'`. Filed and tracked as
`planning/specs/chart/issues/implemented/vegachart-ssr-expressionfunction-crash.json`.

This fix does not change any public API. It also doesn't affect how `rscContainerWidth` behaves
once the chart is running in the browser: the guard only skips registration during the
*server's* module evaluation (where there's no `window` and no Vega `View` to use it anyway).
When the same module runs again client-side after hydration, `window` exists, so the
registration happens normally, before `vega-embed`'s mount effect runs.

If you hit the crash described in "Prerequisites," it means you're on a version without this
fix.

---

## Appendix: a second, separate SSR hazard (not fixed here)

While verifying this fix, a **different**, pre-existing SSR hazard was found in the same file's
import chain: `VegaChart.tsx` → `useDebugSpec` → the `'../utils'` barrel → the `'../components'`
barrel → `EmptyState` → `@react-aria/utils`, which references `window` at import time. This
trips a plain Node `require()` of the module (confirmed via a Jest-level reproduction), but does
**not** affect the real Next.js SSR pattern this document verifies — see "How this was verified"
below for why a bundler's module resolution differs from a raw `require()`. Left out of scope
for this fix; worth its own follow-up if a consumer needs to `require()`/`import()` this
library's modules outside a bundler (e.g. calling spec-building functions directly from a plain
Node script or a genuine Server-Component-only code path).

## Appendix: what else was considered, and why it isn't recommended

A more ambitious version — moving `childrenAdapter`/`buildSpec` execution into the Server
Component itself, so zero chart-config JS ships to the client — was explored and rejected. If a
future need for that arises, the options considered were:

- **A restricted `ServerChart` entry point** with parallel `*ServerSafe` prop types
  (`Omit`-ing every function prop) so a compile-time error caught a callback nested in a
  server-authored tree. Rejected: a second, parallel type/component surface for every mark, for
  a marks-layer bundle-size benefit that measured small (see below) — and it still can't
  preserve `ChartPopover` without new machinery.
- **A chart-level `onMarkClick` callback registry** keyed by mark name, so marks never carry
  functions and can always be authored as Server Components. Rejected as a default: a real,
  breaking change to how consumers attach interactivity (`onClick` moves off `<Line>`), for the
  same bundle-size win. Worth revisiting only against a concrete, measured need.
- **Precomputing the spec server-side and hand-mounting `vega`+`vega-embed`**, skipping this
  library's React layer entirely — actually built and measured in a prototype
  (`rsc-server-components-demo`'s `app/advanced`). Real bundle-size win, but gives up
  `ChartPopover`'s real positioning/dialog machinery, legend click-to-hide, and the imperative
  handle. Not recommended as a general pattern.

**Bundle-size measurements** (prototype build output, `app/baseline` vs. `app/advanced`):

| | vega + vega-embed (shared) | `react-spectrum-charts-s2` | Route total (gzip) |
|---|---|---|---|
| Baseline (full API) | 814 KB | + 1.15 MB | ~603 KB |
| Advanced (hand-rolled, no library import) | 814 KB | — | ~269 KB |

A meaningful chunk of that 1.15 MB is `chartSpecBuilder.ts` statically importing every mark
builder regardless of which marks a chart actually uses (confirmed: bullet-chart-specific
strings ship in a bundle that never renders `<Bullet>`). Lazy-loading only the referenced mark
builders would shrink this for every consumer, RSC or not — a separate, non-RSC-specific
follow-up worth pursuing on its own merits.

## Appendix: how this was verified

Verified against the `rsc-server-components-demo` prototype (Next.js 16, App Router), built
against this repo's local `fix/vegachart-ssr-expressionfunction-crash` branch, not the published
npm version.

```
$ yarn build && yarn start
Route (app)                    ƒ  /baseline   (server-rendered on demand)

$ curl -s -o out.html -w "HTTP %{http_code}\n" http://localhost:3000/baseline
HTTP 200
$ grep -c "rsc-container" out.html
1
$ grep -o "Application error" out.html
(no match)
```

The server-rendered HTML contains `<Chart>`'s actual container markup — confirmed rendering
through Next's real SSR pass, not just "didn't 500." Reverting the guard and re-running the same
request reproduces the crash, confirming it's the guard specifically, not incidental behavior.

## References

- `rsc-server-components-demo` (sibling repo) — `ARCHITECTURE.md` has the full prototype
  writeup, including the `app/advanced` variant.
- `planning/specs/chart/issues/implemented/vegachart-ssr-expressionfunction-crash.json` — the
  bug this fix addresses.
