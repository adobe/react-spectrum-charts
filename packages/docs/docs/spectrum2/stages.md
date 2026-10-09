---
sidebar_position: 2
---

# Component Stages

Each Spectrum 2 component moves through these stages on its way to stable. The stage tells you
how much the API and visuals may still change.

| Stage | What it means |
|---|---|
| **Pre-alpha** | Functional, but without a finalized Spectrum 2 design. Imported from the `pre-alpha` subpath. The API and visuals can change without notice. See [Pre-Alpha Components](./pre-alpha.md). |
| **Alpha** | The Spectrum 2 design is finalized and the core feature set is implemented. The API can still change; breaking changes are called out in the changelog. |
| **Beta** | The planned feature set is complete. API changes go through deprecation rather than breaking. Work focuses on feedback and fixes. |
| **RC** | No known blocking issues, and documentation is complete. Only bug fixes. |
| **Stable** | Follows semver. |

Components in the Pre-Alpha section of these docs are pre-alpha; the rest are alpha.

Planned work for each stage is tracked in GitHub milestones named `<Component> <stage>`
(e.g. `Donut alpha`).
