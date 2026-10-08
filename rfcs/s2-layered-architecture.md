<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: 2026-09-25
- RFC PR: https://github.com/adobe/react-spectrum-charts/pull/934
- Authors: Connor Lamoureux

# S2 layered architecture: React config layer, embed layer, and serializable spec builder

## Summary

Split the Spectrum 2 chart runtime into three layers with explicit contracts:

1. A **React layer** that only defines the chart configuration and hosts React
   Spectrum components.
2. A framework-neutral **embed layer** that receives the configuration and the
   chart's interactions, owns the Vega View, and wires interactions to it.
3. The **Vega spec builder**, which turns the configuration into a
   serializable Vega spec and returns it to the embed layer.

The embed layer mounts the returned spec in a Vega View and attaches
interactions using an **interaction manifest**. The manifest is a description
of which Vega signals, datasets, marks, and events each interaction attaches
to.

## Motivation

In the S2 packages today, `react-spectrum-charts-s2` does all of the following
in React components and hooks:

- composes the configuration from JSX children;
- calls the spec builder;
- embeds the spec;
- registers Vega expression functions at module scope;
- attaches event listeners, signal listeners, and tooltip handlers;
- runs Data Navigator keyboard and screen-reader behavior.

Interaction code reads Vega internals directly. For example, it reads
`view.data(FILTERED_TABLE)` and `${markName}_stacks` datasets, and it sets
`SELECTED_ITEM`, `FOCUSED_ITEM`, and `hiddenSeries` signals from hooks and
Data Navigator adapters. As a result:

- **Interaction logic is tied to React.** Chart behavior cannot be reused or
  tested without rendering React components.
- **The spec builder's internal names are duplicated.** Signal and dataset
  names the builder generates are also hard-coded in React-layer files. When
  the builder changes, those files can silently drift.
- **View lifecycle is spread across effects.** Creating the View, resizing it,
  updating data, and cleaning it up are split across several React effects
  and callbacks, which makes the lifecycle hard to reason about and change.
- **Chart behavior has no single owner.** The same kind of wiring (hover,
  selection, focus, tooltips) is implemented in several places with slightly
  different assumptions.

The expected outcome is a runtime where each concern has one owner. Charts
behave the same whichever framework hosts them. Interaction behavior can be
tested without React. Changes to the spec builder cannot silently break
interaction wiring.

## Detailed Design

### Layers and responsibilities

```
┌──────────────────────────┐
│ React layer              │  JSX → chart config
│ (react-spectrum-charts-s2)│  React Spectrum components, runtime handlers
└────────────┬─────────────┘
             │ config + interaction registrations
             ▼
┌──────────────────────────┐        config         ┌──────────────────────────┐
│ Embed layer              │ ────────────────────▶ │ Vega spec builder        │
│ (framework-neutral)      │ ◀──────────────────── │ (vega-spec-builder-s2)   │
│                          │  spec + manifest data │ pure, serializable       │
└────────────┬─────────────┘                       └──────────────────────────┘
             │ creates View, attaches interactions via manifest
             ▼
        Vega View (SVG or Canvas)
```

#### React layer

- Reads chart components (`<Chart>`, marks, axes, legends, tooltips,
  popovers) and produces the chart **config**.
- Provides runtime-only behavior as **interaction registrations**: event
  callbacks, and render functions for React Spectrum tooltip and popover
  content.
- Renders React Spectrum UI (tooltips, popovers, and similar) in response to
  events from the embed layer.
- Does not create, read, or mutate the Vega View directly.

#### Embed layer

A framework-neutral module with no React dependency.

- Accepts the config and the interaction registrations.
- Calls the spec builder with the config.
- Owns the Vega View lifecycle: create, update, resize, and destroy.
- Provides the Vega expression functions and runtime options that specs
  reference (for example label measurement, container width, locale, and
  formatters). Registration moves out of React module scope and out of the
  spec builder.
- Attaches built-in behaviors (hover, selection, legend toggling, and Data
  Navigator keyboard and screen-reader support). It attaches registered
  callbacks using the interaction manifest.
- Emits framework-neutral events (for example `hover`, `select`, `focus`, and
  `contextmenu`, each with the item's datum and bounds). A framework layer
  subscribes to these events to render UI.

#### Vega spec builder

- Is a pure, deterministic function of the config.
- Returns a Vega spec that is fully **serializable**. The spec contains no
  functions, DOM references, or runtime objects.
- Performs no side effects. It does not register expression functions, does
  not access the DOM, and does not create a View.
- Provides the information the embed layer needs to build the interaction
  manifest (see below).

### Config

The config is the only input the React layer passes to the builder. It is
serializable.

- Interactions are referenced by **stable IDs**, not function values. For
  example, a mark's click behavior is recorded as `onClick: 'bar0.click'`.
  The React layer registers the matching handler with the embed layer under
  the same ID.
- IDs are either provided by the author or assigned deterministically from
  the component tree, so the same JSX always produces the same IDs.

### Interaction manifest

The manifest connects configuration-level interactions to the Vega-level
hooks inside a built spec. For each interactive feature it records:

- the stable interaction ID from the config;
- the kind of behavior (hover, click, selection, focus, legend toggle,
  tooltip, and so on);
- the Vega hooks the embed layer attaches to: signal names, dataset names,
  mark names, and event types;
- the datum field that identifies an item.

The embed layer uses only the manifest to find Vega hooks. It does not
hard-code signal, dataset, or mark names. If a registration has no matching
manifest entry, or a manifest entry has no registration, the embed layer
reports it in development builds rather than silently ignoring it.

The exact form of the manifest is still open (see Open Questions). The
requirements for any form are:

1. The spec builder's naming logic is the single source of truth for Vega
   hook names.
2. The manifest is serializable.
3. The manifest always matches the spec it describes.

### Illustrative API

The following shapes are illustrative, to show how the layers interact. They
are not final signatures.

```ts
// Spec builder
const { spec, manifest } = buildChart(config);

// Embed layer
const chart = createChart(container, {
  config,
  registrations: {
    'bar0.click': (event) => {
      /* ... */
    },
  },
  locale: 'en-US',
  renderer: 'svg',
});

chart.on('hover', ({ id, datum, bounds }) => {
  /* render a React Spectrum tooltip */
});
chart.update({ config: nextConfig });
chart.setData(nextData);
chart.resize(width, height);
chart.destroy();
```

The React layer is a thin adapter. It turns JSX into `config` and
`registrations`, calls `createChart` on mount, forwards prop changes to
`update`, `setData`, and `resize`, and calls `destroy` on unmount.

### Updates

- **Configuration changes** rebuild the spec through the builder, and the
  embed layer remounts the View.
- **Data-only changes** do not rebuild the spec. The embed layer applies them
  to the existing View's source dataset.
- **Size changes** resize the existing View.

### Migration

The change is internal to the S2 packages and is delivered incrementally:

1. Introduce the embed layer. Move View creation, expression-function
   registration, and lifecycle handling into it behind the current React
   component.
2. Add stable interaction IDs to the config and introduce the manifest.
3. Move each interaction (tooltips, popovers, hover, selection, legend,
   context menu, Data Navigator) from React hooks to the embed layer, one at
   a time.
4. Remove direct Vega View access from the React layer.

Each step must preserve current behavior. Existing unit and UI tests
validate this, and new tests cover the embed layer on its own.

## Documentation

- Update the S2 architecture documentation in the repository to describe the
  three layers, the config, and the manifest.
- Add package-level README content for the embed layer.
- No announcement to consumers is needed, because the public React API does
  not change.

## Drawbacks

- **More moving parts.** There is an additional module and two new internal
  contracts (config IDs and the manifest) to maintain.
- **Migration effort.** Interaction code has to move out of React hooks. While
  that happens, some behavior will exist in both places.
- **New failure mode.** A mismatch between registrations and the manifest is
  a new kind of bug. It is caught by development-time reporting and tests
  rather than eliminated.

## Backwards Compatibility Analysis

- The public JSX API of `react-spectrum-charts-s2` does not change.
- Rendered output and interaction behavior are expected to remain the same,
  and existing tests validate that.
- Exports of `vega-spec-builder-s2` that expose runtime concerns may be
  deprecated or relocated to the embed layer. Examples are expression
  functions and embed option helpers. Any such change is recorded with a
  changeset and a deprecation period.

## Open Questions

1. **Manifest form.** Should the builder emit the manifest next to the spec
   (for example in the spec's `usermeta`)? Or should hook names come from a
   shared naming module that both the builder and the embed layer import?
   Emitting it keeps one source of truth without duplicating conditional
   naming logic. A shared module removes the extra output, but it requires
   hook names that don't depend on configuration conditions.
2. **Embed layer packaging.** Should the embed layer be a new package, or a
   framework-neutral entry point inside an existing S2 package?
3. **Event surface.** What is the minimum set of framework-neutral events the
   embed layer must emit for the React layer to render all current tooltip,
   popover, and context-menu behavior?
4. **ID assignment.** Which interactions need author-provided IDs, and which
   can safely use IDs assigned from the component tree?

## Frequently Asked Questions

**Does this change the JSX that consumers write?**
No. The React layer continues to accept the same components and props.

**Does the spec builder still run in the browser?**
Yes. The embed layer calls it in the browser. The builder's purity and
serializable output are requirements of this architecture, not a change to
where it runs.

**Where does Data Navigator live?**
In the embed layer. It attaches to the View using the manifest and emits
focus events that the React layer can react to.

## Related Discussions

- RFC: Replace `vega-embed` with RSC-owned embedding in S2. It covers how the
  embed layer creates and manages the Vega View.
