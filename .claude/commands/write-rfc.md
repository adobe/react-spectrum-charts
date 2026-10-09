# Write an RFC

Use when a change needs design agreement before it's built: a new chart type, a new
subsystem or cross-chart API, a behavior change across many components, or graduating a
component to its next stage. Bugs and small features don't need an RFC; use `file-issue`.

Read `planning/README.md` first, particularly "RFCs," "Stages," and "Cross-cutting
concerns." Start from `rfcs/template.md`.

`$ARGUMENTS` is whatever has been gathered so far: freeform notes, a research note, a Jira
ticket, a Figma link, or existing GitHub issues. Don't assume a fixed shape.

---

## Step 1 — Gather the inputs

- Read any referenced notes or `planning/research/` note.
- Fetch the Jira ticket via `mcp__corp-jira__*` if one is given. Ticket descriptions often
  contain exact design values.
- Fetch the Figma node via `mcp__figma__*` if a Figma URL is given.
- For S2 design values, check `llm/skills/s2-<chartType>/<chartType>-chart-tokens/SKILL.md`
  first if it exists. It's the authoritative source for that chart's tokens.
- List the existing GitHub issues this RFC covers:

  ```bash
  gh issue list --repo adobe/react-spectrum-charts --state open --label rsc:<Component>
  ```

If the target component or the goal is unclear, ask before going further.

## Step 2 — Explore the relevant code

If the environment provides a semantic code-search or navigation tool, prefer it over
reading full files. Read the target mark's `*Options`/`*SpecOptions` types and spec builder
files, and the equivalent S1 files. If S1 already solves the same problem, the design should
reuse its approach unless there's a reason not to.

For each item in the cross-cutting checklist, read the relevant mechanism rather than
guessing.

## Step 3 — Write the RFC

Write `rfcs/<slug>.md` from the template, with `Status: Draft`. Use a short, descriptive slug
with no number (e.g. `s2-donut-alpha`).

- **Detailed Design:** the proposed API (props, types, defaults) with examples, the behavior,
  and how it fits the existing architecture. Cover the edge cases in `planning/README.md`
  that apply.
- **Scope:** one row per piece of work, each with an existing or proposed issue and a stage
  (`alpha`, `beta`, `rc`, `stable`, or `deferred`). Mark proposed issues as "new" until they
  exist.
- **Cross-Cutting Concerns:** say which subsystems the design touches and how.
- **Alternatives** and **Drawbacks:** include the options you rejected and why.
- **Open Questions:** anything reviewers need to decide.

Keep implementation detail at the level of "which files and functions change." Line-level
plans go in the issues.

## Step 4 — Report

Summarize the RFC for the user: the design in a few sentences, the scope table, and the open
questions. Open a PR only after the user approves.

Once the RFC is accepted, create the parent issue and the scope issues (sub-issues of the
parent), assign each to its stage milestone, and fill in the RFC's `Parent Issue` field.
