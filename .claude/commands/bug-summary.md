# Bug Issue Summary

Use when asked for a quick status scan of currently open bug issue specs (`/bug-summary`).
Optional `$ARGUMENTS` narrows to a single `chartType` (e.g. `/bug-summary line`).

## Step 1 — Collect open specs

Find every `planning/specs/<chartType>/issues/*.json` file, excluding anything under an
`implemented/` subdirectory — those are closed and out of scope for this summary. If
`$ARGUMENTS` names a chartType, restrict to `planning/specs/<chartType>/issues/*.json` only.

Sort the matched file paths ascending (plain string sort on the relative path, e.g.
`planning/specs/bar/issues/foo.json` before `planning/specs/line/issues/bar.json`) and
assign each a sequential id starting at 1, in that sorted order. This ordering must be
reproducible on a later run over the same spec set — don't number by discovery order,
read order, or complexity — so that a follow-up command given a bare id (e.g. "spec 3")
can re-run this same collect-and-sort step to resolve which file it refers to.

Consult `planning/specs/schema.json` if a field's meaning needs clarifying (e.g.
`complexity.score`, `variant`, `crossCutting`).

## Step 2 — Read each spec

Read every matched file in full — don't rely on `summary`/`rootCause` alone if `symptom` or
`comparison` adds context needed to describe the bug accurately.

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
