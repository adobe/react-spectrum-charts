<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: 2026-09-25
- RFC PR: https://github.com/adobe/react-spectrum-charts/pull/936
- Authors: Connor Lamoureux

# Server-side spec generation for S2 charts

## Summary

Allow the S2 Vega spec and its interaction manifest to be generated on a
server. The client embed layer defines the chart's config and interactions
and sends the serializable definition to the server. The server runs the
spec builder and returns the spec and manifest. The embed layer then creates
the Vega View and attaches interactions with the manifest, exactly as it does
for a spec built in the browser.

This RFC builds on the S2 layered architecture RFC, which introduces the
embed layer, the serializable config, and the interaction manifest.

## Motivation

- **Server-side data preparation.** Applications can load, filter, and
  aggregate data on the server and include only the result in the spec.
- **Smaller client work.** When specs are generated on the server, the
  client does not need to run the spec builder for those charts.
- **Consistent specs across clients.** One server-side build produces the
  same spec for every client that renders it, and applications can cache it.
- **Server-authored charts.** Services that produce chart definitions (for
  example, generated dashboards) can turn them into ready-to-render specs
  without a browser.

## Detailed Design

### Flow

```
Client (embed layer)                          Server
─────────────────────                         ──────
1. Define config + register interactions
   (callbacks, tooltip/popover renderers,
   Data Navigator) by stable ID
2. Send serializable definition  ───────────▶ 3. Run the spec builder
                                                 (optionally resolve data)
                                 ◀─────────── 4. Return spec + manifest
5. Create the Vega View, apply the manifest,
   attach registered interactions
```

1. The client defines the chart's config and registers its interactions
   with the embed layer, keyed by the stable IDs used in the config.
   Interactions always stay on the client. Functions and render callbacks are
   never sent to the server.
2. The embed layer sends the serializable definition (the config, plus any
   data the client provides) to an application-defined server endpoint. RSC
   does not provide the transport.
3. The server imports the spec builder and calls it with the definition. The
   server may resolve or replace data before building.
4. The server returns the spec and the manifest as JSON.
5. The embed layer mounts the returned spec. From this step on, the process
   is the same as for a spec built in the browser: the View is created on the
   client, and interactions are attached with the manifest and the client's
   registrations.

The View is always created and rendered on the client. The server produces
only the spec and the manifest.

### Embed layer API

The embed layer accepts a prebuilt spec as an alternative to building one.
Illustrative only:

```ts
// Browser-built (default)
createChart(container, { config, registrations });

// Server-built
const { spec, manifest } = await fetchSpecFromServer(definition);
createChart(container, { spec, manifest, registrations });
```

Registrations are resolved against the manifest in the same way in both
modes, including development-time reporting of IDs that don't match.

### Spec builder requirements

The spec builder must run in a server JavaScript runtime with no DOM:

- no access to `document`, `window`, `navigator`, or other browser globals,
  either when the module is imported or while it runs;
- deterministic output for a given definition;
- output that survives a JSON round trip unchanged.

An initial check built S2 Bar, Line, and Donut specs in plain Node with no
DOM globals. Building succeeded, and the output survived a JSON round trip.
The browser dependencies found so far are in Vega expression functions that
the specs reference by name. These are evaluated when the View runs, not
when the spec is built. They must be resolved so a server-built spec runs
correctly in any client embed layer.

### Known browser dependencies to resolve

#### `getLabelWidth` (and label truncation)

Specs call `getLabelWidth(...)` inside Vega expressions to size annotations,
direct labels, and donut labels. The implementation, in
`vega-spec-builder-s2/src/expressionFunctions/expressionFunctions.ts`,
measures text by creating a canvas with `document.createElement('canvas')`.

Resolution:

- Move the implementation of `getLabelWidth`, and the truncation helpers
  built on it, into the embed layer. The embed layer registers them before
  any View is created. The spec builder continues to reference them by name
  only.
- Because measurement happens in the client's View, the result uses the
  client's actual fonts. Server-built specs therefore need no server-side
  text measurement.
- Keep a DOM-free fallback measurement for non-browser test environments.

#### `rscContainerWidth`

The S2 builder uses `rscContainerWidth(width)` for responsive stroke widths,
point sizes, label gaps, and reference-line placement. It is currently
registered only in `react-spectrum-charts-s2/src/VegaChart.tsx`, inside a
browser-only module-scope guard, and it reads the View's private
`_viewWidth`.

Resolution:

- Move registration into the embed layer, so every client that mounts a
  spec provides it, including clients that never load the React layer.
- Replace the read of the private `_viewWidth` with a value the embed layer
  controls. For example, it can pass the container width into a signal that
  the embed layer sets on resize.

#### Locale fallback in number formatting

`formatShortNumber` falls back to `navigator.language` when no locale string
is given. This runs inside an expression function on the client, but it
makes output depend on the environment. The locale should be an explicit
input to the embed layer and included in the definition. It should never be
inferred from browser globals.

### Further review

Before server-built specs are supported, review `vega-spec-builder-s2` and
its dependencies (`@spectrum-charts/constants`, `locales`, `themes`, `utils`)
for:

- any use of browser globals at import time or while building;
- values that depend on the environment during building, such as the
  current time, the host time zone, the host locale, or random values. These
  would make server and client builds differ;
- expression functions referenced by specs that are not yet provided by the
  embed layer;
- any non-serializable values in builder output.

The review adds a test that builds representative specs for every S2 chart
type in a Node environment with no DOM and checks the JSON round trip.

### Versioning

The spec and manifest produced on the server must match the embed layer that
mounts them:

- The builder writes a contract version into the spec's `usermeta`.
- The embed layer checks the version when mounting. It reports incompatible
  versions in development builds, and fails with a clear error instead of
  mounting a mismatched spec.

### Security

Vega specs contain expressions. The embed layer evaluates them with Vega's
expression interpreter, which does not use `eval`. It should mount only
specs from a trusted server endpoint. Applications should not relay specs
from untrusted sources to the embed layer.

## Documentation

- Add a guide for generating S2 specs on a server: the definition format,
  the server call, returning the spec and manifest, and mounting with the
  embed layer.
- Document which interaction behaviors are available when registrations are
  provided on the client, and the version contract.

## Drawbacks

- **Two build locations.** The spec builder must stay free of environment
  dependencies. This is an ongoing constraint on new builder code, enforced
  by tests.
- **Round-trip latency.** A server-built chart waits for a network response
  before the View can be created.
- **Version coordination.** Server and client deployments must stay within
  compatible contract versions.
- **Payload size.** Specs that include data inline can be large. Aggregating
  on the server reduces this.

## Backwards Compatibility Analysis

- Browser-built charts are unchanged. Server-built specs are an additional,
  opt-in mode of the embed layer.
- Moving `getLabelWidth` and `rscContainerWidth` into the embed layer
  changes where these functions are registered, not what they return.
  Existing tests validate that.

## Open Questions

1. Should the definition sent to the server include data by default, or
   should the embed layer supply data to the View after mounting?
2. What is the minimum contract version policy? For example, exact match
   only, or backward-compatible minor versions?
3. Should RSC provide a small server helper, for example
   `buildChartForServer(definition)`, or is calling the spec builder
   directly enough?

## Related Discussions

- RFC: S2 layered architecture. It defines the embed layer, the serializable
  config, and the interaction manifest.
- RFC: Replace `vega-embed` with RSC-owned embedding in S2. It defines how
  the embed layer creates and manages the View.
