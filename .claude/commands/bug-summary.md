# Bug Issue Summary

Use when asked for a quick status scan of currently open bug issue specs (`/bug-summary`).
Optional `$ARGUMENTS` narrows to a single `chartType` (e.g. `/bug-summary line`).

## Step 1 — Collect open specs (compact)

Run `node scripts/listOpenIssues.js` (append the chartType as an argument if `$ARGUMENTS`
names one, e.g. `node scripts/listOpenIssues.js line`). This finds every
`planning/specs/<chartType>/issues/*.json` file, excluding anything under an `implemented/`
subdirectory, and prints a JSON array with only the fields the Step 3 report line actually
uses (`id`, `chartType`, `variant`, `complexityScore` for the bolded header, and `symptom`,
`rootCause`, `openQuestions` for the summary sentence), plus `title` for human scanning. It
omits `summary`/`comparison` (redundant with the more detailed `symptom`/`rootCause` fields
for bugs — read a specific issue's `summary` directly from its full file if it seems
relevant to confirm something), `status` (near-constant — every open issue here is
`"approved"`), `lastUpdated`, and the bulky
`implementationPlan`/`crossCutting`/`edgeCases`/`designTokens`/`references`.

Entries are sorted ascending by file path (e.g. `planning/specs/bar/issues/foo.json` before
`planning/specs/line/issues/bar.json`) with a sequential `n` assigned in that order. This
ordering is reproducible on a later run over the same spec set, so a follow-up command given
a bare id (e.g. "spec 3") can re-run this same script to resolve which file it refers to.

Consult `planning/specs/schema.json` if a field's meaning needs clarifying (e.g.
`complexity.score`, `variant`, `crossCutting`).

## Step 2 — Read a full spec only if genuinely needed

The compact fields from Step 1 are enough for almost every summary. Only `Read` a specific
issue's full JSON file (by its `file` path from Step 1's output) if its `symptom`/`rootCause`
still leave the bug's state genuinely unclear — this should be rare.

## Step 3 — Report

Group output by `chartType`. For each issue, produce one bolded line followed by a tight
2-4 sentence summary, in this exact shape:

```
**[N] `id`** (variant, complexity N) — one clause naming the symptom, then 1-3 sentences on
the confirmed/suspected root cause and how settled the investigation is (e.g. "root cause
unconfirmed, needs repro on main first" vs. "fully scoped, single-line fix").
```

`[N]` is the sequential id assigned in Step 1 (not the complexity score — the two numbers
are unrelated and both appear on the line, so don't conflate them).

Keep summaries compressed — this is a scan, not the full spec. Never print raw JSON or dump
full spec fields. If nothing matches, say so plainly rather than returning an empty response.

End with a one-line total, e.g. "5 open issues across bar, line, chart."
