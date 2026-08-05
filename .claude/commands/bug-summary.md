# Bug Issue Summary

Use when asked for a quick status scan of currently open bug issue specs (`/bug-summary`).
Optional `$ARGUMENTS` narrows to a single `chartType` (e.g. `/bug-summary line`).

## Step 1 — Collect open specs

Find every `planning/specs/<chartType>/issues/*.json` file, excluding anything under an
`implemented/` subdirectory — those are closed and out of scope for this summary. If
`$ARGUMENTS` names a chartType, restrict to `planning/specs/<chartType>/issues/*.json` only.

Consult `planning/specs/schema.json` if a field's meaning needs clarifying (e.g.
`complexity.score`, `variant`, `crossCutting`).

## Step 2 — Read each spec

Read every matched file in full — don't rely on `summary`/`rootCause` alone if `symptom` or
`comparison` adds context needed to describe the bug accurately.

## Step 3 — Report

Group output by `chartType`. For each issue, produce one bolded line followed by a tight
2-4 sentence summary, in this exact shape:

```
**`id`** (variant, complexity N) — one clause naming the symptom, then 1-3 sentences on the
confirmed/suspected root cause and how settled the investigation is (e.g. "root cause
unconfirmed, needs repro on main first" vs. "fully scoped, single-line fix").
```

Keep summaries compressed — this is a scan, not the full spec. Never print raw JSON or dump
full spec fields. If nothing matches, say so plainly rather than returning an empty response.

End with a one-line total, e.g. "5 open issues across bar, line, chart."
