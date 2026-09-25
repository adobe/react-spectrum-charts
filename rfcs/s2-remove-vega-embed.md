<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: 2026-09-25
- RFC PR: (leave this empty, to be filled in later)
- Authors: Connor Lamoureux

# Replace `vega-embed` with RSC-owned embedding in S2

## Summary

Remove the `vega-embed` dependency from the S2 packages. Create and manage the
Vega View with a small amount of RSC-owned embedding code that uses Vega's
public `parse` and `View` APIs directly. This removes dependencies RSC does
not use, and gives RSC direct control over the View lifecycle.

## Motivation

### Unused dependencies

`react-spectrum-charts-s2` calls `vega-embed` once, in `VegaChart.tsx`, to
turn an RSC-built Vega spec into a View. The spec is always a Vega spec and
`actions` is disabled. Even so, `vega-embed` 7.1.0 statically imports and
ships all of the following:

- the Vega-Lite compiler (`vega-lite`, also a required peer dependency);
- `vega-themes`;
- `vega-schema-url-parser`;
- `fast-json-patch`;
- `semver`;
- `json-stringify-pretty-compact`;
- the export and "view source" actions menu.

RSC uses none of these. The parts of `vega-embed`'s behavior RSC does depend
on come from two small packages: `vega-interpreter` (evaluating expressions
without `eval`) and `vega-tooltip` (already a direct RSC dependency).

The difference in size, measured by bundling each import with esbuild,
minified, with `vega` external:

| Import                                        | Minified |   Gzip |
| --------------------------------------------- | -------: | -----: |
| `vega-embed` (default export)                 |   335 KB | 110 KB |
| `vega-tooltip` `Handler` + `vega-interpreter` |    11 KB | 4.5 KB |

Removing `vega-embed` also removes `vega-lite` from the peer dependencies
of `react-spectrum-charts-s2`. Consumers no longer need to install it.

### View lifecycle control

`vega-embed` puts an async, general-purpose step between RSC and the View.
The current integration has these issues:

- **No cancellation.** `embed(...).then(...)` is not cancelled when the
  effect re-runs or the component unmounts. A slow earlier embed can resolve
  after a newer one and replace the current View, or leave a View that is
  never finalized.
- **Global locale side effects.** `vega-embed` applies `formatLocale` and
  `timeFormatLocale` by calling Vega's global default-locale setters. Two
  charts on the same page with different locales affect each other. Vega's
  `View` accepts a per-View `locale` option, which avoids this.
- **Global expression registration on every embed.** Expression functions
  are re-registered globally each time a chart embeds.
- **Duplicate tooltip setup.** `vega-embed` installs a tooltip handler, and
  RSC immediately replaces it with its own in `useNewChartView`.
- **Data changes recreate the View.** The embed effect depends on data, so
  every data change parses the spec and builds a new View, instead of
  updating the existing View's dataset.
- **Settling passes are spread across code.** Extra `runAsync` calls and a
  `setTimeout` settle layout after each embed, separately from the resize
  path.

Owning the embedding code lets RSC define these behaviors explicitly and
test them directly.

## Detailed Design

### Scope

This applies to the S2 packages (`react-spectrum-charts-s2` and
`vega-spec-builder-s2`). The non-S2 packages are unchanged.

### Embedding module

Add an RSC-owned embedding module with no React dependency. It uses only
Vega's public APIs. Illustrative shape:

```ts
interface EmbedOptions {
  config: Config;
  renderer: 'svg' | 'canvas';
  width: number;
  height: number;
  padding: Padding;
  locale: { number: FormatLocaleDefinition; time: TimeLocaleDefinition };
  tooltip?: TooltipHandler;
}

interface EmbeddedChart {
  view: View;
  setData(name: string, values: unknown[]): Promise<void>;
  resize(width: number, height: number): Promise<void>;
  destroy(): void;
}

function embedChart(container: HTMLElement, spec: Spec, options: EmbedOptions): Promise<EmbeddedChart>;
```

It performs the same steps `vega-embed` performs for RSC today. It covers
only the Vega-spec path and adds nothing else:

1. `vega.parse(spec, config, { ast: true })`.
2. `new View(runtime, { renderer, container, hover: true, locale, expr: expressionInterpreter })`.
   RSC keeps its current interpreter-based expression evaluation.
3. Set width, height, and padding. Install the tooltip handler supplied by
   RSC.
4. `await view.runAsync()`, then run a single documented settling pass.

### Lifecycle rules

- **Single owner.** Each chart container has at most one live View. The
  module owns creating it and finalizing it.
- **Cancellation.** Each embed call has a token. If a newer embed starts, or
  `destroy` is called before a pending embed finishes, the pending View is
  finalized when it resolves. It never becomes the current View.
- **Per-View locale.** Locale is passed to the View constructor. The module
  never calls Vega's global locale setters.
- **Expression functions registered once.** RSC's expression functions are
  registered once per module load, not once per embed.
- **Data updates without re-embedding.** When only data changes, `setData`
  updates the existing View's dataset with a changeset and reruns the
  dataflow. Spec or config changes still create a new View.
- **One resize path.** `resize` owns the two-pass settle that `resizeView`
  performs today. The embed path reuses it.
- **Cleanup.** `destroy` finalizes the View, removes any listeners the module
  added, and clears the container.

### Changes to existing code

- `VegaChart.tsx` calls `embedChart` instead of `embed`, and calls `setData`
  and `resize` for data and size changes.
- `getVegaEmbedOptions` in `vega-spec-builder-s2` is replaced by options
  typed for the new module. The old export is deprecated and kept for one
  release cycle.
- `vega-embed` is removed from `dependencies`, and `vega-lite` from
  `peerDependencies`, in `react-spectrum-charts-s2`. Neither package is
  imported anywhere else in the S2 source. `vega-interpreter` becomes a direct
  dependency.

### Testing

- Unit tests for the embedding module cover: cancellation of superseded
  embeds, finalize on destroy, per-View locale isolation with two charts,
  data updates that keep the same View instance, and resize.
- Existing S2 component and UI tests must pass unchanged, which confirms
  that rendering and interactions are the same.

## Documentation

- Update the S2 architecture documentation to describe the embedding module
  and its lifecycle rules.
- Add a changeset that notes that `vega-lite` is no longer a peer dependency
  and that `getVegaEmbedOptions` is deprecated.

## Drawbacks

- **RSC maintains the embedding code.** Changes in Vega's `View` or `parse`
  APIs must be handled in RSC instead of arriving through `vega-embed`
  updates.
- **Behavior must match exactly.** Defaults that `vega-embed` applies
  implicitly (for example hover handling, and when config is applied) must be
  reproduced deliberately. Existing tests guard this.

## Backwards Compatibility Analysis

- No change to the public JSX API or rendered output is intended.
- Consumers who installed `vega-lite` only to satisfy the peer dependency can
  remove it. Consumers who use `vega-lite` themselves are unaffected.
- `getVegaEmbedOptions` stays available but deprecated for one release
  cycle.
- Two charts with different locales on the same page will each format
  values in their own locale. Today they can interfere with each other, so
  this is a behavior fix.

## Open Questions

1. Should the embedding module ship as its own entry point so it can be
   used without React, or stay internal to `react-spectrum-charts-s2` until
   the layered architecture defines its home?
2. Should `setData` accept full snapshots only, or also incremental
   insert and remove operations?
3. Are there any `vega-embed` defaults RSC depends on beyond those listed
   above? A review of the current embed options will confirm this before
   implementation.

## Related Discussions

- RFC: S2 layered architecture. The embedding module described here is the
  foundation of that RFC's embed layer.
