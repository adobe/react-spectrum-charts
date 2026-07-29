# File a Bug Issue

Use when a bug has been identified but won't be fixed immediately. Investigates the root
cause and writes a validated JSON `kind: "bug"` spec at
`planning/specs/<chartType>/issues/<slug>.json`. The spec is submitted as a PR like any
other; once merged, `implement-bug-fix` checks for it first (Step 0) and treats it as
authoritative starting context instead of rediscovering the same investigation.

Read `planning/specs/README.md` first (particularly "Kinds: feature vs bug" and the
`crossCutting` table) and `planning/specs/schema.json` for the exact field contract.

Do not implement the fix as part of this skill — the goal is a clear, actionable record for
later.

---

## Step 1 — Clarify scope

Confirm the symptom, the affected mark/hook/util, and what correct behavior looks like. Ask
if unclear. Determine the `chartType` (`bar`, `line`, `donut`, `area`, `scatter`, `combo`,
`bigNumber`, `bullet`, `venn`, or `chart` for a chart-level bug) — it determines the output
directory.

## Step 2 — Investigate

Spawn an Explore subagent to:
- Find the relevant source files for the reported area
- Read the encoding/logic for the affected behavior
- Compare against similar working code (e.g. line mark vs. line points, or the S2 sibling
  file if one exists) — this comparison is what populates `comparison` and often reveals
  the fix direction for free
- Note exact file paths and line numbers where the divergence is, or where the behavior is
  simply missing

If the root cause can't be confirmed (e.g. a layout/rendering bug with only a hypothesis),
say so plainly in `rootCause` rather than asserting a guess — use `openQuestions` for what's
left to verify.

Check whether the mark exists in both `vega-spec-builder` and `vega-spec-builder-s2` (or
the corresponding React packages) — this determines `requiresS1S2Parity`. A bug found in one
package doesn't automatically mean the other has it too; check directly, per the S2-parity
rule in `implement-bug-fix.md` ("apply the same fix unless the bug doesn't exist in s2 —
verify, don't assume").

## Step 3 — Write the spec

Fill out every required field from `schema.json`:

- `id`, `title`, `chartType`, `kind: "bug"`, `summary`
- `variant`: `"s1"`, `"s2"`, or `"both"` — whichever package variant(s) Step 2 confirmed the
  bug actually reproduces in. Don't default to `"both"` just because the mark exists in
  both packages — only use it once both have actually been checked. If only one has been
  checked, use that one and leave an `openQuestions` entry for the other, or set
  `crossCutting.requiresS1S2Parity: true` with a note.
- `status`: `"approved"` (default — means filed/open for a bug; see README.md)
- `complexity`: score (`1|2|3|5`) + a one-line rationale, using the rubric in README.md —
  score by how much the *fix* is expected to touch, not how hard the bug was to find
- `symptom`: 1-2 sentences, the observable/user-facing behavior
- `rootCause`: technical explanation with file:line references, from Step 2. If unconfirmed,
  state the leading hypothesis and say it's unconfirmed
- `comparison` (optional): populate when Step 2 found a clean working-vs-buggy contrast
  (e.g. what a comparable mark's encoding does vs. what the buggy one does)
- `crossCutting`: answer all six flags explicitly based on Step 2's exploration — never
  leave a flag `false` without having actually checked it against the code. Add `notes` for
  any flag that's `true`, and for `requiresS1S2Parity`, note whether the sibling package
  already has correct behavior (a reference to port from) or reproduces the same bug
- `implementationPlan`: one entry per file from Step 2. `change` describes the file's role
  (bug location vs. reference) and a proposed fix *direction* — not a committed
  implementation, since the fix hasn't been written
- `openQuestions`: anything unresolved, especially unconfirmed root causes or unverified
  S1/S2 parity

Write the file to `planning/specs/<chartType>/issues/<slug>.json`. `<slug>` is a kebab-case
derivation of the title.

## Step 4 — Validate and report

Confirm every field required by `schema.json` is present (including the `kind: "bug"`
conditional requirements — `symptom` and `rootCause`) and that `chartType`, `status`, and
`complexity.score` use only their allowed enum values.

Report a short summary: title, chart type, complexity score, whether root cause is
confirmed or hypothesized, and any `openQuestions` — the user submits this as a PR from
here.
