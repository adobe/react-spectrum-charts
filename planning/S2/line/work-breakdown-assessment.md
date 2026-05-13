# S2 Line Feature Work Breakdown — Assessment

**Source material**: Figma analysis (planning files in this directory) + transcript of May 11 2026 planning session (Connor Lamoureux, Madeline Luke).

The transcript cutoff is at **57:03** ("verbal marker here that everything we discuss after this is not relevant to the align feature work"). Everything after that is about a D3 exploration and is excluded.

---

## Corrections to Existing Planning Files

### `forecast-pattern.md` — WRONG STATUS
**Currently marked `supported`. Should be `new`.**

The transcript is explicit: "Forecast is technically possible with current features as is, but we should really have a cleaner API." The decision reached in the meeting: implement as a **child component** of `<Line>`, not a composition of existing props.

Design decisions made in the transcript:
- Child component approach (not an object prop on Line, not multiple flat props)
- Component needs: a `metric` key (for the forecast data key, may differ from the main line metric) and a `start` value to define where the forecast begins
- Default line type: dotted
- Two Vega line marks underneath: one solid (historical), one dotted (forecast)
- Label: custom text, pinned positionally to the reference line (not the line mark itself), hidden if there's insufficient horizontal space
- The reference line for the forecast boundary is **not** reusing `<ReferenceLine>` — it's drawn internally by the forecast component
- Unknowns still open: whether the component should be named `<LineForecast>` or something more generic; whether the forecast start can use a different data key than the dimension

→ Update `forecast-pattern.md` to `new` and add implementation notes reflecting the child-component decision.

---

### `line-width.md` — UNDER-SCOPED
**Captured the line weight mismatch (default should be 'L' not 'M') but missed the broader design decision.**

The transcript introduces a **chart size prop** (`small` / `medium` / `large`) that should automatically control:
- Line weight (3px large, 2px medium, 1.5px small)
- Direct label font size and font weight
- Static point (endpoint dot) size

This is a prerequisite for all three of those downstream features. The `line-width.md` file describes one side effect of missing this prop; the actual ticket should be the chart size prop itself.

→ The `line-width.md` framing is still valid as a gap description, but the implementation direction should point at a chart size prop as the root fix. There's also an open question noted in the transcript: does the chart use automatic CSS/container-query-based breakpoints, or does the user always explicitly set the size? Design check needed.

---

### `point-annotations.md` — UNDER-ESTIMATES COMPLEXITY
**Classification as `new` is correct, but the implementation picture is incomplete.**

Key transcript additions:
- "Custom annotation on the chart. Last thing we're going to write, no matter what, for line support." — explicitly deprioritized to the end of all line work.
- The implementation may not live inside the RSC library at all. Connor's proposal: a **separate package** (in the monorepo, keeping it open source) that wraps RSC and adds an annotation overlay on top of the rendered SVG — outside the Vega spec layer entirely. This is architecturally different from a `<LinePointAnnotation>` child component inside Vega.
- Requires a **dedicated design meeting** before implementation begins. Open questions: arrow direction (auto or explicit), text overflow handling, what happens with a center-of-line point, rich text / line breaks.
- The current design shows arrows and freeform text labels — Connor notes "the arrow goes into what we would consider the text block if we're engineering this" — arrow/label collision is unsolved.

→ Update `point-annotations.md` to note: deprioritized to last, separate package candidate, design meeting required before implementation, research spike first.

---

## Missing Planning Files

### 1. `series-overflow.md` — NEW (missing entirely)

Discussed at length for the "Best-selling video games" chart where gray lines at the bottom are an "other" bucket.

Feature: a `maxSeries` (or similar) prop on `<Line>` that:
- Shows the first N series using normal styling
- Buckets all remaining series into a single "other" category
- Lets the user name the other category (e.g., "Other video games")
- Default color for the other bucket: gray (Spectrum token)
- Optional custom color override
- Deprioritizes/de-emphasizes the other lines — lower opacity
- Direct labels on the other-bucket lines: either suppressed by default, or with a separate toggle

Open design questions (need to check with design team):
- What does hover look like for other-bucket lines? Do they all highlight at the same time? Do they stay solid while primary lines go opaque?
- What happens to the legend when "Tetris" is clicked/hidden — do lines from the "other" bucket auto-promote?
- Does the legend show an expandable "Other" bucket or always just show the bucket label?

Connor's verdict on the legend expand/collapse: "at least for the first pass, I don't think we're going to get into any architectural holes if we don't do that ahead of time. Let's just do it as is, but mark that as a reach out to design for further review."

---

### 2. `legend-alignment.md` — NEW (missing entirely)

Noted at 43:50 while reviewing the "Best-selling video games" chart where the legend is left-aligned (versus the typical centered placement).

Feature: legend alignment prop supporting `start`, `center`, `end` (or `left`, `center`, `right`) for horizontal legends, and `top`, `center`, `bottom` for vertical legends.

Connor noted there was already an attempt at implementing left-align that hit what appeared to be a Vega bug.

---

### 3. `chart-size.md` — NEW (missing entirely, blocks several other features)

The transcript introduces this as a foundational piece required by multiple downstream features. A `size` prop on `<Chart>` (or `<Line>`) with values `small` / `medium` / `large` that automatically adjusts:
- **Line weight**: L=3px, M=2px, S=1.5px
- **Direct label font size** and potentially font weight
- **Static point (endpoint dot) size** — current implementation only has medium; small needs a scaled-down version

Auto breakpoints vs explicit: the team discussed potentially doing both (automatic based on container size, with explicit override). Decision: needs a design check with Alan. Don't hard-code before confirming.

This ticket blocks:
- The line weight fix (currently `line-width.md`)
- Direct label font size scaling (currently described in the transcript but not in any planning file)
- Static point size scaling

---

### 4. `multi-dimension-faceting.md` — INVESTIGATION-NEEDED (missing)

Discussed for the "Chrome users outperform Safari users in 2023 and 2024" chart which shows 4 lines where the legend is year-based (2023/2024) but the series are browsers (Chrome/Safari). The dataset effectively has two splitting dimensions: browser and year.

Connor: "We don't support that in S1 as far as I can remember. I think that's going to be pretty doable but will require a more ambiguous ticket — someone takes a 3-pointer and figures out how to do this, and then whatever API makes sense based on what you figure out is what we're going to do."

This is a research spike — the API design is TBD.

---

### 5. `secondary-reference-line.md` — NEW (missing)

Discussed while reviewing the line weight/style section where a black secondary reference line is shown used as a trendline/average line.

Two sub-features:
1. **Secondary reference line**: a `secondary: boolean` prop on `<ReferenceLine>` that uses a lighter/secondary visual style. The existing `<ReferenceLine>` component already exists; this is an additive prop.
2. **Trendline style override**: In S1, trendlines follow the style of the series they're connected to (e.g., purple line → purple trendline). In the S2 design, trendlines show as a black secondary reference line. Need a prop or default behavior change for trendlines in S2 to use this secondary style. Connor: "We'd have some kind of prop for match style for the line" — allow opting back in to series-color trendlines if needed.

---

### 6. `reference-line-gap.md` (or add as a known issue) — INVESTIGATION-NEEDED

Discussed at 9:11-9:47 for the reference line carets (triangle arrowheads). The gap between the carets and the center line of the reference line is transparent, meaning content underneath shows through. Connor noted this may be undesirable and the fix would be to draw a background line in the chart background color to mask behind the gap.

Decision needed: design check with Alan on whether the see-through gap is intentional.

---

## Items Confirmed Correct

The following classifications in the existing planning files are confirmed by the transcript:

| File | Status | Transcript confirmation |
|---|---|---|
| `direct-label.md` | `supported` | "Direct labels, we've done some work on" — confirmed supported |
| `gradient-fill.md` | `supported` | Not discussed in detail, implicitly confirmed |
| `sparkline.md` | `supported` (core) | Confirmed basic sparkline is in S2 |
| `multi-series-line-type.md` | `supported` | "Lines are differentiated by line type, which we do support" |
| `hover-interactions.md` | `supported` | Confirmed; discussion about behaviors planned for afternoon session |
| `null-values.md` | `supported` | No contradicting discussion |
| `trellis.md` | `new` | "Five point research spike for trellis small multiple line charts" |

Note on `direct-label.md`: The transcript adds nuance — **dynamic auto-positioning** for 3+ series may need work ("if there's two, the top one is on top, the bottom one is on the bottom; if there's three, they should all be top"). Also, **direct label positioned left of the point** (not at end) was noted as possibly unsupported and needs a code check. These are additive details to the existing `direct-label.md`, not contradictions.

---

## Proposed Work Breakdown

### Phase 0 — Foundation (blocks everything else)

1. **Chart size prop** — `small`/`medium`/`large` on `<Chart>` that auto-adjusts line weight, label font size, static point size. Design check needed on auto-breakpoint behavior. *(3–5 points, research involved)*

2. **Reference line transparency fix** — background masking for carets. *(1 point, pending design confirmation)*

---

### Phase 1 — Core line features

These can proceed in any order once Phase 0 is done.

3. **Forecast child component** (`<LineForecast>`) — new child component, solid+dotted Vega marks, reference line pinned label. *(3–5 points)*

4. **Series overflow / "other" bucket** — `maxSeries` prop, bucketing, gray default color, hover/legend behavior TBD with design. *(3–5 points)*

5. **Legend alignment** — `start`/`center`/`end` prop. Confirm Vega bug workaround needed. *(2–3 points)*

6. **Secondary reference line** — `secondary` prop on `<ReferenceLine>` + trendline style override for S2. *(2 points)*

7. **Direct label position variants** — confirm left-of-point support, fix if missing. *(1–2 points)*

---

### Phase 2 — Research spikes

8. **Multi-dimension faceting** — Research spike: how to split series by two dimensions (e.g., browser × year → 4 lines with year-based legend). API TBD. *(3 points research, then implementation)*

9. **Trellis / small multiple layout** — Research spike, already noted. *(5 points research, then implementation)*

---

### Phase 3 — Last / complex

10. **Point annotations** — Design meeting first. Architecture decision (in-library Vega mark vs. SVG overlay package). If separate package: scoped outside this ticket set. *(spike → TBD)*

---

## Items Requiring Design Check with Alan

- Reference line transparency: intentional see-through gap or should it be masked?
- Forecast label: hide when space is insufficient, or truncate?
- Series overflow legend: expandable "other" bucket or always flat?
- Chart size: auto-breakpoints vs. explicit prop, or both?
- Hover behavior for "other" bucket lines: individual or batch?

---

## Direct Transcript Quotes on Key Decisions

**On forecast API:**
> "Object, child, or multiple forecast props on the line. I think child means we can just manage that, manage its own state pretty cleanly."

**On point annotations priority:**
> "Custom annotation on the chart. Last thing we're going to write, no matter what, for line support. We're going to have to have a meeting with design to talk through all the different scenarios."

**On trellis:**
> "Probably a five-point research spike for trellis small multiple line charts. One of us will go do some more digging and prototype some stuff and then we'll come back and make some decisions."

**On multi-dimension faceting:**
> "I think that's going to be pretty doable but will require a more ambiguous ticket — I think we'll have to have somebody take a three-pointer or something and just figure out how to do this."

**On chart size:**
> "We need to have a small, medium, large version of the line charts. So someone can choose I want this to be a small chart. We're going to automatically change things like the line weight based on that."
