# Bundle Size Optimization — Plan & Effort Scoping

Investigation into client bundle size for `@spectrum-charts/react-spectrum-charts-s2`, covering
package structure, dependency placement, and build architecture. Written on branch `bundle`.

---

## Methodology

`packages/bundle-profiling` (private, unpublished workspace package) measures two scenarios,
reproducibly, via `yarn profile` / `yarn profile:shared-react` from within that package:

- **Cold consumer** — every dependency (including peers like `react`, `vega`, `vega-lite`,
  `@react-spectrum/s2`) is treated as a literal cost. This is the priority metric: most real
  consumers are not already using Vega or `@react-spectrum/s2` elsewhere, so nothing should be
  assumed "free to share."
- **Shared-react** — `react`/`react-dom`/`@react-spectrum/s2` are treated as already supplied by
  the host app (externalized). Useful for understanding the tradeoff on fixes that only pay off
  when a dependency is genuinely shared elsewhere.

Fixtures cover each mark in isolation (`line.tsx`, `bar.tsx`, `donut.tsx`, `area.tsx`,
`scatter.tsx`, `combo.tsx`) plus an `everything.tsx` upper-bound fixture referencing every stable
and pre-alpha mark and supporting component.

## Current baseline (measured)

| Scenario | Gzip |
|---|---|
| Cold consumer, single mark (`line`/`bar`) | 662.6 KB |
| Cold consumer, every mark (`everything`) | 663.9 KB |
| react/react-dom/`@react-spectrum/s2` shared | 604.6 KB |
| `vega` + `vega-lite` alone (isolated) | 196.1 KB (~27% of the cold-consumer floor) |

The near-identical `line` vs `everything` numbers are the key finding driving this whole plan:
per-mark marginal cost is currently negligible. The 662.6 KB floor is dominated by shared engine
weight (Vega, `@react-spectrum/s2`, React), not mark-specific code — so most future work should
target that shared floor, not per-mark trimming, until the dispatch architecture changes (#2
below).

## Already shipped this session (commit `7c427ad5f`)

- `sideEffects` field added to `react-spectrum-charts-s2`, `vega-spec-builder-s2`, `constants`,
  `themes`, `utils` — correct metadata staged for when ESM output exists; inert until then.
- `vega-tooltip` deduped to a single resolved version via root `resolutions` (was split between
  `1.0.0`, pinned by `vega-embed`, and `1.1.0`, our own direct requirement).
- Dead `./alpha` / `./beta` `exports`/`typesVersions` entries removed (no source exists for
  either; they 404'd).
- `Chart.tsx` no longer imports `EmptyState` via the full `components` barrel.
- `packages/bundle-profiling` — the measurement harness described above.

Net effect: correctness/hygiene fixes, ~0 measured byte impact today (as expected — none of them
depend on the output format, and none were large in isolation). Real reduction requires the work
below.

## Root cause underlying everything remaining

`react-spectrum-charts-s2` and `vega-spec-builder-s2` both ship as a single UMD bundle (via
webpack, `libraryTarget: 'umd'`). UMD's `require()`-via-opaque-function-parameter pattern prevents
any downstream bundler from tree-shaking either the package's own exports, or anything it tries to
externalize. This was proven directly: adding `@react-spectrum/s2` to the webpack `externals` map
made the cold-consumer number *worse* (+344 KB, 662.6 → 1006.7 KB), because the entire
`@react-spectrum/s2` barrel had to be pulled in un-shaken by the consumer's bundler — despite
`@react-spectrum/s2` itself being fully tree-shakeable (`sideEffects: ['*.css']`, real ESM
`module` field, per-component subpath `exports`). The fix was reverted; see #4 below for the
correct sequencing.

---

## Work items

### 1. Migrate `react-spectrum-charts-s2` and `vega-spec-builder-s2` off webpack/UMD onto rollup, dual ESM+CJS output

**What:** Replace `webpack.config.js` in both packages with a rollup config producing real ESM
output (module-boundary-preserving, so per-file structure survives for downstream tree-shaking)
plus a separate CJS build for non-ESM consumers — mirroring `@react-spectrum/s2`'s own
`package.json` pattern (`module`/`import` → `.mjs`, `require` → `.cjs`), which is the modern
standard for exactly this scenario and the pattern our closest sibling library already uses.
`react`/`react-dom` don't bother with this (their whole API is used by virtually every consumer,
so there's nothing to tree-shake) — not a useful comparable here.

CSS handling: `rollup-plugin-postcss` with `inject: true`, preserving today's auto-injected,
zero-consumer-action CSS behavior. (CSS *extraction* to a separate file was considered and
dropped — it would require a consumer-facing change for no bundle-size benefit, since gzip
compresses CSS-as-JS-string about as well as CSS-as-its-own-file.)

**Effort:** Large. Core build pipeline for the two most structurally complex packages in the
monorepo. Needs full validation: test suite, Storybook visual check across S2 Examples/Features
stories, source maps, `ai-catalog`/`pre-alpha` entries still resolving, `pack`/`publish-package`
scripts still producing a valid npm package.

**Risk:** Medium-high. Build-tooling migrations have historically subtle failure modes (CSS
ordering, files missing from the `files` allowlist, tree-shaking regressions invisible until a
real consumer's bundler is tested).

**Depends on:** nothing — this is the prerequisite for every other item below.

### 2. Refactor the all-marks static-import dispatch pattern (two layers)

**What:** `childrenAdapter.ts` (react-spectrum-charts-s2) and `chartSpecBuilder.ts`
(vega-spec-builder-s2) each statically import every mark's component/adapter/spec-builder function
unconditionally — confirmed via direct inspection of both files. Replace with a registry pattern:
each mark module self-registers (a side-effecting call at import time) instead of being eagerly
imported by the shared dispatcher.

**Effort:** Medium-large. Two call sites, ~9-11 marks each. Needs a registry design (a shared map
keyed by mark displayName/type) that preserves exact existing dispatch behavior — this is a
wiring change, not a behavior change, and needs test coverage strong enough to prove that.

**Risk:** Medium. This is the "how children get recognized" hot path for every chart — a subtle
behavior drift here breaks every mark, not just one.

**Depends on:** #1. Without real ESM output, a registry pattern doesn't reduce anyone's bundle —
it all still funnels through one UMD file regardless of how lazily the source registers itself.

**Expected gain:** Unverified — deliberately not estimating a number here. The `line` vs
`everything` delta (1.3 KB) suggests the ceiling might be smaller than intuition suggests, since
most of the floor is shared engine weight, not adapter code. Recommend prototyping one mark's
registration first and re-measuring via the harness before committing to finishing all marks.

### 3. Dedupe `index.js` / `ai-catalog.js` shared code

**What:** these two production entries currently duplicate ~700 KB of unminified shared code, with
no vendor/shared chunk between them. Rollup's native multi-entry code-splitting solves this as a
side effect of #1. Could also be fixed sooner, standalone, via webpack `splitChunks` in the
current build — but that work would be discarded once #1 replaces the build anyway.

**Effort:** Small, effectively free once #1 is underway.

**Risk:** Low.

**Depends on:** naturally sequenced as part of #1.

### 4. Re-externalize `@react-spectrum/s2`, paired with #1

**What:** add `@react-spectrum/s2` back to the externals/rollup-external config — this time it
will actually work, since real ESM output preserves the import statement instead of collapsing it
into an opaque UMD parameter.

**Effort:** Small (one config line + validation) — but only valid once #1 ships.

**Risk:** Low — already round-tripped once this session, so the failure mode is understood, not
theoretical.

**Expected gain:** Real. Recovers the ~38 KB win measured when this was tested in isolation for
the shared-react scenario (604.6 → 566.3 KB), without the cold-consumer regression, since the
`@react-spectrum/s2` barrel is no longer forced in whole.

**Depends on:** #1.

### 5. Per-mark subpath exports

**What:** add real per-mark subpath entries to the `exports` map (both packages), mirroring the
existing `pre-alpha` entry pattern — required for a consumer/bundler to actually address one mark
individually once ESM output exists.

**Effort:** Small-medium (mechanical, but touches `package.json` + build entry config +
`typesVersions` for every mark).

**Risk:** Low.

**Depends on:** #1, and ideally sequenced after #2 — subpath exports don't help much while
`childrenAdapter.ts`/`chartSpecBuilder.ts` still force every mark in regardless of which subpath a
consumer imports from.

### Considered and dropped

- **`vega-embed`/`vega-tooltip` → `peerDependencies`**: only benefits consumers already sharing
  Vega tooling elsewhere in their app, which is rare per the stated cold-consumer priority. Not
  worth doing.

## Suggested sequencing

**1 → 3 (comes along for free) → 4 → 2 → 5**, re-measuring via `packages/bundle-profiling` after
each landed step so every claimed gain stays honest — that's the entire purpose of the harness.

## Benchmarking discipline

Every item above gets a before/after measurement via `yarn benchmark` (run from
`packages/bundle-profiling`) — one command, four lines of output total, appended verbatim to
`packages/bundle-profiling/BENCHMARK_LOG.md` with a one-line description and commit hash. Kept
deliberately compact (min/max per scenario, not the full per-fixture table) so it stays cheap to
run repeatedly during the migration without bloating context. `yarn profile` / `yarn
profile:shared-react` (full per-fixture table, plus a `stats.json` for `yarn analyze`'s treemap)
remain available for deeper debugging when a number needs explaining.
