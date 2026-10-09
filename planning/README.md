# Planning Process

How work is proposed, tracked, and recorded in react-spectrum-charts.

| Work | Where it lives |
|---|---|
| Bug | GitHub issue |
| Small feature (a prop, an option, a contained behavior change) | GitHub issue |
| Significant or uncertain change (new chart type, new subsystem, cross-chart API, stage graduation) | RFC in [`rfcs/`](../rfcs) |
| Open-ended research before a proposal exists | Research note in [`planning/research/`](./research) |
| Durable architecture knowledge | `.claude/architecture-*.md` |

There are no separate decision records. A merged RFC is the record of the decision.

---

## Issues

Bugs and small features are GitHub issues. Use the issue templates, or the `file-issue`
skill, which investigates the root cause and drafts the issue body.

**Labels**

- Type: `bug` or `enhancement`
- Component: `rsc:<Component>` (e.g. `rsc:Line`, `rsc:Donut`)
- Variant: `s2` for Spectrum 2 issues
- `needs grooming` until the issue is understood well enough to pick up

**A good bug issue** states the current, accurate understanding, not the history of the
investigation:

- **Summary and symptom.** What a user sees, with expected vs. actual behavior.
- **Root cause.** A short explanation with `file:line` references. If it's unconfirmed, say so
  and give the leading hypothesis.
- **Cross-cutting concerns.** See [the checklist below](#cross-cutting-concerns).
- **Implementation plan.** The files to change and the direction of the fix.
- **Open questions.**

If an investigation turns up a related but separate defect, file a separate issue and link
it. Don't add it to the existing issue.

When the understanding changes, edit the issue body so it stays accurate, and add a comment
noting what changed.

Issues close when the fix or feature merges, or when the stage they're scheduled for ships.

---

## RFCs

Write an RFC when a change needs design agreement before it's built: a new chart type, a
new subsystem or cross-chart API, a behavior change that affects many components, or
graduating a component to its next [stage](#stages). Bugs and small features don't need one.

RFCs live in `rfcs/<slug>.md`, for example `rfcs/s2-remove-vega-embed.md`. Use a short,
descriptive slug with no number. Start from [`rfcs/template.md`](../rfcs/template.md).

### Lifecycle

1. **Draft.** Open a PR that adds `rfcs/<slug>.md` with `Status: Draft`. Discussion happens on
   the PR. Opening it early is fine.
2. **Review.** Reviewers comment on the PR, and the author updates the doc in place.
3. **Decision.** Two maintainers approve.
   - **Accepted:** set `Status: Accepted` and merge. The doc is now frozen.
   - **Rejected:** close the PR without merging. The PR is the record.
4. **Implementation.** Each item in the RFC's **Scope** table is a GitHub issue. Create a parent
   issue for the RFC and add the scope issues as its sub-issues. Assign each issue to the
   milestone of the stage it ships in. Progress is tracked on the issues, not in the RFC.
5. **Done.** When every in-scope issue has shipped, set `Status: Implemented`.

Prototype PRs can be opened before an RFC is accepted, but they don't merge until it is.

### After acceptance

An accepted RFC doesn't change, except for:

- typo fixes and clarifications that don't change the design
- the `Status` line

New requirements become new issues in the right milestone. A real design change needs a
short follow-up RFC that links back to the original.

### Scope

An RFC's Scope table maps each piece of work to a linked issue and the stage it ships in.
For example:

| Issue | Description | Stage |
|---|---|---|
| #123 | Benchmark marker | alpha |
| #124 | Trellis layout | beta |
| #125 | Connector lines | deferred |

`deferred` items are out of scope for this RFC. Their issues stay open for a future RFC or
stage.

---

## Stages

Components move through pre-alpha, alpha, beta, RC, and stable. The definitions are
user-facing and live in the docs:
[Component Stages](../packages/docs/docs/spectrum2/stages.md).

Each stage has a GitHub milestone per component, e.g. `Donut alpha`, created when the first
issue needs it. Graduating a component to alpha needs an RFC. Later graduations need one only
if the scope changes.

---

## Research

Use a research note when the question is still open, for example comparing approaches for a
new chart type or investigating how a library behaves. Copy
[`planning/research/TEMPLATE.md`](./research/TEMPLATE.md) to `planning/research/<topic>.md`, or
`planning/research/<topic>/<topic>.md` if it has supporting files.

Research notes aren't reviewed like RFCs. When a note reaches a recommendation, set its
status to `Ready for RFC` and write the RFC, linking back to the note.

---

## Cross-cutting concerns

These subsystems are easy to miss and have caused bugs when they were. Check each one for
every bug fix, feature, and RFC, and explain any that apply.

- [ ] **Hover animation.** Does hovering need to animate this, or does this need to take part in
  existing hover animation (`hoverAnimationUtils.ts`, `usermeta.animatedMark`)?
- [ ] **Controlled highlight.** Does this need to respect or set highlight state that comes from
  props rather than the mouse (`CONTROLLED_HIGHLIGHTED_TABLE`, `CONTROLLED_HIGHLIGHTED_SERIES`)?
- [ ] **Legend interaction.** Does hovering or clicking the legend need to affect this, or
  the other way round (`legendHighlightSignals`)?
- [ ] **Tooltip or popover.** Does this need its own tooltip or popover, or change what an
  existing one shows (`isInteractive`, `interactiveMarkName`, `COMPONENT_NAME`)?
- [ ] **New signal or scale.** Does this need a new Vega signal (with a matching set and clear)
  or a new or extended facet scale?
- [ ] **S1/S2 parity.** Does the sibling file in the other package need the same change?

## Edge cases

Not exhaustive, but check each against a feature: empty or null data, a single data point,
many series (color scale overflow), long or truncated labels, narrow and responsive sizes,
light and dark backgrounds, S1/S2 parity, keyboard and screen reader access, and conflicts
with hover or selection state.
