# Native Pattern-Fill Support in Vega — Tracking Notes

> **Status: Superseded by an existing upstream PR — do not file a new proposal.**
> `vega/vega#4290` ("feat: Pattern Fills (#1372)", opened 2026-07-13 by `dm-p`, open/unmerged as of writing) already implements substantially the same design this document originally proposed, in far more depth. This file now tracks that PR and records where our own implementation experience is (and isn't) relevant feedback for it, rather than pitching a fresh design.

---

## Background

- `vega/vega#1372` (opened 2018) is the long-running design discussion for pattern/texture fills. It converged years ago on "proposal B": a pattern is an **object-valued fill/stroke in the gradient family** — usable anywhere a color is (mark encode values *and* scale range literals) — mirroring how `Gradient` already works. Proposal A (a `repeat`-flag on the `image` mark) was explicitly rejected by the maintainers because it can't apply to arbitrary marks (e.g. area/rect via a plain color-style fill).
- `vega/vega#4290` is a full implementation of proposal B, submitted by the maintainer of Deneb (a JSON-only Vega consumer embedded in Power BI), migrating a pattern-fill feature that had existed as a Deneb-only hack for years. It is under active review; the maintainer (`hydrosquall`) has asked to scope the first merge down (defer the public JS extensibility registry, keep the spec-side `pattern()` expression function).

This means the gap our original draft was written to close — no native `Pattern` value type, no canvas-side resolution — already has a concrete, in-flight upstream fix. Filing a second, competing proposal would be redundant and unhelpful to the maintainers.

---

## What #4290 does (verified from the PR body/diff, not assumed)

- New `vega-pattern` package (TypeScript) with a named-pattern registry, mirroring `scheme()`'s runtime-registration shape (`vega.pattern(name, def)`).
- Four spec-level pattern variants, all nested under a `pattern` key exactly like `Gradient`'s `gradient` key: `name` (registry lookup), `shape` (inline SVG path in tile coordinates), `rule` (analytic angled-line generator), `url` (image tile).
- Common properties: `foreground`, `background`, `strokeWidth`, `origin: "view" | "mark"`, `scale`, `shapeRendering`.
- Usable in mark `fill`/`stroke` encode values **and directly as scale range entries**, mixed with plain color strings — this is the "pattern as a facet/scale" mechanism our own `pattern` prop needed, done natively.
- A `pattern()` expression function (the `gradient()` analog) for composing a pattern from signal expressions — e.g. binding foreground to a separate color scale: `pattern(scale('tex', datum.type), {foreground: scale('color', datum.group)})`.
- Two built-in ordinal schemes: `"patterns"` (texture-only) and `"monochrome"` (greyscale + texture, for print/grayscale-safe redundant encoding).
- Legend swatches render patterns natively, in both renderers.
- Canvas and SVG renderers produce parity output; canvas positioning is **raster-baked** (tile rasterized once, phased via `drawImage`) rather than using `CanvasPattern.setTransform`, specifically to work around `node-canvas`'s lack of a global `DOMMatrix` and broken `repeat-x`/`repeat-y` modes — an environment constraint, not a browser limitation.
- `docs/types.md` gets a `Pattern` reference section structured like the existing `Gradient` entry, plus scale-range and scheme docs.

---

## Where this lines up with (and diverges from) our own implementation

| Concern | Our implementation | `#4290` |
|---|---|---|
| Value model | String-convention hack (`getPatternFillUrl(id)` strings resolved by intercepting `ctx.fillStyle` from outside Vega) | Native object-valued type in the gradient family — exactly what our draft proposed adding |
| Color-matching a pattern to a sibling color | Runtime string-parsing fallback (`baseId::color` composite id, resolved by a canvas-layer registry lookup) | First-class `foreground`/`background` properties on the pattern object itself, resolved by Vega's own encode/scale pipeline |
| Pattern as a scale range | Ordinal scale range of literal `getPatternFillUrl()` strings (works today only because Vega ordinal ranges are literal arrays) | Same idea, but native — range entries can be pattern objects directly, or one of two built-in schemes |
| Canvas tile positioning | `CanvasPattern.setTransform()` for rotation, DPR read directly off `canvas.width / canvas.clientWidth` | Raster-baked tiles, no `setTransform`, specifically because of `node-canvas` gaps — worth flagging in review that a real-browser canvas has `DOMMatrix` and working `repeat-x`/`repeat-y`, so this constraint may be `node-canvas`-only, not universal (relevant only if headless/`vg2png` output quality is ever in question for browser-rendered use) |
| Dodge+stack / dual-facet composition | Built and tested end-to-end on top of Vega's existing scale/dodge machinery — no Vega changes needed for this part, since it was always a spec-authoring problem, not a rendering one | Not this PR's concern — dual-facet dodge/stack composition happens one layer up (in the spec builder), so `#4290`'s scale-range support is sufficient to keep supporting it once adopted |

The two open items our four-gaps list from earlier (string→type, real SVG support, generic tile-source API, first-class color-matching) are **all addressed** by `#4290` except "generic tile-source API" — its `shape`/`rule`/`url` variants cover hand-authored and image-based tiles but not an arbitrary `render(context)` callback. That's a reasonable scope cut for a first merge, not a gap worth raising, since embedding executable render callbacks in a JSON spec is a materially different (and JSON-unfriendly) API surface than what Deneb/PowerBI's JSON-only consumers need.

---

## Recommended next steps

1. **Do not file a new issue or PR.** Track `vega/vega#4290` instead.
2. If/when we want to contribute review feedback, it should draw only on verified, generic implementation experience (DPR-correct tile sizing, color-matched pattern/solid pairing, dual-facet scale composition) — not name our product internally, consistent with how any public GitHub comment would read.
3. Once `#4290` merges, plan a follow-up spec to **replace our string-convention interception layer** (`canvasPatternFillUtils.ts`, `patternFillUtils.ts`, the `packages/utils/src/patternFillId.ts` convention) with direct use of the native `Pattern` value type in scale ranges and encode values — this removes the `fillStyle`-patching mechanism entirely once the underlying Vega version is adopted.
4. No action needed on our own SVG-parity phase (step 4 of the original 6-step plan) purely for upstream-contribution purposes — that motivation is now moot. It may still be worth doing independently if SVG rendering is required before `#4290` lands and is adopted.
