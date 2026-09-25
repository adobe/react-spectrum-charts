# Sankey Mark Feasibility — Grounded in Workspace's Flow Visualization

A feasibility and design study for a Sankey/flow mark in React Spectrum Charts (RSC), grounded in two
concrete reference points: (1) the full feature set of Adobe Analytics Workspace's existing "Flow"
visualization (a production Sankey-style diagram, in `aaui-web-spa`), and (2) RSC's *actual* shipped-mark
architecture (Bar, Combo, Donut, Venn, the interactive-mark system) — as opposed to relying on the
pre-alpha planning spec (`planning/specs/pre-alpha/sankey/add-sankey-mark.json`) as the sole design input.
Written 2026-08-26.

---

## 1. Why Workspace's Flow visualization is a useful reference

Workspace's Flow is a mature, production Sankey-style diagram (Analysis Workspace → Freeform panel →
"Flow" visualization type) that has been in the field long enough to have solved most of the hard edge
cases a generic Sankey mark would need to handle. Its full feature inventory (from code + tests + public
docs cross-check) breaks down as follows.

### 1.1 Feature inventory (aaui-web-spa)

**Anchor / configuration** — entry dimension ("Starts with"), exit dimension ("Ends with"), focus
dimension item ("Contains"), pathing dimension, build/cancel/reset with live validation. Calculated
metrics are explicitly disallowed as anchors; pathing dimension defaults to "Page" when a metric anchor
is used.

**Advanced settings** — wrap labels (disable truncation), include repeat instances (auto-disabled for
multi-valued dimensions), limit to first/last occurrence, number of columns (2–5, or 3–5 for focus flows),
items expanded per column (1–10, 5 shown by default), flow container (Visits/Visitors, or a B2B
account-hierarchy picker). Docs note number-of-columns × items-per-column determines the number of
underlying backend requests — i.e. these caps exist for query-cost reasons, not just visual ones.

**Node & column interactions** — click to expand/collapse a node or an entire column, "show next/previous
column" buttons, drag-and-drop dimensions/metrics onto columns with compatibility checks, root/focus-node
flagging (`*` prefix + "Path views" label), fixed-character-count label truncation (12 chars, 7-char tail)
unless wrap-labels is on, undo/redo for pivot/focus changes.

**Right-click context menu** — Focus on this node, Start over, Create segment for this path, Breakdown
(submenu), Filter/Edit/Remove column filter, Exclude item / Restore excluded items, Trend, Show
next/previous column, Hide column, dynamically-appended audience/publishing integrations.

**Chart rendering** — Sankey node/link SVG with metric-driven sizing, independent node and link ("path")
hover tooltips, an "Intelligent Captions" AI-narrative button.

**Non-chart layers** — AI Assistant / MCP tools (`aauiFlow_set`/`aauiFlow_expand`) for natural-language
creation, org/user default-container preferences, a `cja-b2b-account-hierarchy` feature flag gating the
container picker.

### 1.2 What this implies for a chart-library Sankey mark

Roughly a third of this list is generic chart-rendering surface (node/link geometry, value-proportional
sizing, tooltips, click-driven highlight, progressive reveal, label wrapping, color/theme) — a reasonable
scope for a chart-library mark. The rest — anchor/query semantics, the context-menu action set, undo/redo,
AI/MCP integration, preferences — is inherently host-application business logic tied to Workspace's
dimension/reportlet/segment model, and shouldn't be a chart library's concern regardless of what renders
the diagram.

| Feature | Where it belongs | Why |
|---|---|---|
| Node rects sized by flow value | Chart mark | Core rendering primitive, generic across any node-link data |
| Ribbon/link thickness proportional to value | Chart mark | Same — value-driven ribbon geometry |
| Separate node & link tooltips | Chart mark | Matches RSC's existing `ChartTooltip` per-mark pattern |
| Node/link click-to-pin highlight | Chart mark | Generic interaction primitive |
| Progressive node/column expansion | Chart mark, host supplies data | Host fetches more data and feeds it in; mark just renders what it's given |
| Wrap labels / truncation | Chart mark | Generic label-formatting concern |
| Show/hide tooltips | Chart mark (already implicit) | Opt-in via mounting a tooltip child, no extra work |
| Color scale / theme | Chart mark | Reuses existing color-scale infra |
| Column count / explicit column assignment | Host app → fed into mark as pre-computed structure | Tied to the host's query-cost model; see §3 |
| Anchor/query semantics, flow container, repeat-instance rules | Host app only | Business/query configuration, not a charting concern |
| Right-click menu actions (breakdown, filter, exclude, trend, segment creation, publishing) | Host app only | Needs the host's segment builder, sub-panel routing, publishing integrations |
| Undo/redo, AI/MCP integration, preferences, viz chrome (title/annotations) | Host app only | App-level state/automation/config, unrelated to chart rendering |

---

## 2. RSC's actual architecture (not the pre-alpha spec)

The pre-alpha spec (`planning/specs/pre-alpha/sankey/add-sankey-mark.json`, status `approved`, complexity
5/5 — the highest in the planning set) proposes a from-scratch layout algorithm and treats several things
as settled defaults. Reading the actual shipped marks gives a better-grounded design:

- **Raw Vega, not Vega-Lite.** Every mark builder (`addBar`, `addLine`, `addDonut`, …) in
  `packages/vega-spec-builder/` mutates a raw Vega `Spec` object directly (via `immer`'s `produce`),
  rendered through `vega-embed`. `vega-lite` is a peer dependency but isn't actually used by any spec
  builder — worth flagging as possibly stale.
- **Two live patterns for non-trivial geometry.** Donut computes arc angles via a declarative Vega `pie`
  transform + `formula` derived fields (`donutSpecBuilder.ts:128-151`) — fully expressible in Vega's own
  dataflow. Venn, by contrast, precomputes circle-packing/intersection geometry in a plain JS function
  (`getVennSolution`) and ships literal `{x, y, r, path}` values to Vega as a static `values:` data source
  (`vennSpecBuilder.ts:104-143`), bypassing Vega scales entirely for position. **Sankey layout belongs in
  the Venn bucket** — there's no Vega transform equivalent for column assignment + value-proportional
  vertical packing + variable-width curved ribbons (`linkpath` only draws a single-width connector line,
  not a value-sized filled band).
- **Combo proves multi-sub-mark composition works today.** `addCombo` (`comboSpecBuilder.ts:22-100`)
  reduces over heterogeneous sub-marks, calling `addBar`/`addLine` back-to-back against one shared `spec`
  object. Each sub-call independently computes its own `interactiveMarkName` and registers into
  `usermeta.interactiveMarks` — i.e. **two peer interactive sub-marks under one logical chart element is
  already a proven mechanism**, not something requiring new architecture. This directly answers the
  pre-alpha spec's `openQuestions` item asking whether the interactive-mark system needs changes to
  support a node layer + a link layer: it doesn't.
- **Tooltip/popover wiring is generic over any `{chartTooltips, chartPopovers, name}`-shaped options
  object** (`chartTooltipUtils.ts`, `chartPopoverUtils.ts`) — a node-layer and link-layer options object
  can each carry their own tooltip/popover config with zero changes to that machinery.
- **Right-click support already exists end-to-end** (`hasOnContextMenu` in `isInteractive`,
  `ContextMenuMode`, `ChartPopover`'s `rightClick` prop wired through a hidden trigger button in
  `ChartDialog`) — but it's hand-wired per mark (bar/line today), not a "any mark gets a menu for free"
  primitive, and there's no floating cursor-anchored menu UX, only the popover's anchored dialog.
- **Theming is a clean, reusable mechanism**: `colorScheme: 'light'|'dark'` flows through
  `getSpectrum2VegaConfig`/`getColorProductionRule`/`getS2ColorValue` — a new mark just accepts
  `colorScheme` in its options like every other mark does.
- **Static export already works**: `ChartHandle.getSvg`/`download`/`getBase64Png` wrap Vega's own
  `View.toSVG()`/`toImageURL('png')` — no new work needed for image export.

---

## 3. Proposed design (where it departs from the pre-alpha spec)

**Public API**: keep a single render-null `<Sankey>` component (matching the Donut/Bullet rc-status
precedent) — no need for a two-child public API the way Combo has one, since node+link is inherent to
what "Sankey" means.

**Internal architecture**: follow Combo's pattern, not a monolithic `addMarks`. `addSankey` calls
`addSankeyLinks(spec, …)` then `addSankeyNodes(spec, …)` against the same shared spec object (links under
nodes), each independently wiring its own interactive-mark name and tooltip/popover config. Low risk —
Combo already proves the mechanism.

**Layout math**: don't invent `assignColumns`/`packNodesInColumn`/`buildRibbonPath` from scratch as the
spec proposes. A production-hardened reference implementation already exists — Workspace's own
`d3.pathing()` (`aaui-web-spa/packages/ui-core/src/CloudViz.js:25637`), a hand-maintained fork of the
classic Bostock d3-sankey algorithm. Port its logic (not its d3 dependency — see §4) as a pure JS/TS
layout function that outputs literal node `{x, y, width, height}` and link path strings, following Venn's
JS-precompute-then-ship-as-static-values pattern:
  - `computeNodeValues` — node value = `max(sum of outgoing links, sum of incoming links)`, overridable by
    an explicit `total` field.
  - A single `ky` scale factor per render = `(available column height − padding) / that column's total
    node value`; node height = `value * ky` (with a floor), link thickness = `value * ky`.
  - A cubic-Bézier ribbon generator (curvature 0.5, control points via linear interpolation) with
    already-solved entry/exit stub-curve special cases (source or target is null).
  - A `relaxLeftToRight`/`relaxRightToLeft` + collision-resolution pass to reduce (not eliminate) visual
    crossing — **depart from the spec's "no crossing minimization" default**: this pass is existing,
    tested code, so shipping a deliberately worse layout than what Workspace users already have isn't
    justified.

**Column assignment — the one real design change worth proposing upstream**: the spec assumes columns are
always inferred via topological layering over a fully-loaded graph. A host like Workspace can't satisfy
that — its columns come from sequential, incrementally-fetched backend queries, and column identity is a
query-time concept, not something inferable from edges alone. Recommendation: accept an **optional
explicit `column` field per node** — if present, use it directly (serves incrementally-loaded
consumers); if absent, fall back to topological inference (serves simple, fully-loaded-graph consumers).
Strict superset of the current spec, small and well-scoped.

**Progressive expansion**: model as an externally-controlled data/`expandedNodes` prop — the consumer
fetches more data and re-renders — rather than mark-internal hop-expansion signal state. Matches how
Combo/Bar already expose `highlightedItem` as a controlled prop instead of owning selection state
internally, and keeps the mark a pure function of props.

**Net effect on the spec's complexity-5 rating**: the score assumes layout, ribbon geometry, and
progressive expansion are all unsolved research. With a working reference implementation available, the
genuinely novel RSC-specific work shrinks to: (1) dual-interactive-sub-mark wiring (low risk, proven by
Combo), (2) the explicit-vs-inferred column option (small, scoped), (3) porting the layout+ribbon math into
the Venn-style JS-precompute shape (mechanical port + tests, not new algorithm design). The spec's cyclic
source/target open question is largely moot for a checkpoint-tree-style host (inherently acyclic); still
worth a defensive drop-back-edge-with-warning for other consumers.

---

## 4. Does RSC use d3? (matters for porting the layout math)

Checked directly rather than assumed. RSC's own source code has **no direct d3 usage for layout or
geometry** — the only direct import anywhere is `d3-format` (2 files, `expressionFunctions.ts` in both
`vega-spec-builder` and `vega-spec-builder-s2`), used purely for locale-aware number formatting.

`d3-array`, `d3-interpolate`, `d3-shape`, `d3-force`, `d3-scale`, `d3-quadtree` etc. *are* present in
`node_modules`, but only as **transitive** dependencies of Vega itself (e.g. `vega-statistics` declares
`d3-array` in its own dependencies). RSC's code never imports them, and — tellingly — **Venn's own
geometry code doesn't either**, even though d3-array/d3-shape are sitting right there in the tree. The
established convention in this codebase is to write custom precomputed-geometry math in plain TypeScript.

Workspace's `d3.pathing()` only uses a handful of d3 calls: `d3.sum`, `d3.min`, `d3.max`,
`d3.nest().key().sortKeys(d3.ascending).entries()` (grouping — itself an old, since-removed d3 v3/v4 API),
and `d3.interpolateNumber`. Every one is a few lines of dependency-free TypeScript (`reduce` for
sum/min/max, a `Map`-based group-by-then-sort, linear interpolation is a one-liner). **Conclusion: port the
algorithm, not the d3 calls** — rewrite this layout math as plain TS, consistent with how Venn already
handles its own non-trivial geometry, rather than adding `d3-array`/`d3-interpolate` as new direct
dependencies just to reuse a handful of one-liners.

---

## 5. Dependencies & gotchas for building this in RSC

Verified directly against RSC source, ordered by severity. (One item — a React-17-vs-19 host compatibility
question — is intentionally omitted here because it's about a *specific* downstream consumer's upgrade
timeline, not a property of RSC itself; it would apply to any host still on React 17 and should be
revisited if/when a specific integration is planned.)

1. **No incremental view-update path (the standout finding).** `VegaChart` fully destroys and recreates
   the Vega `View` on every spec/data change
   (`packages/react-spectrum-charts-s2/src/VegaChart.tsx:124-174`) — there is no `view.change()`/patch
   code path anywhere in the library. A "progressive column/node expansion" interaction (adding
   nodes/links to an already-rendered chart) would, as RSC is architected today, force a full re-embed
   with no smooth transition. The existing hover/draw-in animation engines
   (`hoverAnimationUtils.ts`, `drawInAnimationUtils.ts`) only animate a static spec's own properties
   (opacity, stroke, draw-in cutoff) — they don't address structural data growth. This is genuinely new
   engineering, and it's a library-wide gap, not Sankey-specific; the pre-alpha spec's `openQuestions`
   don't mention it at all.

2. **No existing many-element-mark precedent.** No current mark renders anywhere near a Sankey's likely
   element count (on the order of 100 marks for a modestly-sized flow). Docs recommend Canvas rendering
   only above ~10K rows (`packages/docs/docs/api/Chart.md:3-13`), so this is comfortably under that
   threshold — likely fine on the default SVG renderer, just untested territory in this codebase.
   `renderer="canvas"` is available as a documented fallback if ever needed.

3. **Right-click menus are achievable but bespoke per mark, not generic.** `isInteractive`/
   `getInteractiveMarkName` already treat `hasOnContextMenu` as first-class
   (`markUtils.ts:194-215`, `:527-545`), and `ChartPopover` has a `rightClick` prop wired through a hidden
   trigger button in `ChartDialog` (`RscChart.tsx:159-166,203-209`). But there's no shared "any mark gets
   a context menu for free" primitive, and no floating cursor-anchored menu UX exists — only the popover's
   anchored-dialog positioning, which a Sankey context menu would extend rather than reuse wholesale.

4. **Accessibility is essentially unaddressed at the mark level.** The only ARIA-related code found
   actively opts an element *out* of the accessibility tree (`aria-hidden="true"`, `tabIndex={-1}` on the
   hidden popover trigger, `RscChart.tsx:206-207`). No keyboard handlers exist anywhere in the
   mark/interaction system. Docs claim keyboard-navigation and screen-reader support
   (`packages/docs/docs/api/visualizations/Line.md:268-275`) that isn't backed by any code found. Real
   a11y parity for a Sankey (likely required for enterprise adoption) is net-new work.

5. **No RTL/bidi support at all.** Locale handling (`packages/locales/src/locale.ts`) covers number/date
   formatting only — no `dir`, no mirroring, no RTL concept anywhere in the repo. A left-to-right flow
   diagram would need entirely new logic to mirror for RTL locales, with zero existing primitives to hook
   into.

6. **Label-truncation utilities exist but assume the wrong layout shape.** `getLabelWidth` (canvas
   `measureText`, `expressionFunctions.ts:256-270`) and the legend's `fitsWhenWrapped`/`getFairShareWidth`
   wrap-fit logic (`legendUtils.ts:195-268`) are real, reusable pixel-measurement primitives, but they're
   shaped for legend/axis layout constraints, not a Sankey node's dynamic per-node width. Expect to reuse
   `getLabelWidth` as a primitive and write new fitting logic on top, not reuse the wrap-fit logic
   wholesale.

7. **No visual-regression safety net.** CI (`.github/workflows/pr-checks.yml`) runs lint/Jest/Sonar/
   build/Storybook-build only — no Chromatic/Percy/pixel-diffing. Layout correctness (node packing,
   ribbon geometry) would rely entirely on unit tests during development.

8. **`vega-embed` is peer-only, unpinned anywhere in RSC's own repo** — a latent version-drift risk for
   any new mark touching `View` APIs (export, resize, signal updates), relevant here since a Sankey mark
   would lean on `View` for its export path.

**Non-issues, checked and confirmed fine:** theming (light/dark) has a clean reusable mechanism already;
static PNG/SVG export works today with zero new work.

**Net read**: item 1 (no incremental view-update path) is the one finding that most changes the calculus —
progressive expansion isn't just a data-modeling question (§3's column-assignment discussion), it also
needs RSC to solve a library-wide architectural gap. Items 2, 4, 5, 6, 7 are real but second-order —
additional engineering cost, not blockers to scoping the work.

---

## 6. Bottom line

A Sankey mark is technically feasible in RSC, and roughly a third of Workspace Flow's feature set (node/
link rendering, tooltips, click-to-pin, progressive expansion, label wrapping, theming) maps cleanly onto
what a chart-library mark should own — with a working reference implementation (Workspace's own
`d3.pathing()`) available to de-risk the layout algorithm, rather than treating it as unsolved research the
way the pre-alpha spec's complexity-5 rating implies. The remaining two-thirds of Flow's feature set is
host-application business logic (anchor/query semantics, the context-menu action set, undo/redo, AI/MCP
integration, preferences) and should stay there regardless of what renders the diagram. The two things
most worth raising with the RSC team before implementation starts: (a) the mark's planned topological
auto-column-assignment doesn't fit a server-driven, incrementally-loaded host — an optional explicit
`column` field is a small, strict-superset fix — and (b) RSC has no incremental Vega-view-update path
today, which progressive node/column expansion will need regardless of which specific mark surfaces it
first.
