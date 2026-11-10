---
name: s2-data-navigator
description: Architecture and extension guide for S2 keyboard navigation (`accessibleNavigation`, the `dataNavigator` module) — controller, session, chart/axis/legend regions, per-chart strategies and spec-builder focus rings. Use when fixing a keyboard-navigation bug, making a new chart type (e.g. Line) navigable, changing chart, axis or legend navigation, or reviewing a `dataNavigator/` change.
---

# S2 data navigator

Keyboard navigation for S2 charts, turned on by `<Chart accessibleNavigation>`. The user-facing behavior is documented in `packages/docs/docs/spectrum2/keyboard-navigation.md`; keep it in sync with any behavior change.

Always read [`references/architecture.md`](references/architecture.md) first. It covers the layers, the file map, the remount and focus-restore lifecycle, and the rules every change must follow.

Then read only the references for the area you're changing:

| Reference                                                     | Read when you're…                                                                                  |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`chart-region.md`](references/chart-region.md)               | changing how chart marks are focused, hovered, clicked or right-clicked, or the canvas focus rings |
| [`axis-region.md`](references/axis-region.md)                 | changing bottom-axis label navigation                                                              |
| [`legend-region.md`](references/legend-region.md)             | changing legend navigation, toggling, or legend popovers                                           |
| [`adding-a-chart-type.md`](references/adding-a-chart-type.md) | making a new mark type navigable                                                                   |
| [`testing.md`](references/testing.md)                         | writing or debugging navigation tests                                                              |

Navigation is S2-only: there's no S1 counterpart to mirror.
