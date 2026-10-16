# File an Issue

Use when a bug or small feature has been identified but won't be done immediately.
Investigates it and drafts a GitHub issue. Significant or uncertain changes need an RFC
instead; use `write-rfc`.

Read `planning/README.md` first, particularly "Issues" and "Cross-cutting concerns."

Don't implement the fix as part of this skill. The goal is a clear, actionable issue.

---

## Step 1 — Clarify scope

Confirm the symptom or request, the affected component, and what correct behavior looks
like. Ask if any of these are unclear.

Search existing issues before investigating, so you don't file a duplicate:

```bash
gh issue list --repo adobe/react-spectrum-charts --state all --search "<keywords>"
```

If a matching issue exists, update or comment on it instead of filing a new one.

## Step 2 — Investigate

If the environment provides a semantic code-search or navigation tool (e.g. an MCP-based
code index), prefer it over manual grep/read for locating symbols and tracing call paths.
Otherwise, spawn an Explore subagent to:
- Find the relevant source files for the reported area
- Read the encoding/logic for the affected behavior
- Compare against similar working code (e.g. line mark vs. line points, or the S2 sibling
  file if one exists). This comparison often reveals the fix direction.
- Note exact file paths and line numbers where the divergence is, or where the behavior is
  missing

For bugs, reproduce on current `main` when you can (a story, a test, or a browser check). If
the root cause can't be confirmed, say so plainly and give the leading hypothesis.

Check whether the component exists in both the S1 and S2 packages, and whether each actually
has the bug. Don't assume both do; verify.

## Step 3 — Draft the issue

Title: a short statement of the problem, prefixed with `S2` if it's S2-only (e.g. "S2 Line:
dotted line gap too tight").

Body:

```markdown
## Summary

One or two sentences.

## Symptom
<!-- Feature requests: "## Motivation" instead. -->

What the user sees.

**Expected:** ...
**Actual:** ...

## Root cause
<!-- Feature requests: "## Proposed behavior" instead. -->

Technical explanation with `file:line` references. Say if it's unconfirmed.

## Cross-cutting concerns

- [ ] Hover animation
- [ ] Controlled highlight
- [ ] Legend interaction
- [ ] Tooltip or popover
- [ ] New signal or scale
- [ ] S1/S2 parity

Notes for any that are checked.

## Implementation plan

- `path/to/file.ts` — what changes and why

## Open questions

- ...
```

Check every cross-cutting item against the code; don't leave one unchecked without looking.
Keep the root cause to a tight paragraph per defect. If the investigation found a separate
defect, draft a separate issue and link them.

Labels: `bug` or `enhancement`, `rsc:<Component>` for each affected component, and `s2`
if it affects S2.

## Step 4 — Confirm and create

Show the user the title, labels, and body. Create the issue only after they approve:

```bash
gh issue create --repo adobe/react-spectrum-charts --title "..." --label bug --label s2 \
  --label rsc:Line --body-file <file>
```

Report the issue URL.
