---
name: defaultHiddenSeries bar reposition bug
description: Hiding a series via defaultHiddenSeries does not reposition remaining bars on local dev; not reproducible on hosted app
type: project
---

With `defaultHiddenSeries={['Other']}` set, toggling an additional series ("Windows") via the legend does not reposition the remaining bars. The initial `defaultHiddenSeries` state works correctly — the bug only triggers when the user hides a second series on top of an existing default hidden series.

Reproduced on both `reactUpgrade` and `main` locally. The hosted Storybook does not show the issue but is likely just out of sync with a recent regression on main — not a React 19-specific bug.

**Why:** Likely related to the known `encode.enter` issue — stacked bar positions are computed in `encode.enter` only and require a full re-embed to reposition. The interaction between the initial `defaultHiddenSeries` signal seed and subsequent runtime legend toggles may not be triggering the re-embed needed to recalculate bar positions.

**How to apply:** Investigate on main first to confirm the regression. Reproduce with `defaultHiddenSeries={['Other']}` + toggling "Windows" off via the legend.
