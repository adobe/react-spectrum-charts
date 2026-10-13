# Planning Process

How work is proposed, tracked, and recorded in react-spectrum-charts.

| Work | Where it lives |
|---|---|
| Bug | GitHub issue |
| Small feature (a prop, an option, a contained behavior change) | GitHub issue |
| New chart type | GitHub issue or PR; it starts in [lab](#stages) |
| Significant or uncertain change (new subsystem, cross-chart API, moving a component from lab to alpha) | RFC in [`rfcs/`](../rfcs) |
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

Write an RFC when a change needs design agreement before it's built: a new subsystem or
cross-chart API, a behavior change that affects many components, or moving a component from
lab to alpha (see [Stages](#stages)). Bugs and small features don't need one.

RFCs live in `rfcs/<slug>.md`, for example `rfcs/s2-remove-vega-embed.md`. Use a short,
descriptive slug with no number. Start from [`rfcs/template.md`](../rfcs/template.md).

### Lifecycle

1. **Draft.** Open a PR that adds `rfcs/<slug>.md`. Discussion happens on the PR. Opening it
   early is fine.
2. **Review.** Reviewers comment on the PR, and the author updates the doc in place.
3. **Decision.** Two maintainers approve.
   - **Accepted:** merge. The doc is now frozen.
   - **Rejected:** close the PR without merging. The PR is the record.
4. **Implementation.** Create an issue for each row of the RFC's **Scope** table and assign it
   to the milestone for its stage (see [Stages](#stages)). List the milestones on the RFC's
   `Tracking` line. If the scope spans several components and doesn't map to milestones,
   create a parent issue with the scope issues as sub-issues, and link that instead.
5. **Done.** The RFC is implemented when its milestones (or parent issue) are closed.

Prototype PRs can be opened before an RFC is accepted, but they don't merge until it is.

### After acceptance

An accepted RFC doesn't change, except for:

- typo fixes and clarifications that don't change the design
- the `Tracking` line

The Scope table is a record of what was agreed, not a tracker. After acceptance, the
milestones are the live plan: moving an issue to another milestone doesn't need an RFC edit.
If a move changes what a stage delivers (for example, deferring accessibility out of beta),
explain why in a comment on the issue.

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

Components move through alpha, beta, RC, and stable. Components without a finalized design
and no commitment to graduate live in **lab**, outside the pipeline. The definitions, the RC
period rules, and what counts as a blocking issue are user-facing and live in the docs:
[Component Stages](../packages/docs/docs/spectrum2/stages.md).

### Lab

Every new chart type starts in lab, even one expected to graduate. Anyone can propose one
with an issue or PR; maintainers decide whether it fits the library. Lab components don't
need an RFC.

Moving a component from lab into alpha needs a finalized design and an RFC. Later graduations
need an RFC only if the scope changes.

A lab component can be removed when maintainers decide it doesn't fit the project's goals and
its usage is low. Announce the removal in a changeset.

### Milestones

Each component has a GitHub milestone for its **next** stage, named for the stage the work
unlocks: `<Component> <stage>`, e.g. `Line beta`. Work done while a component is in alpha that
the beta definition requires (such as finishing accessibility) goes in `Line beta`. When the
component graduates, close the milestone and create the next one. Lab components don't have
milestones.

### Marking a component's stage

A graduation PR updates every place the stage shows:

- the TSDoc tag on the component and its props type: `@alpha`, `@beta`, or `@beta` with
  "Release candidate" for RC; stable components have none
- the Storybook `tags` in the default export of every story file for the component (e.g.
  `tags: ['beta']`; use `'lab'` for lab components), which show as a badge in the sidebar
- the stage badge on the component's docs page
- a changeset announcing the stage change

Experimental props on otherwise stable components use an `UNSAFE_` prefix instead.

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
