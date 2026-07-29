# Generate a Chart Feature Spec

Converts gathered design tokens and requirements into a validated JSON `kind: "feature"`
spec at `planning/specs/<chartType>/<slug>.json`. The spec is submitted as a PR; once
approved, the `implement-new-prop` / `implement-new-chart-mark` / `implement-new-child-component`
skills read it as the authoritative source of requirements, edge cases, and implementation
plan.

This skill is for not-yet-built features only. For a bug in existing behavior, use the
`file-issue` skill instead — it produces a `kind: "bug"` spec at
`planning/specs/<chartType>/issues/<slug>.json`.

Read `planning/specs/README.md` first — it documents the complexity rubric, the edge-case
checklist, and the `crossCutting` flags referenced below. Read `planning/specs/schema.json`
for the exact field contract.

`$ARGUMENTS` is whatever the gathering phase produced — freeform text, a path to a notes
file, a Jira ticket reference, a Figma link, or a combination. Don't assume a fixed upstream
shape; the gathering process this feeds from is not stable tooling yet.

---

## Step 1 — Read the gathered material

Parse `$ARGUMENTS` for:
- The target chart type (`bar`, `line`, `donut`, `area`, `scatter`, `combo`, `bigNumber`,
  `bullet`, `venn`, or `chart` for a chart-level feature)
- Whatever requirements/design tokens were gathered — read any referenced notes file,
  fetch the Jira ticket via `mcp__corp-jira__*` if a ticket ref is given, or fetch the
  Figma node via `mcp__figma__*` if a Figma URL is given

If the chart type is ambiguous or missing, ask before proceeding — it determines both the
output directory and which existing code to read next.

---

## Step 2 — Explore the relevant code

Read the target mark's `*Options`/`*SpecOptions` types
(`vega-spec-builder/src/types/marks/<mark>Spec.types.ts`) and its spec builder file(s)
(`vega-spec-builder/src/<mark>/<mark>SpecBuilder.ts` and related `*Utils.ts` files) — the
same files `implement-new-prop.md` and `implement-new-chart-mark.md` point to. This grounds
the implementation plan in real file paths and informs the complexity score.

If the feature plausibly touches hover animation, controlled highlight, legend interaction,
or tooltip/popover wiring, read the corresponding mechanism directly rather than guessing:
`hoverAnimationUtils.ts`, the `CONTROLLED_HIGHLIGHTED_TABLE`/`SERIES` usages in the mark's
mark-utils file, `legendHighlightSignals`, and `isInteractive`/`interactiveMarkName`
respectively (see `crossCutting` table in `README.md`).

Check whether the mark exists in `vega-spec-builder-s2` — if the s1 file you're reading has
a sibling there, `requiresS1S2Parity` is likely `true`.

---

## Step 3 — Write the spec

Fill out every required field from `schema.json`:

- `id`, `title`, `chartType`, `kind: "feature"`, `summary`
- `variant`: `"s1"`, `"s2"`, or `"both"` — whichever package variant(s) Step 2's exploration
  and the resulting `implementationPlan` actually target. See README.md's `variant` section
  for how this differs from `crossCutting.requiresS1S2Parity`.
- `status`: `"approved"` (default — see README.md for why there's no draft/in-review state)
- `complexity`: score (`1|2|3|5`) + a one-line rationale, using the rubric in README.md
- `requirements`: the behavior requirements from Step 1, as discrete bullets
- `designTokens` / `references`: from Step 1, if any were gathered
- `edgeCases`: walk the checklist in README.md against this specific feature — don't include
  entries that don't apply, but do check each one
- `crossCutting`: answer all six flags explicitly based on Step 2's exploration — never
  leave a flag `false` without having actually checked it against the code. Add `notes` for
  any flag that's `true`.
- `implementationPlan`: one entry per file from Step 2, each with a `change` description and
  an approximate `lines` range where you have one
- `openQuestions`: anything you couldn't resolve from the gathered material

Write the file to `planning/specs/<chartType>/<slug>.json` — the base directory, never
`implemented/`, since a freshly generated spec is by definition not yet built. `<slug>` is a
kebab-case derivation of the title.

---

## Step 4 — Validate and report

Confirm every field required by `schema.json` is present and that `chartType`, `status`,
and `complexity.score` use only their allowed enum values.

Report a short summary: title, chart type, complexity score, number of implementation-plan
entries, and any `openQuestions` — the user submits this as a PR from here.
