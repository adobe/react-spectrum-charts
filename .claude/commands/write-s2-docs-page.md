# Write an S2 Docs Page

Use this skill when writing or updating a component page in `packages/docs-s2`, the S2 docs
site. `docs/donut.mdx` and `src/playgrounds/donut.tsx` are the reference implementation; when
this skill and the Donut page disagree, follow this skill and fix the Donut page.

Also use it when a feature or bug fix changes a component's props, defaults, or behavior: the
component's docs page and dev dashboard both need to reflect the change (Step 9).

---

## Step 1 — Inventory the component

Before writing anything, list everything the page has to cover:

- **Props** — every prop in the component's S2 options type
  (`packages/vega-spec-builder-s2/src/types/`) and its React props type
  (`packages/react-spectrum-charts-s2/src/types/`). Include callbacks and props that only apply
  in combination (e.g. `sortOrder` with `variant="semicircle"`).
- **Children** — every child component accepted in `childrenAdapter.ts` for this component.
- **Siblings** — every `Chart`-level prop and sibling component that changes this component's
  behavior: `Axis`, `Legend`, `Title`, `ChartInspect`, `ChartPopover`, `ChartActionBar`,
  `hiddenSeries`, `highlightedSeries`/`highlightedItem`, `animationTypes`, `locale`, `loading`,
  `emptyStateText`, sizing.
- **Data shapes** — required fields, defaults (`value`, `series`, `datetime`), edge cases
  (all zeros, empty array, single point, nulls, booleans, negatives).
- **Behavior** — read the spec builder for defaults and rules a user can't infer from prop
  names (sort order, label collision, hover fading, what gets disabled when).
- **Dev dashboard** — `packages/react-spectrum-charts-s2/src/dev/<Component>/Dashboards/` if one
  exists. Its coverage map lists every prop, child, and sibling the component interacts with;
  use it as a starting checklist, and every variation group there should map to a section or
  playground control on the page.
- **Gaps** — compare against the S1 types (`packages/vega-spec-builder/src/types/`) to find
  props S2 doesn't support yet. These go in a `:::note`.

Write the inventory down (session workspace or todo list) and check it off as the page is
written. Nothing in it should be left uncovered unless it's listed as unsupported.

## Step 2 — Verify behavior before describing it

Every claim on the page must be checked against source or a running example: defaults,
thresholds, interactions, what happens at edges. If behavior looks wrong, don't document the
bug as behavior; file it (Step 8) and either work around it in the example or leave it out.

## Step 3 — Page structure

File: `packages/docs-s2/docs/<component>.mdx`, lowercase, hyphenated.

Frontmatter:

```yaml
---
stage: alpha # lab | alpha | beta | rc | stable — matches the component's TSDoc tag
sidebar_position: 3
title: Donut
description: One sentence, what the component is for. Used by search and llms.txt.
---
```

Body, in this order (omit sections that don't apply):

1. `# Title`, then `<StageBadge />`, then a one- or two-sentence intro, then the main
   playground.
2. `## Data` — data shape, which props name the fields, defaults, one `<DataCode>` per dataset
   used, and a minimal code block. Subsections for special data (`### Boolean data`,
   `### Zero, empty, and loading`).
3. Sections for the component's own appearance and options, named by task or by the prop when
   the prop name is the clearest label (`## Shape`, `### holeRatio`, `### Size`).
4. One `##` section per child component, named after the component (`## DonutSummary`,
   `## SegmentLabel`).
5. One `##` section per relevant sibling (`## Legend`, `## Axis`), covering only how it behaves
   with this component. Link to the sibling's own page for the full reference.
6. `## Interaction` — `ChartInspect`/`ChartPopover`, highlighting, keyboard support (or a
   `:::note` that it isn't supported).
7. `## Animation` — `animationTypes` and what each animation does for this component.
8. `## API` — one `###` per component with `<PropsTable component="X" />`, plus any prose about
   props that don't fit a section (e.g. `name`).

Writing rules:

- Lead with what the user wants to do, then the prop. Describe behavior, not implementation.
- Put prop lists in bullets when a section introduces three or more props.
- Keep prose short. Don't repeat what the PropsTable already says.
- Use `:::note` for unsupported features and known limits.
- Link to other pages with relative links (`./legend.mdx#position`).

## Step 4 — Playgrounds

Playgrounds go in `packages/docs-s2/src/playgrounds/<component>.tsx`, one exported component
per example, named `<Component><Topic>Playground`. Each uses `PropPlayground`
(`src/components/examples/PropPlayground.tsx`) and the docs `Chart` wrapper (`DocsChart`).

- **Coverage** — every prop, child, and sibling from Step 1 is either a control in some
  playground or shown in a dedicated example. Props that only apply in some states use
  `isDisabled` so the control is disabled when it has no effect.
- **Controls** — group controls by the component that owns the prop (`group: 'Legend'`). Use
  `doc: 'Component.prop'` so the info popover shows the prop's TSDoc. Defaults must match the
  library defaults so the generated code omits them.
- **Generated code** — the code panel is generated from the rendered element. Check that it's
  minimal and copy-pasteable: no props equal to defaults, no docs-only props.
- **Consistent size** — add a `get<Component>PreviewSize` helper and pass it as `previewSize`
  on every playground. Size examples to a preset from the component's dev dashboard (Donut uses
  L), leaving room for legends, titles, and labels. Previews never show the size in code.
- **Replay** — set `replay` on any playground where an animation is the point.
- **Data** — add datasets to `src/components/examples/data.ts` and show them with
  `<DataCode name="..." />`. Reuse existing datasets when they fit. Keep data realistic and
  small; avoid data that triggers known bugs.
- **Markdown export** — agents implement from the page's `.md` export, which is built from the
  rendered HTML. Wrap custom browser-only examples in `ClientOnly` and pass `markdown` with the
  code, data, and tables an agent needs; `PropPlayground` already exports its code and controls.
  Wrap interaction-only instructions in `WebOnly`.

## Step 5 — TSDoc

The PropsTable and control popovers read TSDoc through `plugins/docgenPlugin.js`. Every prop
of every component on the page needs a TSDoc description that states what it does and its
default. Fix missing or wrong TSDoc in the S2 types, not in the docs page.

## Step 6 — Register the page

- **Sidebar** — add the doc id to `packages/docs-s2/sidebars.ts` (lab components under a Lab
  category).
- **Search card** — chart types get an entry in `src/search/chartExamples.tsx`: `docId`,
  `title`, `components` (the chart and its children, so their prop names match), `keywords`
  (synonyms not in the title, e.g. "pie" for Donut), small `data`, and `marks`. Non-chart
  components don't get a card; they're found through page search.
- **Stage** — `stage` in frontmatter must be a key in `src/stages.json`. `searchPlugin`
  fails the build otherwise.

## Step 7 — Validate

From `packages/docs-s2`:

```bash
yarn -s typecheck
rm -rf .docusaurus && ../../node_modules/.bin/docusaurus build --out-dir /tmp/docs-s2-build
```

Then, from the repo root, `yarn lint --quiet`. In the built site, check:

- Every playground renders, every control changes the chart, and disabled controls are
  disabled only when they should be.
- Generated code matches the rendered chart.
- `/llms.txt` lists the page and `/<page>.md` reads cleanly as Markdown, with every example's
  code, data, and controls.
- The page and its props show up in search, and the chart card appears.

## Step 8 — File bugs found along the way

Use the `file-issue` skill for library bugs or missing behavior found while writing the page.
Don't fix library bugs in the docs PR.

## Step 9 — Keep docs and dashboards current

When a feature or fix adds or changes a prop, child, or behavior of an S2 component:

1. Update the component's dev dashboard
   (`packages/react-spectrum-charts-s2/src/dev/<Component>/Dashboards/`) so the new variation
   is covered.
2. Update the component's docs page: add or extend a playground control or section, and
   check the TSDoc so the PropsTable is right.
3. If the change affects a sibling (Legend, Axis, ...), check that sibling's page and
   dashboard too.
